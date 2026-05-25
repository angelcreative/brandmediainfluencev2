# Composition Patterns

Composition patterns are real UI recipes with JSX templates showing **how to combine** titan-compositions components into complete screens and sections.

## Categories

| Category | What it covers |
|----------|---------------|
| `pagePatterns` | Full page layouts (report list, dashboard, settings) |
| `cardPatterns` | Card variations (KPI summary, metric card, info card) |
| `dialogPatterns` | Dialog/modal compositions (confirmation, form in dialog) |
| `formPatterns` | Form layouts (login form, settings form, search) |
| `microPatterns` | Small reusable pieces (empty state, loading skeleton, action bar) |

## Querying patterns

Patterns are fetched live from the `titan-foundations` repo. Use the MCP tool:

```
titan_getCompositionPattern()                           \u2192 index of all patterns (id + category)
titan_getCompositionPattern({ pattern: "loginForm" })   \u2192 full JSX recipe for one pattern
titan_getCompositionPattern({ category: "formPatterns" })  \u2192 all patterns in a category
```

Each pattern includes:
- **id**: Unique identifier (e.g., `loginForm`, `kpiSummaryCard`, `formInDialog`)
- **name**: Human-readable name
- **description**: What the pattern is for
- **titanComponents**: Which titan-compositions components it uses
- **jsx**: The JSX template
- **layout**: Layout structure description
- **gaps**: What is not covered by titan-compositions (build with React Aria + tokens)

## Workflow

1. Check if a pattern exists for your use case: `titan_getCompositionPattern()`
2. If found, use the JSX template as your starting point.
3. Customize props, content, and theme as needed.
4. For gaps listed in the pattern, use `react-aria-components` + Titan semantic tokens.
5. Validate the result: `titan_validateAndRewrite({ code: "..." })`

## Source

`https://raw.githubusercontent.com/angelcreative/titan-foundations/main/docs/integration/composition-patterns.json`
