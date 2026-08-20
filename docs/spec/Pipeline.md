---
title: 5-Step Gemini Pipeline Specification
aliases:
  - Pipeline Spec
  - Pipeline Contract
tags:
  - chapterwhisper
  - spec
  - gemini
  - pipeline
type: spec
status: active
---

# 5-Step Gemini Pipeline Specification

Reference contract derived directly from Google's Book Illustration Cookbook (**"Illustrate a book: The Wind in the Willows"**, sections 1–5).

> [!important] Hard Constraints (Graded)
>
> 1. **Max 2 characters** (adults only, no children) — enforced server-side.
> 2. **Max 1 chapter** — enforced server-side.
> 3. **Single text transmission**: Send book text once at ingestion (Step 00); reuse across subsequent steps via context chaining (`previous_interaction_id`).
> 4. **No auto-retries**: All retry actions must be user-triggered.

---

## Models & API Mechanism

- **Text & JSON Extraction Model**: `gemini-3.7-flash` (or `gemini-2.5-flash`)
- **Conversational Image Generation Model**: `gemini-3.1-flash-image` (Nano Banana family with multi-image conditioning support)
- **Context Chaining Mechanism**: REST `/interactions` endpoint using `previous_interaction_id`.

---

## System Instructions (Negative Rules & Quality Guardrails)

From the reference notebook:

```
There must be no text on the image, it should not look like a cover page.
It should be a full illustration with no borders, titles, nor description.
Unless asked otherwise, stay family-friendly with uplifting colors.
Each produced should be a simple image, no panels.
```

---

## Step 00: Initial Book Ingestion & Anchor Interaction

- **Trigger**: Project creation (server-side background ingestion).
- **Goal**: Ingest full book text once and establish the root conversation anchor.
- **Model**: `gemini-3.7-flash`
- **Input**:
  - `{"type": "text", "text": "Here's a book, to illustrate using Nano Banana. Don't say anything for now, instructions will follow."}`
  - `{"type": "text", "text": book_text}` (or document content part)
- **Output**: Base interaction anchor (`book_interaction.id`). Stored in `project.interactions.ingestionId`.

---

## Step 01: Art Style

- **Goal**: Establish visual medium, color palette, lighting, and mood.
- **Model**: `gemini-3.7-flash`
- **Prompt (if style is generated)**:
  `"Can you define a art style that would fit the story but with a twist? Just give us the prompt for the art syle that will added to the furture prompts."`
- **Prompt (if user provides custom style)**:
  `'The art style will be: "' + userStyle + '". Keep that in mind when generating future prompts. Keep quiet for now, instructions will follow.'`
- **Chaining**: `previous_interaction_id: project.interactions.ingestionId`
- **Output**: Visual style description string stored on `project.style`.
- **State Transition**: Step 1 (`ready` → `running` → `done`). Unlocks Step 2 (`ready`).

---

## Step 02: Characters Extraction (Max 2 Adults)

- **Goal**: Identify primary adult characters and formulate detailed physical portrait prompts.
- **Model**: `gemini-3.7-flash` with structured JSON schema (`response_format`).
- **Prompt**:
  `"Can you describe the main characters (only the adults) and prepare a prompt describing them with as much details as possible (use the descriptions from the book) so Nano Banana can generate images of them? Each prompt should be at least 50 words."`
- **Chaining**: `previous_interaction_id: project.interactions.styleId`
- **Structured JSON Schema**:
  ```json
  {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "prompt": { "type": "string" }
      },
      "required": ["name", "prompt"]
    }
  }
  ```
- **Server-Side Enforcement**: Strictly sliced to **max 2 characters** (adults only).
- **State Transition**: Step 2 (`ready` → `running` → `done`). Unlocks Step 3 (`ready`).

---

## Step 03: Character Portraits Generation

- **Goal**: Generate portrait image for each extracted character (max 2) in the established art style.
- **Model**: `gemini-3.1-flash-image` (conversational image generation).
- **Prompt Format**:
  - Context Setup: `"You are going to generate portrait images to illustrate the book. The style we want you to follow is: {project.style}. Also follow those rules: {system_instructions}"`
  - Per-Character: `"Create an illustration for {character.name} following this description: {character.prompt}"`
- **Chaining**: `previous_interaction_id: project.interactions.charactersId`
- **Output**: PNG image buffers saved locally to `data/storage/{projectId}/portraits/{characterId}.png`.
- **State Transition**: Step 3 (`ready` → `running` → `done`). Unlocks Step 4 (`ready`).

---

## Step 04: Chapter Prompt Extraction (Max 1 Chapter)

- **Goal**: Extract exactly 1 key chapter scene for illustration, referencing established style and character visuals.
- **Model**: `gemini-3.7-flash` with structured JSON schema.
- **Prompt**:
  `"Pick the single most illustratable scene in the book and give me one prompt to illustrate it. It should be a single image, not a multi-tiled page. Be very descriptive, especially of the characters: tell their name and reuse the character prompts if they appear in the image. Also list all characters who appear in it."`
- **Chaining**: `previous_interaction_id: project.interactions.charactersId` (chains from the text interaction history)
- **Structured JSON Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "prompt": { "type": "string" },
      "characters": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["name", "prompt"]
  }
  ```
- **Server-Side Enforcement**: the model is asked for exactly one scene rather than one per
  chapter. A response that comes back as an array anyway is truncated to its first element, so
  the **max 1 chapter** cap holds either way.
- **State Transition**: Step 4 (`ready` → `running` → `done`). Unlocks Step 5 (`ready`).

> [!note] Deliberate deviation from the cookbook
> The notebook asks for a prompt per chapter and then narrows to one. We ask for one scene up
> front. Generating a prompt for every chapter of a full manuscript spends output tokens on work
> the max-1-chapter cap discards immediately, and it was the only reason the UI ever needed a
> chapter picker. **Step 04 takes no user input**: the model chooses the scene, and
> `chapterIndex` is always 0.

---

## Step 05: Chapter Scene Illustration

- **Goal**: Generate full chapter scene artwork referencing the character portraits.
- **Model**: `gemini-3.1-flash-image` with multi-image conditioning.
- **Prompt Format**:
  - Input parts: Reference character portrait images + Prompt:
    `"Create an illustration for {chapter.name} using the previously generated characters following this description: {chapter.prompt}"`
- **Chaining**: `previous_interaction_id: project.interactions.chaptersId`
- **Output**: PNG image saved locally to `data/storage/{projectId}/illustrations/{chapterId}.png`.
- **State Transition**: Step 5 (`ready` → `running` → `done`). Overall project complete.

