---
description: "Workspace-wide instructions for the Natalia Potocka repository. Use for any work in this project."
---

# Workspace Rules

- This repository is Astro-first.
- Treat `src/` as the source of truth for active frontend work.
- Public UI, auth UI, user dashboard UI, and administrator UI belong to the Astro application.
- React is allowed only as an island strategy or migration bridge inside the Astro app.
- Do not add new product features directly to `frontend/`.
- Treat `frontend/` as archived legacy React/Vite source kept for reference and recovery only.
- If old React code is still needed, keep active dependencies inside the Astro-owned `src/` tree, preferably under `src/components/panel/`, or rewrite them into Astro-native components.
- Prefer reducing the remaining React island surface over time.
- When architecture choices are ambiguous, choose Astro-first with selective React islands only where they provide clear technical value.