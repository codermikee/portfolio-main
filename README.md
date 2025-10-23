# Bento Site — Tailwind Migration (Phase 1)

This repo is being migrated to Tailwind CSS to simplify spacing, layout, and responsiveness.

## What changed

- Tailwind CSS (CDN) is now loaded on all pages:
  - `sample.html`
  - `about.html`
  - `code-projects.html`
  - `ui-projects.html`
- A wrapper element with `id="app"` scopes Tailwind utilities (`important: '#app'`) so utility classes override older styles cleanly without using `!important`.
- Normalized spacing on key containers using utilities like `p-3 sm:p-4`, and `gap-2 sm:gap-3`.
- Left existing `sample.css` in place to keep your current look and grid-template-areas while we migrate.

## How it works

- We use the Tailwind CDN in development for quick iteration. You can add utilities directly in your HTML.
- Tailwind CDN config is set inline in each page:
  - `important: '#app'` ensures utilities win over `.grid-item` rules in `sample.css`.
  - `darkMode: 'class'` so existing theme toggles keep working.
  - Fonts extended to prefer Quicksand and JetBrains Mono.

## Local build option (optional)

If you prefer building a CSS file instead of using the CDN, install dependencies and then (once CLI issues are resolved on your system) run:

```powershell
npm install -D tailwindcss
# If the CLI is available, you can build:
# npm run build:css
# Or watch:
# npm run watch:css
```

Notes:

- Tailwind v4 has a different packaging model. If `npx tailwindcss` or `tailwindcss` is not recognized, stick with the CDN for now or install the standalone Tailwind CLI.

## Next steps (suggested)

- Replace more of the custom CSS in `sample.css` with Tailwind utilities:
  - Move `.grid-item { padding: ... }` to HTML utilities (`p-3 sm:p-4`).
  - Use `grid-cols-6` and responsive `md:`/`lg:` utilities instead of `grid-template-areas` where possible.
  - Swap fixed `min-height`/`aspect-ratio` rules with `min-h-0`, `aspect-square md:aspect-auto`, etc.
- Extract shared page wrappers/layout to reusable classes or small HTMX/partials if you add a build step later.
- When ready, remove unused rules from `sample.css` in small batches.

## Quick testing

- Open `sample.html` and resize to mobile widths; spacing and gaps should now be more consistent.
- The `#app` wrapper ensures Tailwind utilities (like `gap-*`, `p-*`) reliably override legacy rules.

## Troubleshooting

- If something looks off, check for a conflicting rule in `sample.css`. Add/adjust a Tailwind class on the element. Due to the `#app` scope, Tailwind will take precedence for the same property.
- If a tile with tabs should have 0 internal padding, keep the `has-tabs` class (we left those tiles at `p-0`).
