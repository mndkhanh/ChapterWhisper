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
import { mutateProject } from "./project-store.js";
import type { Project } from "./types.js";

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
    return updated;
  } catch (err: any) {
    return await mutateProject(project.id, (p) => {
      p.statuses[stepIndex] = "failed";
      p.stepStartedAt = null;
      p.error = err.message || "Step execution failed";
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
      "Can you describe the main characters (only the adults) and prepare a prompt describing them with as much details as possible (use the descriptions from the book) so Nano Banana can generate images of them? Each prompt should be at least 50 words.",
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
    const promptText = `Create an illustration for ${char.name} following this description: ${char.prompt}. The style we want you to follow is: ${project.style || ""}`;
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
  const schema = jsonSchemaFormat({
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        prompt: { type: "string" },
        characters: { type: "array", items: { type: "string" } },
      },
      required: ["name", "prompt"],
    },
  });

  const interaction = await createInteraction({
    model: getTextModel(),
    input:
      "Now, for each chapters of the book, give me a prompt to illustrate what happens in it. It should be a single image, not a multi-tiled page. Be very descriptive, especially of the characters. Be very descriptive and remember to tell their name and to reuse the character prompts if they appear in the images. Also list all characters who appear in it.",
    previous_interaction_id: project.interactions.portraitsId,
    response_format: schema,
  });

  const parsed = parseJsonOutput(interaction) as Array<{
    name: string;
    prompt: string;
    characters?: string[];
  }>;
  const chapters = (parsed || []).slice(0, 1).map((ch, i) => ({
    id: `ch${i + 1}`,
    name: ch.name,
    prompt: ch.prompt,
    characters: ch.characters || [],
  }));

  return await mutateProject(project.id, (p) => {
    p.chapters = chapters;
    p.chapterIndex = 0;
    p.interactions.chaptersId = interaction.id;
    p.statuses[3] = "done";
    p.stepStartedAt = null;
    if (p.statuses[4] === "locked") p.statuses[4] = "ready";
    return p;
  });
}

async function runStep5Illustration(project: Project): Promise<Project> {
  const ch = project.chapters[project.chapterIndex ?? 0] || project.chapters[0];
  if (!ch) throw new Error("No chapter defined to illustrate");

  const storageDir = path.join(
    getDataDir(),
    "storage",
    project.id,
    "illustrations",
  );
  await fs.mkdir(storageDir, { recursive: true });

  const promptText = `Create an illustration for ${ch.name} using the previously generated characters following this description: ${ch.prompt}`;
  const interaction = await createInteraction({
    model: getImageModel(),
    input: promptText,
    previous_interaction_id: project.interactions.chaptersId,
    system_instruction: SYSTEM_INSTRUCTIONS,
  });

  const { buffer } = outputImage(interaction);
  const filePath = path.join(storageDir, `${ch.id}.png`);
  await fs.writeFile(filePath, buffer);
  ch.illustrationUrl = `/api/projects/${project.id}/illustrations/${ch.id}`;

  return await mutateProject(project.id, (p) => {
    p.chapters = [ch];
    p.interactions.illustrationId = interaction.id;
    p.statuses[4] = "done";
    p.stepStartedAt = null;
    return p;
  });
}
