# Issue 5 In-App Editing

Status: in_progress
Issue: https://github.com/BallLightningAB/modular-resume-composer/issues/5
Plan: `C:\Users\nicol\.windsurf\plans\issue-5-in-app-editing-plan-7ceda3.md`

## Scope in this implementation pass

- Add a local-first editable draft layer for active resume content
- Persist edited drafts through last-used state and saved local variants
- Add in-app editing for summaries, block modules, and experience entries/bullets/rules
- Surface validation and budget feedback while editing
- Preserve preset-owned formatting and composition behavior

## Progress

- [x] Reviewed memory-bank, current builder flow, and issue deliverables
- [x] Saved implementation plan artifact
- [x] Add schema/types/storage support for editable drafts
- [x] Update builder/preview derivation to honor saved draft content
- [x] Implement builder editing UI
- [x] Run targeted Biome checks and repo lint
- [x] Attempt repo typecheck

## Implemented

- Saved presets and last-used state can now persist optional edited module payloads
- Builder state now carries editable module content in addition to preset and UI state
- Main builder route now composes the live preview from the local draft state
- Added an in-app editor panel for:
  - selected summary content
  - selected block modules and selected overlays
  - experience entries, bullets, and experience rule controls
  - preset title line and section order
- Added draft validation messaging and editor-driven preview section highlighting
- Preview route now honors saved edited module content restored from local state

## Verification

- `pnpm exec biome check ...` passed for the changed files
- `pnpm lint` passed for the repo; remaining output was existing generated-file warnings in `src/routeTree.gen.ts`
- `pnpm run typecheck` is still blocked by a pre-existing unrelated import error in `scripts/generate-sitemap.ts` referencing `../src/paraglide/runtime.js`

## Notes

- Rich-text editing remains out of scope
- Manual formatting controls remain intentionally limited to preset-aligned overrides
- All editing stays browser-local in this pass
