# Issue 5 In-App Editing Plan

This plan adds a deliberately limited, local-first in-app editing layer for resume modules and preset selection logic while keeping the preset as the main owner of formatting and print structure.

## Context

- The current app already has the right core split:
  - route loaders fetch validated module and preset data
  - `composeResumeDocument` turns modules + preset into the rendered resume
  - the builder keeps only light client-side UI state and persists saved variants locally
- The current contracts are strongly shaped around:
  - module content files (`summaries`, block collections, `experience`)
  - preset selection and composition rules (`summary_id`, block ids, overlay ids, `experience` rules, `section_order`)
- This means the safest editing feature is **not** a general rich-text editor. It should be a structured editor for module content plus a small set of preset-level overrides.

## Goal

Let you edit the content that feeds the active resume directly in the app, preview changes instantly, keep all edits local-first, and preserve compatibility with the existing YAML/module/preset model.

## Recommended product scope

### Ship in scope

- **Structured plain-text editing**
  - summary text
  - block titles and block items for strengths, impacts, overlays, stack, education, certifications, references
  - experience entry fields: company, role, dates, location, subtitle
  - experience bullets: text, tags, priority
- **Preset-aware selection editing**
  - choose which summary/block ids the active preset points at
  - choose overlay ids
  - edit `title_line`
  - adjust `section_order`
  - toggle section visibility
  - edit experience rules in a guided form (`max_bullets`, prefer/required/exclude tags, forced bullets)
- **Live fit feedback while editing**
  - keep the existing budget signals visible
  - show section-level warnings in the editor panel, not only in preview
  - highlight which edited section is affecting the preview
- **Local-first draft persistence**
  - unsaved draft survives refresh in browser storage
  - saved local variants can include edited content and preset overrides
- **Validation and guardrails**
  - schema-backed validation for required fields
  - simple duplicate-id detection
  - prevent deleting content currently referenced by the active preset until reassigned

### Explicitly keep out of scope

- **No rich-text / WYSIWYG editor**
- **No markdown formatting model**
- **No arbitrary font, size, color, spacing, or layout controls**
- **No drag-and-drop builder complexity in V1**
- **No backend sync, auth, or collaboration**
- **No YAML editing surface exposed directly in the UI**

## Recommended editing model

### 1. Keep presets in charge of formatting

The preset should remain the source of:

- section order
- which module items are selected
- overlay inclusion
- experience bullet selection rules
- title line / role-track framing

The editor should mainly change **content** and only a **small number of composition controls**.

### 2. Add only limited manual formatting controls

I recommend allowing these manual overrides:

- **Title line override**
  - already fits the preset contract
- **Section title override** for block-based modules
  - already supported by block titles
- **Section visibility**
  - already exists in UI state
- **Experience bullet pin/exclude controls**
  - maps cleanly to `force_bullet_ids`, tags, and `max_bullets`
- **Optional manual bullet order within a single experience entry**
  - only if implemented as a simple up/down control stored in draft state
  - do not introduce free-form layout ordering across the document

I do **not** recommend inline bold/italic, custom indentation, manual line-height, or free-form text styling. Those would work against the preset-driven model and make print-safe output much harder to preserve.

## Data and state design

### Route and loader boundary

Keep the current TanStack pattern:

- route loader provides runtime modules + preset catalog
- client component owns transient editing state
- do not use `useEffect` for initial data loading

### New draft model

Add a local draft layer that wraps the existing runtime data without replacing the underlying contracts:

- `EditableResumeDraft`
  - `preset`: editable copy of active `PresetFile`
  - `modules`: editable copy of loaded module collections
  - `ui`: existing UI state plus editor-specific state
  - `meta`: dirty state, validation state, source preset id, timestamps

### Persistence recommendation

Store three local-first buckets:

- **last used draft**
  - autosaved working copy
- **saved edited variants**
  - reusable named local variants
- **existing saved preset collection**
  - either migrate to the new wrapper shape or supersede it with a versioned collection

Keep this versioned in localStorage so schema evolution stays manageable.

## UI plan

### Main builder route

Keep `/` as the primary route and add a third capability to the existing left-side panel: **Edit content**.

Recommended panel sections:

- **Compose**
  - existing preset/language/track/overlay controls
- **Edit content**
  - module editor tabs: Summary, Blocks, Experience
- **Review fit**
  - existing budgets + over-limit warnings + active-section focus
- **Save**
  - save local variant, reset draft, duplicate variant

### Editing surfaces

- **Summary editor**
  - single textarea for selected summary
  - switcher for summary ids in the current language/track
- **Block editor**
  - list of block records for strengths/impacts/overlays/stack/education/certifications/references
  - edit title + items using simple textareas and add/remove item controls
- **Experience editor**
  - select an entry
  - edit header fields
  - add/remove bullets
  - edit bullet text/tags/priority
  - show which bullets the active preset currently selects and why
- **Preset rule editor**
  - simple forms for `summary_id`, block ids, `section_order`, and experience rules

## Suggested deliverable breakdown for issue #5

- **I5D1: Editor architecture and draft model**
  - define editable draft contracts and storage versioning
  - keep loader data separate from draft state
- **I5D2: Structured editors for summary + block modules**
  - summaries, strengths, impacts, overlays, stack, education, certifications, references
- **I5D3: Experience editor and preset rule controls**
  - entry field editing, bullet editing, rule editing, forced-bullet controls
- **I5D4: Editing-time fit and validation UX**
  - live budget warnings, active-section focus, validation messages
- **I5D5: Local persistence, migration, and reset flows**
  - autosave draft, save named variant, reset to built-in/source preset, migration from current saved presets

## Implementation sequence

1. **Introduce the editable draft abstraction**
   - derive a draft from loader data + current builder state
   - keep preview composition reading from the draft
2. **Implement summary and block editors first**
   - these are the lowest-risk surfaces and cover most requested modules
3. **Implement experience editing second**
   - this is the only area with richer rule interactions
4. **Surface validation + fit feedback inside the editor panel**
   - reuse existing budget calculations
5. **Finish persistence and migration**
   - autosave working draft and support named saved variants

## Risks and mitigations

- **Risk: scope balloons into a CMS**
  - keep edits local-only and route-scoped
  - avoid creation of complex nested management UIs unless clearly needed
- **Risk: draft state drifts away from preset/module contracts**
  - always compose preview from the same schema-backed draft shape
  - validate at draft boundaries
- **Risk: formatting controls undermine print consistency**
  - keep formatting decisions in preset/renderer, not user styling controls
- **Risk: experience editing becomes too advanced**
  - start with text/tags/priority plus forced bullets; defer reordering or advanced ranking tools if the simple version is enough

## Verification

- draft edits update preview immediately
- reloading restores the working draft
- saved variants reopen correctly
- invalid required fields are surfaced clearly
- current presets still compose correctly with no edits
- print preview remains within the same template assumptions and budget model

## Final recommendation

Implement issue `#5` as a **structured content editor with lightweight preset-rule controls**, not as a rich-text editor. That gives you the usability win of in-app editing without breaking the core design principle that modules hold content and presets hold most of the formatting/composition logic.
