---
description: "Use when working on frontend, styling, templates, layouts, panel UI, login views, dashboard views, or other visual layers in this repository. Enforces Astro-first development with selective React islands allowed."
applyTo: "src/**/*,public/**/*,astro.config.mjs,tailwind.config.mjs,README.md"
---

# Astro-First Frontend Policy

- Implement active UI work in the Astro app.
- New public pages, product templates, landing pages, auth views, dashboard views, and admin views should be built in `src/`.
- React islands are allowed when they are the most pragmatic way to keep or migrate interactive behavior.
- Direct dependency on `frontend/` should be avoided.
- If React must remain active, keep it inside an Astro-owned location in `src/`, preferably `src/components/panel/`, rather than in the archived app workspace.
- Do not add new product features to `frontend/`.
- When migrating old UI, prefer moving behavior into Astro-native components step by step.