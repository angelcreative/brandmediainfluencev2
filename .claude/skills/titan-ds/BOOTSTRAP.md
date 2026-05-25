# Bootstrap Setup

## Vite + React (default)

### index.html `<head>`

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/angelcreative/titan-foundations@main/tokens/css/titan.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/angelcreative/titan-foundations@main/tokens/themes/_audiense.css" />
```

Replace `_audiense.css` with the appropriate theme file. See [THEME_GUIDE.md](THEME_GUIDE.md) for the list.

### src/main.tsx (before render)

```typescript
document.documentElement.dataset.theme = "audiense";
```

## Next.js

### app/layout.tsx (or pages/_document.tsx)

Same `<link>` tags as above, placed in the `<Head>` component.

### Client bootstrap component

```typescript
document.documentElement.dataset.theme = "audiense";
```

## Local mode (self-hosted tokens)

If serving tokens from your own server instead of CDN, replace the CDN base:

```
CDN:   https://cdn.jsdelivr.net/gh/angelcreative/titan-foundations@main/tokens/
Local: /tokens/
```

The paths stay the same: `css/titan.css` and `themes/_THEME.css`.

## Required packages

```bash
npm install titan-compositions react-aria-components lucide-react @tabler/icons-react
```

Import components from `titan-compositions` and styles with `import 'titan-compositions/styles'`.

## Load order checklist

1. [ ] Google Fonts: Poppins loaded
2. [ ] `titan.css` loaded
3. [ ] Theme CSS loaded (e.g., `_audiense.css`)
4. [ ] `titan-compositions/styles` imported
5. [ ] `data-theme` attribute set on `<html>`

## Project structures

### Single app (default)

Use `titan_setup()` or `titan_setup({ structure: 'single' })`. Creates:

```
project-root/
\u251C\u2500\u2500 package.json       \u2190 all deps here
\u251C\u2500\u2500 vite.config.js
\u251C\u2500\u2500 index.html         \u2190 Titan head links + data-theme
\u2514\u2500\u2500 src/
    \u251C\u2500\u2500 main.jsx
    \u2514\u2500\u2500 App.jsx
```

### Monorepo (multiple apps, install once)

Use `titan_setup({ structure: 'monorepo' })`. Creates:

```
project-root/
\u251C\u2500\u2500 package.json       \u2190 workspaces: ["apps/*"], Titan deps here
\u2514\u2500\u2500 apps/
    \u2514\u2500\u2500 my-app/
        \u251C\u2500\u2500 package.json   \u2190 only name + vite devDeps
        \u251C\u2500\u2500 vite.config.js
        \u251C\u2500\u2500 index.html     \u2190 Titan head links + data-theme
        \u2514\u2500\u2500 src/
            \u251C\u2500\u2500 main.jsx
            \u2514\u2500\u2500 App.jsx
```

Dependencies install once at root. To add a new app: create a folder in apps/ with its own package.json + index.html + src/, then run `npm install` from root.
