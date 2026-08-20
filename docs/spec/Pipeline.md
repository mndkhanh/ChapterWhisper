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

Reference contract derived directly from Google's Book Illustration Cookbook (sections 1–5).

> [!important] Hard Constraints (Graded)
> 1. **Max 2 characters** (adults only, no children) — enforced server-side.
> 2. **Max 1 chapter** — enforced server-side.
> 3. **Single text transmission**: Send book text once; reuse across steps via context/chat chaining.
> 4. **No auto-retries**: All retry actions must be user-triggered.

---

## Step 01: Art Style
- **Input**: Book excerpt (up to 4,000 characters) OR user-supplied custom style.
- **Model**: `gemini-2.5-flash` (or current text model).
- **Output**: 2-sentence description of visual medium, color palette, lighting, and mood.
- **State Transition**: `CREATED` → `STYLE_SET`

## Step 02: Characters Extraction
- **Input**: Book excerpt + established Art Style from Step 1.
- **Model**: `gemini-2.5-flash` with structured JSON schema (`responseMimeType: "application/json"`).
- **Restriction**: Identify up to 2 primary **adult** characters (no children).
- **JSON Schema**:
  ```json
  [
    {
      "name": "string",
      "description": "string",
      "visualPrompt": "string (portrait prompt including art style)"
    }
  ]
  ```
- **State Transition**: `STYLE_SET` → `CHARACTERS_GENERATED`

## Step 03: Character Portraits
- **Input**: `visualPrompt` for each character from Step 2.
- **Model**: `imagen-3.0-generate-002` (or current image model).
- **Output**: 1:1 aspect ratio PNG image saved locally to `data/storage/{projectId}/portraits/{characterId}.png`.
- **State Transition**: `CHARACTERS_GENERATED` → `PORTRAITS_GENERATED`

## Step 04: Chapter Prompt Extraction
- **Input**: Book excerpt + established characters + Art Style.
- **Model**: `gemini-2.5-flash` with structured JSON schema.
- **Restriction**: Exactly 1 main chapter scene.
- **JSON Schema**:
  ```json
  [
    {
      "title": "string",
      "summary": "string",
      "scenePrompt": "string (scene composition referencing character visuals and style)"
    }
  ]
  ```
- **State Transition**: `PORTRAITS_GENERATED` → `CHAPTERS_GENERATED`

## Step 05: Chapter Scene Illustration
- **Input**: `scenePrompt` from Step 4.
- **Model**: `imagen-3.0-generate-002`.
- **Output**: PNG image saved locally to `data/storage/{projectId}/illustrations/{chapterId}.png`.
- **State Transition**: `CHAPTERS_GENERATED` → `DONE`
