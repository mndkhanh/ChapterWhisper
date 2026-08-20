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
> 3. **Single text transmission**: Send book text once; reuse across steps via context/chat chaining (`previous_interaction_id` or cached context).
> 4. **No auto-retries**: All retry actions must be user-triggered.

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

## Step 00: Initial Book Ingestion & Chat Initiation

- **Notebook Action**: Ingest the book content into Gemini and initialize conversation context.
- **Input**:
  - `{"type": "text", "text": "Here's a book, to illustrate using Nano Banana. Don't say anything for now, instructions will follow."}`
  - `{"type": "document", "content": book_text}`
- **Interaction Role**: Base interaction anchor (`book_interaction.id`). Book text is never re-transmitted in full on subsequent steps.

---

## Step 01: Art Style

- **Goal**: Establish visual medium, color palette, lighting, and mood.
- **Model**: `gemini-2.5-flash` (or current text model).
- **Prompt (if style is empty / generated)**:
  `"Can you define a art style that would fit the story but with a twist? Just give us the prompt for the art syle that will added to the furture prompts."`
- **Prompt (if user provides custom style)**:
  `'The art style will be: "' + userStyle + '". Keep that in mind when generating future prompts. Keep quiet for now, instructions will follow.'`
- **Chaining**: Linked to `previous_interaction_id: book_interaction.id`.
- **Output**: 2-sentence description of visual style. Formatted into `Follow this style: "{style}"`.
- **State Transition**: `CREATED` → `STYLE_SET`

---

## Step 02: Characters Extraction (Max 2 Adults)

- **Goal**: Identify primary adult characters and formulate detailed physical portrait prompts.
- **Model**: `gemini-2.5-flash` with structured JSON schema (`responseMimeType: "application/json"`).
- **Prompt**:
  `"Can you describe the main characters (only the adults) and prepare a prompt describing them with as much details as possible (use the descriptions from the book) so Nano Banana can generate images of them? Each prompt should be at least 50 words."`
- **Chaining**: Linked to `previous_interaction_id: style_interaction.id`.
- **Structured JSON Schema**:
  ```json
  [
    {
      "name": "string",
      "prompt": "string"
    }
  ]
  ```
- **Server-Side Enforcement**: Strictly sliced to **max 2 characters** (adults only).
- **State Transition**: `STYLE_SET` → `CHARACTERS_GENERATED`

---

## Step 03: Character Portraits Generation

- **Goal**: Generate portrait image for each extracted character.
- **Model**: `imagen-3.0-generate-002` (or current image generation model).
- **Aspect Ratio**: Portrait (`9:16` or `1:1`).
- **Prompt Format**:
  - Context Setup: `"You are going to generate portrait images to illustrate the book. The style we want you to follow is: {style}. Also follow those rules: {system_instructions}"`
  - Per-Character: `"Create an illustration for {character.name} following this description: {character.prompt}"`
- **Output**: PNG image saved locally to `data/storage/{projectId}/portraits/{characterId}.png`.
- **State Transition**: `CHARACTERS_GENERATED` → `PORTRAITS_GENERATED`

---

## Step 04: Chapter Prompt Extraction (Max 1 Chapter)

- **Goal**: Extract exactly 1 key chapter scene for illustration, referencing established style and character visuals.
- **Model**: `gemini-2.5-flash` with structured JSON schema.
- **Prompt**:
  `"Now, for each chapters of the book, give me a prompt to illustrate what happens in it. It should be a single image, not a multi-tiled page. Be very descriptive, especially of the characters. Be very descriptive and remember to tell their name and to reuse the character prompts if they appear in the images. Also list all characters who appear in it."`
- **Chaining**: Linked to `previous_interaction_id: characters_prompts_interaction.id`.
- **Structured JSON Schema**:
  ```json
  [
    {
      "name": "string",
      "prompt": "string",
      "characters": ["string"]
    }
  ]
  ```
- **Server-Side Enforcement**: Strictly sliced to **max 1 chapter**.
- **State Transition**: `PORTRAITS_GENERATED` → `CHAPTERS_GENERATED`

---

## Step 05: Chapter Scene Illustration

- **Goal**: Generate full chapter scene artwork referencing the character portraits.
- **Model**: `imagen-3.0-generate-002` (or current image generation model).
- **Prompt Format**:
  - Context: `"Starting from now, we're going to illustrate the book's chapters. Don't forget to refer to your previous illustrations of the characters to keep the characters consistency, but feel free to change their position."`
  - Per-Chapter Scene: `"Create an illustration for {chapter.name} using the previously generated characters following this description: {chapter.prompt}"` (passing character reference portraits as image inputs when applicable).
- **Output**: PNG image saved locally to `data/storage/{projectId}/illustrations/{chapterId}.png`.
- **State Transition**: `CHAPTERS_GENERATED` → `DONE`
