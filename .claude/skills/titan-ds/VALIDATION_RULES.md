# Validation Rules

These rules are enforced by the `titan_validateAndRewrite` MCP tool. Code that violates them will be flagged.

## Errors (must fix)

### No hardcoded hex colors
- **Matches**: `#fff`, `#3a3a3a`, `#00000080`
- **Fix**: Replace with semantic token `var()`. See [SEMANTIC_TOKENS.md](SEMANTIC_TOKENS.md).

### No rgb/rgba
- **Matches**: `rgb(0, 0, 0)`, `rgba(255, 255, 255, 0.5)`
- **Fix**: Replace with semantic token `var()`.

### No primitive color tokens
- **Matches**: `var(--color-gray-100)`, `var(--color-blue-500)`
- **Fix**: Use semantic tokens instead. E.g., `var(--card-background)` not `var(--color-gray-50)`.

## Warnings (should fix)

### Prefer semantic spacing over px
- **Matches**: `16px`, `24px`, `8px` in CSS/style values
- **Fix**: Use `var(--spacing-s)`, `var(--spacing-m)`, etc. The MCP auto-rewrites known spacing values.

### Typography token required
- **Expected**: `var(--font-audiense)` must appear in the code
- **Fix**: Set `font-family: var(--font-audiense)` on the root or component level.

### React Aria base required
- **Expected**: Import from `react-aria-components`
- **Fix**: Use React Aria primitives for behavior/accessibility. Titan policy requires it.

### Icons must use lucide-react or @tabler/icons-react
- **Triggered when**: Code contains `<svg` tags but no lucide-react or @tabler/icons-react import
- **Fix**: Replace inline SVGs with lucide-react components. If the icon is not available in lucide-react, use @tabler/icons-react.

### Table icons
- **Cell icons** (tbody): decorative only, `--icon-size-m` (16px), `stroke-width: var(--icon-stroke-m)`. No hover/pressed states.
- **Header icons** (thead): `--icon-size-s` (12px), `stroke-width: var(--icon-stroke-s)`.
- **Actionable icons** in table rows: wrap in `<Button className="icon-base">` (basic icon button, no bg on any state). Never use `icon-ghost` or `icon-secondary`.

### Table alignment (`th` / `td`)
- **Default:** `text-align: left` for headers and cells (text, numbers, mixed content).
- **Center only** when the cell is exclusively: decorative icon only, avatar only, checkbox column, drag handle column, or single action icon column — use Titan classes (`table-col-checkbox`, `table-cell-checkbox`, `table-col-drag`, `table-cell-drag`, `table-col-actions`, `table-cell-actions`, or `table-col-avatar-only` / `table-cell-avatar-only`, `table-col-icon-only` / `table-cell-icon-only`). Do not center ordinary data columns.

## Auto-rewrite

The `titan_validateAndRewrite` tool can automatically rewrite **spacing px values** to semantic `var()` tokens. Other violations must be fixed manually.

Rewrite policy: `safe-only` -- only spacing px to semantic spacing vars. No color or typography rewrites.
