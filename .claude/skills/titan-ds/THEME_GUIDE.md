# Theme Guide

## Supported themes

| Theme | CSS file | Product |
|-------|----------|---------|
| `insights` | `_insights.css` | Insights product |
| `audiense` | `_audiense.css` | **Default**. Single-primary-CTA pattern: pomegranate for primary CTA only (max 1/screen), steel for everything else, ocean-500 for links. |
| `demand` | `_demand.css` | Demand product |
| `linkedin` | `_linkedin.css` | LinkedIn integration |
| `tweetbinder` | `_tweetbinder.css` | TweetBinder |
| `digital` | `_digital.css` | Digital product |
| `neutral` | `_neutral.css` | Neutral/white-label |
| `default` | `_default.css` | Generic fallback |
| `brand` | `_brand.css` | Brand — Pulse (gold) primary, Ground (earth) neutral. No focus ring. Links use ocean-500. |

## Theme resolution

- If the user requests a specific theme by name, use it.
- If the theme name is not in the supported list, fall back to `audiense`.
- If no theme is mentioned, use `audiense`.

## Applying a theme

Set the `data-theme` attribute on the root HTML element:

```html
<html data-theme="audiense">
```

```javascript
document.documentElement.dataset.theme = "audiense";
```

## CSS load order (mandatory)

Load in this exact order. Misordering causes missing variables.

1. **Google Fonts**: Poppins (weights: 400, 500, 600, 700)
2. **titan.css**: Core tokens and foundations
3. **Theme CSS**: `_audiense.css` (or whichever theme)
4. **titan-compositions/styles**: Component-specific styles
5. **data-theme attribute**: Set on `<html>`

## Source URLs

- Tokens index: `https://cdn.jsdelivr.net/gh/angelcreative/titan-foundations@main/tokens/css/titan.css`
- Theme CSS: `https://cdn.jsdelivr.net/gh/angelcreative/titan-foundations@main/tokens/themes/_THEME.css`
- Raw GitHub: `https://raw.githubusercontent.com/angelcreative/titan-foundations/main/`

## Typography

All themes use **Poppins** as the only typeface. The CSS variable is `--font-audiense`.

```css
body {
  font-family: var(--font-audiense);
}
```

**Critical rules:**

- `--font-audiense` (Poppins) is the ONLY font token. It applies to ALL themes.
- There are NO per-theme font variables. `--font-demand`, `--font-insights`, etc. **do not exist**.
- Always set `font-family: var(--font-audiense)` on `body`. All elements (h1, p, label, span) inherit from it.
- Do NOT invent theme-specific font variables. If you do, elements will fall back to the browser default serif font.

## Brand theme — ground vs neutral rules

The `brand` theme uses two custom palettes: **Pulse** (gold) and **Ground** (earth).

**Ground palette is ONLY for:**
- Buttons (secondary, tertiary, icon button bg/labels)
- Button labels (`--text-on-primary`, `--text-button-*`)
- Form controls (checkbox, radio, toggle/switch)
- Tabs and Button Group (selected states)
- Page background (`--background-body: ground-100`)
- Calendar selected cell label (ground-900 on pulse bg)

**Everything else uses neutral (black/steel):**
- Body text (`--text-primary`, `--text-secondary`, `--text-icon-secondary`)
- Borders (`--border`, `--border-interactive`)
- Avatar, Inputs, Menus, Dividers, Select, Sidebar, Tooltips, Labels
- Pagination, Table, Navbar border, Pills/Tags

**Other brand rules:**
- Primary buttons: `pulse-600` bg, `ground-900` label.
- No focus ring (`--focus-ring-color: transparent`).
- Links: `ocean-500`.
- Product logo: same as `audiense` theme.

## Style contract

- No hex colors (`#fff`, `#3a3a3a`). Use semantic `var()` tokens.
- No `rgb()` / `rgba()`. Use semantic `var()` tokens.
- No `--color-*` primitives directly. Use semantic tokens (e.g., `--card-background`, not `--color-gray-100`).
- Prefer semantic spacing vars over `px` literals.

For the full list of semantic tokens, see [SEMANTIC_TOKENS.md](SEMANTIC_TOKENS.md).
