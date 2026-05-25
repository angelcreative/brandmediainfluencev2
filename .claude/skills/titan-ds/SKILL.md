---
name: titan-ds
description: Titan Design System for Audiense SaaS products. Use when generating UI components, reviewing code for design compliance, setting up project themes/bootstrap, or working with titan-compositions. Covers React Aria integration, semantic tokens, theming, and validation rules.
---
# Titan Design System

## Architecture

- **Behavior/Accessibility**: react-aria-components
- **Visual contract**: Titan semantic tokens + active theme CSS
- **Component runtime library**: titan-compositions (import-first policy)
- **Parity reference**: official product baseline (matched components in compositions must be faithful to baseline)
- **Fallback components**: titan-aria or direct React Aria + Titan tokens
- **Icons**: Titan official icons first; lucide-react and @tabler/icons-react only as fallback catalogs.

## Generation workflow (mandatory)

1. Call `titan_getComponentRegistry` -- does the component exist in titan-compositions?
2. Call `titan_getCompositionPattern` -- is there a known JSX recipe for this UI?
3. If the component exists, **import and use it**. Never recreate existing markup/CSS.
3b. For components that match the official baseline, implementations in titan-compositions must mirror behavior and visual contract.
4. **If the registry says the component is missing or in fallbackToReactAria, verify locally before building fallback:**
   - Search `node_modules/titan-compositions/dist/index.d.ts` for the export name.
   - Search `node_modules/titan-compositions/dist/*.css` for related class names.
   - If the package has it, **use it** -- the registry may lag behind the published package.
5. Only if the component truly does not exist in the installed package, build with react-aria-components + Titan semantic tokens.
6. If the request does not map cleanly to either, **ask the user** before creating a custom component.
7. After generating code, call `titan_validateAndRewrite` to check compliance.

## Policy

- Always import from titan-compositions first. Do not duplicate existing components.
- For any component that exists in the official baseline and titan-compositions, titan-compositions must be treated as the runtime mirror.
- Do not install/import private Titan packages in generated project runtime for this phase.
- Never use hardcoded hex/rgb colors. Use `var(--semantic-token)` names.
- Never use `--color-*` primitive tokens directly. Use semantic tokens.
- Use `var(--font-audiense)` for typography. In any layout or flow, apply fontFamily: 'var(--font-audiense)', sans-serif to the root container or text blocks so all copy uses Poppins.
- For any theme: do not use `--color-primary-*`. Use theme tokens only (e.g. `--text-primary`, `--text-secondary`, `--button-primary`, and the theme's brand tokens: `--color-aquamarine-*` for demand, `--color-blueberry-*` for insights, `--color-pulse-*` / `--color-ground-*` for brand, etc.).
- Brand theme: primary = pulse (gold), non-primary = ground (earth). No focus ring. Links = ocean-500. Selected states = ground palette.
- Cards: do not nest a card and another container with shadow/background; use a single TitanCard or a single container with card styling.
- Use Titan official icons first. If missing, use lucide-react, then @tabler/icons-react. No inline SVGs.
- Set `<html data-theme="THEME_NAME">` for theming.

## When to read what

| You need... | Read |
|-------------|------|
| Which themes exist, default theme, CSS load order | [THEME_GUIDE.md](THEME_GUIDE.md) |
| How to set up a project (head links, fonts, JS) | [BOOTSTRAP.md](BOOTSTRAP.md) |
| What code rules are enforced and what to avoid | [VALIDATION_RULES.md](VALIDATION_RULES.md) |
| CSS `var()` names by UI category | [SEMANTIC_TOKENS.md](SEMANTIC_TOKENS.md) |
| Spacing scale, typography, borders, elevation | [FOUNDATIONS.md](FOUNDATIONS.md) |
| What components exist in titan-compositions | [COMPONENT_REGISTRY.md](COMPONENT_REGISTRY.md) |
| JSX recipes for combining components | [COMPOSITION_PATTERNS.md](COMPOSITION_PATTERNS.md) |

## MCP tools available

These tools require runtime and are provided by the Titan MCP server:

| Tool | Purpose |
|------|---------|
| `titan_setup` | Full project scaffold (structure='single' or 'monorepo'). Returns package.json, index.html, src/, skill files. Agent creates files + runs npm install. |
| `titan_setupMonorepo` | Monorepo-only setup. Always creates root workspaces + apps/<app>. Shared deps are installed once at root and inherited by apps. |
| `titan_getTokenFile` | Returns official Titan token CSS content via MCP (chunkable). Emergency fallback only — all targets (including Figma Make) use CDN `<link>` tags by default. |
| `titan_syncFromGithub` | Hydrate live data from the titan-foundations repo |
| `titan_getTheme` | Resolve theme + get bootstrap snippets or full CSS |
| `titan_getOverview` | Architecture, workflow, available compositions (summary or full) |
| `titan_getComponentRegistry` | Query component props, slots, imports |
| `titan_getCompositionPattern` | Get JSX recipes by pattern ID or category |
| `titan_validateAndRewrite` | Validate code against Titan rules + auto-rewrite spacing |
| `titan_getFoundations` | Get foundation token JSONs or semantic token categories |
| `titan_getDesignQualityGuidelines` | DO/DON'T for design quality and anti-AI slop |
| `titan_getDesignMd` | Fetch DESIGN.md content from foundations (design principles / contract) |

**Dependency hygiene:** Keep `titan-compositions` on the same version in the workspace root `package.json` and in any app `package.json` that pins it (e.g. `apps/UI-test`). After bumping, run `npm install` at the repo root so `node_modules` does not keep a nested older copy. Optionally call `titan_syncFromGithub` to refresh MCP maps from GitHub after a compositions or foundations release.
