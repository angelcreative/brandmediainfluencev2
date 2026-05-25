# Foundation Tokens

Foundation tokens define the raw design primitives. They live in the `titan-foundations` repo under `tokens/foundations/`.

## Available files

| File | What it contains |
|------|-----------------|
| `spacing.json` | Spacing scale (4xs through 3xl). Used for padding, margin, gap. |
| `typography.json` | Font families, sizes, weights, line heights. |
| `borders.json` | Border widths, styles. |
| `elevation.json` | Box shadows for elevation levels. |
| `colors-opacity.json` | Color palette with opacity variants. |
| `colors-solid.json` | Solid color palette (no opacity). |

## How to use

Do NOT use foundation values directly in components. Foundation tokens feed into **semantic tokens** which are what you reference in code.

```
Foundation: spacing.json defines "m" = 16px
     \u2193
Semantic:   --spacing-m = 16px (resolved by titan.css)
     \u2193
Usage:      gap: var(--spacing-m)
```

For the semantic token names to use in code, see [SEMANTIC_TOKENS.md](SEMANTIC_TOKENS.md).

## Fetching live data

To get the actual JSON content of any foundation file, call:

```
titan_getFoundations({ file: "spacing" })
```

Available file values: `spacing`, `typography`, `borders`, `elevation`, `colors-opacity`, `colors-solid`.

## Source

Raw files: `https://raw.githubusercontent.com/angelcreative/titan-foundations/main/tokens/foundations/`
