import { getGeminiApiKey, getGeminiBaseUrl } from '../config.js';

/**
 * Thin REST client for the Gemini **Interactions** API.
 *
 * Interactions is what makes the PRD's "send the book once" rule cheap: the
 * server keeps the conversation, and every later step references it by
 * `previous_interaction_id` instead of re-uploading the text. Everything the
 * pipeline needs goes through `createInteraction`, so tests stub this one
 * module rather than intercepting HTTP.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/interactions
 */

export interface TextPart {
  type: 'text';
  text: string;
}

export interface ImagePart {
  type: 'image';
  data: string; // base64
  mime_type: string;
}

export type InputPart = TextPart | ImagePart;

export interface InteractionRequest {
  model: string;
  input: string | InputPart[];
  previous_interaction_id?: string;
  system_instruction?: string;
  response_format?: Record<string, unknown>;
}

export interface Interaction {
  id: string;
  status: string;
  model: string;
  steps: Array<{
    type: string;
    content?: Array<Record<string, unknown>>;
  }>;
}

/** A Gemini call that failed. Carries the HTTP status so callers can say something useful. */
export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * One call. No retry loop lives here or anywhere else on the server — the PRD
 * forbids auto-retry, so a failure propagates to the step runner, is recorded on
 * the project, and waits for the user to press retry.
 */
export async function createInteraction(request: InteractionRequest): Promise<Interaction> {
  let response: Response;
  try {
    response = await fetch(`${getGeminiBaseUrl()}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': getGeminiApiKey(),
      },
      body: JSON.stringify(request),
    });
  } catch (error) {
    throw new GeminiError(`Could not reach Gemini: ${(error as Error).message}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new GeminiError(
      `Gemini returned ${response.status}${body ? `: ${body.slice(0, 500)}` : ''}`,
      response.status,
    );
  }

  return (await response.json()) as Interaction;
}

function contentParts(interaction: Interaction): Array<Record<string, unknown>> {
  return interaction.steps.flatMap((step) => step.content ?? []);
}

/** The concatenated text the model produced. */
export function outputText(interaction: Interaction): string {
  return contentParts(interaction)
    .filter((part) => part.type === 'text')
    .map((part) => String(part.text ?? ''))
    .join('')
    .trim();
}

/** The first image the model produced, as raw bytes ready to write to disk. */
export function outputImage(interaction: Interaction): { buffer: Buffer; mimeType: string } {
  const part = contentParts(interaction).find((candidate) => candidate.type === 'image');
  if (!part || typeof part.data !== 'string') {
    throw new GeminiError('Gemini returned no image for an image request');
  }
  return {
    buffer: Buffer.from(part.data, 'base64'),
    mimeType: String(part.mime_type ?? 'image/png'),
  };
}

/**
 * Structured output. The model is asked for JSON against `schema`, and the text
 * it returns is parsed here — a model that answers with prose instead of JSON is
 * a step failure, not something to paper over with a regex.
 */
export function jsonSchemaFormat(schema: Record<string, unknown>): Record<string, unknown> {
  return { type: 'text', mime_type: 'application/json', schema };
}

export function parseJsonOutput(interaction: Interaction): unknown {
  const text = outputText(interaction);
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError(`Gemini did not return valid JSON: ${text.slice(0, 200)}`);
  }
}
