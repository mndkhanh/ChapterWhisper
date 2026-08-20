import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  getDataDir,
  getTextModel,
  getImageModel,
  getStepStaleMs,
} from "../config.js";
import {
  createInteraction,
  outputText,
  outputImage,
  jsonSchemaFormat,
  parseJsonOutput,
} from "../gemini/client.js";
import type { InputPart } from "../gemini/client.js";
import { mutateProject } from "./project-store.js";
import type { Project, StepAttempt } from "./types.js";

const SYSTEM_INSTRUCTIONS = `There must be no text on the image, it should not look like a cover page.
It should be a full illustration with no borders, titles, nor description.
Unless asked otherwise, stay family-friendly with uplifting colors.
Each produced should be a simple image, no panels.`;

export async function ingestBook(project: Project): Promise<string> {
  const interaction = await createInteraction({
    model: getTextModel(),
    input: [
      {
        type: "text",
        text: "Here's a book, to illustrate using Nano Banana. Don't say anything for now, instructions will follow.",
      },
      { type: "text", text: project.bookText },
    ],
  });
  return interaction.id;
}

export async function executeStep(
  project: Project,
  stepIndex: number,
  customStyleOverride?: string,
): Promise<Project> {
  const currentStatus = project.statuses[stepIndex];
  const now = Date.now();
  const startedAtIso = new Date(now).toISOString();

  // A completed step is final. Re-running one would spend a Gemini call to
  // overwrite a good result, and for step 01 it silently did nothing at all
  // while still reporting success. Retries exist for `failed`, not for `done`.
  if (currentStatus === "done") {
    const err = new Error("Step is already complete and cannot be run again");
    (err as any).status = 409;
    throw err;
  }

  if (currentStatus === "running") {
    const elapsed = now - (project.stepStartedAt || 0);
    if (elapsed < getStepStaleMs()) {
      const err = new Error("Step is already in progress");
      (err as any).status = 409;
      throw err;
    }
  }

  if (currentStatus === "locked") {
    const err = new Error("Preceding step must be completed first");
    (err as any).status = 400;
    throw err;
  }

  await mutateProject(project.id, (p) => {
    p.statuses[stepIndex] = "running";
    p.stepStartedAt = now;
    p.error = null;
    return p;
  });

  try {
    let updated: Project;
    switch (stepIndex) {
      case 0:
        updated = await runStep1Style(project, customStyleOverride);
        break;
      case 1:
        updated = await runStep2Characters(project);
        break;
      case 2:
        updated = await runStep3Portraits(project);
        break;
      case 3:
        updated = await runStep4Chapters(project);
        break;
      case 4:
        updated = await runStep5Illustration(project);
        break;
      default:
        throw new Error(`Invalid step index: ${stepIndex}`);
    }

    const finishMs = Date.now();
    const attempt: StepAttempt = {
      id: randomUUID(),
      stepIndex,
      startedAt: startedAtIso,
      finishedAt: new Date(finishMs).toISOString(),
      durationMs: finishMs - now,
      status: "done",
      error: null,
    };

    return await mutateProject(project.id, (p) => {
      p.attempts = [...(p.attempts || []), attempt];
      return p;
    });
  } catch (err: any) {
    const finishMs = Date.now();
    const attempt: StepAttempt = {
      id: randomUUID(),
      stepIndex,
      startedAt: startedAtIso,
      finishedAt: new Date(finishMs).toISOString(),
      durationMs: finishMs - now,
      status: "failed",
      error: err.message || "Step execution failed",
    };

    return await mutateProject(project.id, (p) => {
      p.statuses[stepIndex] = "failed";
      p.stepStartedAt = null;
      p.error = err.message || "Step execution failed";
      p.attempts = [...(p.attempts || []), attempt];
      return p;
    });
  }
}

async function runStep1Style(
  project: Project,
  customStyleOverride?: string,
): Promise<Project> {
  let styleText = customStyleOverride || project.style;
  let interactionId = project.interactions.styleId;

  if (!styleText) {
    const interaction = await createInteraction({
      model: getTextModel(),
      input:
        "Based on the book's narrative tone, era, mood, and genre, define a cohesive visual art style (such as Golden-Age oil painting, ink & wash, or fine-art book illustration) that best fits the story with a unique thematic twist. Provide only a concise 1-2 sentence visual description and color palette prompt that will be prepended to all future illustration prompts.",
      previous_interaction_id: project.interactions.ingestionId,
    });
    styleText = outputText(interaction) || "Ink & Wash";
    interactionId = interaction.id;
  } else if (!interactionId) {
    const interaction = await createInteraction({
      model: getTextModel(),
      input: `The art style will be: "${styleText}". Keep that in mind when generating future prompts. Keep quiet for now, instructions will follow.`,
      previous_interaction_id: project.interactions.ingestionId,
    });
    interactionId = interaction.id;
  }

  return await mutateProject(project.id, (p) => {
    p.style = styleText;
    p.interactions.styleId = interactionId;
    p.statuses[0] = "done";
    p.stepStartedAt = null;
    if (p.statuses[1] === "locked") p.statuses[1] = "ready";
    return p;
  });
}

async function runStep2Characters(project: Project): Promise<Project> {
  const schema = jsonSchemaFormat({
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        prompt: { type: "string" },
      },
      required: ["name", "prompt"],
    },
  });

  const interaction = await createInteraction({
    model: getTextModel(),
    input:
      "Can you describe the main characters (only the adults) and prepare a prompt describing them with as much details as possible (use the descriptions from the book) so Nano Banana can generate images of them? Each prompt should be at least 50 words, detailing exact facial features, hair, eye color, age, silhouette, signature clothing, materials, colors, and physical build.",
    previous_interaction_id: project.interactions.styleId,
    response_format: schema,
  });

  const parsed = parseJsonOutput(interaction) as Array<{
    name: string;
    description?: string;
    prompt: string;
  }>;
  const characters = (parsed || []).slice(0, 2).map((c, i) => ({
    id: `c${i + 1}`,
    name: c.name,
    description: c.description || c.prompt,
    prompt: c.prompt,
  }));

  return await mutateProject(project.id, (p) => {
    p.characters = characters;
    p.interactions.charactersId = interaction.id;
    p.statuses[1] = "done";
    p.stepStartedAt = null;
    if (p.statuses[2] === "locked") p.statuses[2] = "ready";
    return p;
  });
}

async function runStep3Portraits(project: Project): Promise<Project> {
  const storageDir = path.join(
    getDataDir(),
    "storage",
    project.id,
    "portraits",
  );
  await fs.mkdir(storageDir, { recursive: true });

  let lastInteractionId = project.interactions.charactersId;
  const updatedChars = [...project.characters];

  for (let i = 0; i < updatedChars.length; i++) {
    const char = updatedChars[i];
    const promptText = `Create an illustration portrait of character "${char.name}" in the art style "${project.style || ""}". Character visual details: ${char.prompt}. Clear individual portrait, character centered, showing exact face, hair, and clothing.`;
    const interaction = await createInteraction({
      model: getImageModel(),
      input: promptText,
      previous_interaction_id: lastInteractionId,
      system_instruction: SYSTEM_INSTRUCTIONS,
    });
    const { buffer } = outputImage(interaction);
    const filePath = path.join(storageDir, `${char.id}.png`);
    await fs.writeFile(filePath, buffer);
    char.portraitUrl = `/api/projects/${project.id}/portraits/${char.id}`;
    lastInteractionId = interaction.id;
  }

  return await mutateProject(project.id, (p) => {
    p.characters = updatedChars;
    p.interactions.portraitsId = lastInteractionId;
    p.statuses[2] = "done";
    p.stepStartedAt = null;
    if (p.statuses[3] === "locked") p.statuses[3] = "ready";
    return p;
  });
}

async function runStep4Chapters(project: Project): Promise<Project> {
  // The model picks the cast, but it must hand back *our* ids rather than
  // display names: matching prose names back to c1/c2 downstream is guesswork,
  // and a miss silently widens the cast again. `enum` makes the id the only
  // thing structured output will accept.
  const castIds = project.characters.map((c) => c.id);
  const schema = jsonSchemaFormat({
    type: "object",
    properties: {
      name: { type: "string" },
      prompt: { type: "string" },
      characters: { type: "array", items: { type: "string" } },
      characterIds: {
        type: "array",
        items: { type: "string", enum: castIds },
      },
    },
    required: ["name", "prompt", "characterIds"],
  });

  const charDetails = project.characters
    .map((c) => `Character id "${c.id}" — "${c.name}": ${c.prompt}`)
    .join("\n");

  const promptInput = `Pick the single most illustratable scene in the book and provide one detailed prompt to illustrate it. It should be a single standalone image plate, not a multi-tiled page.

The main characters in this story and their exact established visual designs are:
${charDetails}

Write a descriptive scene prompt for this chapter. If any of the characters above appear in the scene, explicitly refer to them by name and weave their exact visual features (attire, physical traits, colors) into the scene prompt so the image generator maintains strict visual consistency. In "characters" list their display names, and in "characterIds" list the matching character ids exactly as given above — only those who genuinely appear in this scene.`;

  const interaction = await createInteraction({
    model: getTextModel(),
    input: promptInput,
    previous_interaction_id:
      project.interactions.charactersId ||
      project.interactions.styleId ||
      project.interactions.ingestionId,
    response_format: schema,
  });

  type ChapterOut = {
    name: string;
    prompt: string;
    characters?: string[];
    characterIds?: string[];
  };
  const parsed = parseJsonOutput(interaction) as ChapterOut | ChapterOut[];
  const ch = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!ch?.prompt) throw new Error("Gemini did not return a chapter scene");

  return await mutateProject(project.id, (p) => {
    p.chapters = [
      {
        id: "ch1",
        name: ch.name,
        prompt: ch.prompt,
        characters: ch.characters || [],
        // Keep only ids we actually issued — a model can still hallucinate one.
        characterIds: (ch.characterIds || []).filter((id) =>
          castIds.includes(id),
        ),
      },
    ];
    p.chapterIndex = 0;
    p.interactions.chaptersId = interaction.id;
    p.statuses[3] = "done";
    p.stepStartedAt = null;
    if (p.statuses[4] === "locked") p.statuses[4] = "ready";
    return p;
  });
}

/**
 * The cast step 04 said actually appears in the scene, resolved in three tiers.
 *
 * 1. `characterIds` — the authoritative link. Step 04 is asked for our own ids
 *    under an `enum`, so structured output cannot return anything else.
 * 2. Display names — the fallback for chapters recorded before step 04 returned
 *    ids. Case-insensitive and tolerant of "Old Toad" for a stored "Toad".
 * 3. The whole cast — last resort, so a scene is never illustrated with an
 *    empty stage. This tier is the one that produced the wrong headcount, which
 *    is why the tiers above it exist.
 */
function sceneCast(project: Project): Project["characters"] {
  const chapter = project.chapters[0];

  const ids = (chapter?.characterIds ?? []).filter(Boolean);
  if (ids.length > 0) {
    const byId = project.characters.filter((c) => ids.includes(c.id));
    if (byId.length > 0) return byId;
  }

  const named = (chapter?.characters ?? [])
    .map((n) => n.toLowerCase().trim())
    .filter(Boolean);
  if (named.length > 0) {
    const byName = project.characters.filter((c) => {
      const name = c.name.toLowerCase().trim();
      return named.some(
        (n) => n === name || n.includes(name) || name.includes(n),
      );
    });
    if (byName.length > 0) return byName;
  }

  return project.characters;
}

async function runStep5Illustration(project: Project): Promise<Project> {
  const ch = project.chapters[0];
  if (!ch) throw new Error("No chapter defined to illustrate");

  const storageDir = path.join(
    getDataDir(),
    "storage",
    project.id,
    "illustrations",
  );
  await fs.mkdir(storageDir, { recursive: true });

  const cast = sceneCast(project);
  const charDescriptions = cast
    .map((c) => `- Character "${c.name}": ${c.prompt}`)
    .join("\n");

  const promptText = `Create a masterwork illustration for the scene "${ch.name}".

Art Style:
${project.style || "Consistent Fine Art Illustration Style"}

Scene Composition & Narrative Action:
${ch.prompt}

Cast — exactly ${cast.length} ${cast.length === 1 ? "figure appears" : "figures appear"} in this illustration, and no one else:
${charDescriptions}

The reference portraits above show precisely how these characters look. Reproduce each one's face, hair, build and clothing exactly as rendered there. Do not add any other people, background figures, bystanders or crowds, and do not omit any of the named characters. Every figure is an adult; no children. No text, no captions, no split panels.`;

  // The portraits are attached as image parts *and* the call is chained onto the
  // portrait interaction, because neither alone was enough. Step 04 branches
  // back to the text-only `charactersId` (DECISIONS.md §7), so a call chained on
  // `chaptersId` has no portrait anywhere in its ancestry — the model was
  // inventing the cast from the written description every time.
  const inputParts: InputPart[] = [];
  for (const c of cast) {
    const portraitPath = path.join(
      getDataDir(),
      "storage",
      project.id,
      "portraits",
      `${c.id}.png`,
    );
    try {
      const data = await fs.readFile(portraitPath);
      inputParts.push({
        type: "text",
        text: `Reference portrait of "${c.name}":`,
      });
      inputParts.push({
        type: "image",
        data: data.toString("base64"),
        mime_type: "image/png",
      });
    } catch {
      // A missing portrait file is not worth failing a paid image call over —
      // the written description still carries the character.
    }
  }
  inputParts.push({ type: "text", text: promptText });

  const interaction = await createInteraction({
    model: getImageModel(),
    input: inputParts,
    previous_interaction_id:
      project.interactions.portraitsId || project.interactions.chaptersId,
    system_instruction: SYSTEM_INSTRUCTIONS,
  });

  const { buffer } = outputImage(interaction);
  const filePath = path.join(storageDir, `${ch.id}.png`);
  await fs.writeFile(filePath, buffer);

  return await mutateProject(project.id, (p) => {
    const target = p.chapters[0];
    if (target)
      target.illustrationUrl = `/api/projects/${project.id}/illustrations/${ch.id}`;
    p.interactions.illustrationId = interaction.id;
    p.statuses[4] = "done";
    p.stepStartedAt = null;
    return p;
  });
}
