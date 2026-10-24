# Auto Cut Panel Manga Implementation Plan

## Phase 1: Foundation
- Define core types (Page, Panel, BoundingBox)
- Setup basic UI layout with Tailwind
- Implement file upload functionality (multiple pages)

## Phase 2: Local Computer Vision (Detection)
- Implement basic canvas-based image analysis to find gaps and panel candidates
- Calculate confidence scores
- Implement grouping logic for partial panels

## Phase 3: Manual Correction UI
- Editor overlay to allow adding/removing/adjusting cuts
- Preview changes in real-time

## Phase 4: Gemini Integration
- Integrate @google/genai SDK
- Implement server-side proxy for secure Gemini API calls
- Use Gemini for complex layout validation/fallback

## Phase 5: Export & Batching
- Implement ZIP generation using jszip
- Batch processing status tracking
- Export functionality

## Phase 6: Testing
- Run acceptance tests based on requirements
