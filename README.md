# Modular Resume Composer

Modular Resume Composer is a TanStack Start application for assembling resume variants from modular YAML content and exporting them through a print-friendly preview.

## Features

- Compose resumes from modular profile, summary, strengths, impact, experience, stack, education, certification, reference, and overlay files
- Switch between built-in presets, local saved variants, role tracks, and resume languages
- Preview the current composition in-app and in a dedicated print/PDF view
- Persist saved variants and last-used state locally in the browser

## Content model

Resume content is loaded from language-specific YAML files in `data/examples` and can be overridden by matching files in `data/private`.

Examples:

- `modules/strengths.en.yaml`
- `modules/stack.sv.yaml`
- `presets/technical-delivery.en.yaml`
- `profile/profile.en.yaml`

## Commands

```bash
pnpm dev
pnpm format
pnpm lint
pnpm run typecheck
```

## Notes

- The application UI stays in English.
- Resume language switching is intended to swap language-specific resume files and resume-facing labels.
- Browser print headers and footers are controlled by the browser print dialog, not by the app.
