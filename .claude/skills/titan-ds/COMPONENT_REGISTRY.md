# Component Registry

titan-compositions is the primary component library. **Always check here first** before building custom components.

## Import policy

1. If a component exists in titan-compositions, **import and use it**. Do not recreate.
2. If the registry says a component is missing, **verify against the installed package before building fallback** (see below).
3. If truly not in titan-compositions, build with `react-aria-components` + Titan semantic tokens.
4. If neither covers the need cleanly, **ask the user** before creating a custom component.

## Registry can be stale

The MCP registry is synced from a JSON file in the titan-foundations repo. It may lag behind the actual published `titan-compositions` npm package. **Before building any fallback component**, verify locally:

\`\`\`bash
# Check if the component is exported
grep -i "TitanCalendar" node_modules/titan-compositions/dist/index.d.ts

# Check if CSS classes exist for it
grep -i "calendar" node_modules/titan-compositions/dist/*.css
\`\`\`

If the package has the component but the registry does not, **use the package version**. The installed package is the source of truth, not the registry.

## Querying components

The component registry is fetched live from the `titan-foundations` repo. Use the MCP tool to get current data:

```
titan_getComponentRegistry()              \u2192 list of all component names
titan_getComponentRegistry({ component: "TitanButton" })  \u2192 full details for one component
```

Each component entry includes:
- **Import path**: Where to import from
- **Props**: All accepted props with types
- **Slots**: Named slots for composition
- **Composability hints**: How to combine with other components
- **Coverage map**: What React Aria primitives this component wraps

## Coverage map

The registry includes a `coverageMap` with two lists:

- **covered**: React Aria components wrapped by titan-compositions (use the titan wrapper)
- **fallbackToReactAria**: React Aria components NOT yet wrapped (use React Aria directly + Titan tokens)

## Package info

- Package: `titan-compositions`
- Peer dependencies: `react-aria-components`, `lucide-react`, `@tabler/icons-react`
- Source: `https://raw.githubusercontent.com/angelcreative/titan-foundations/main/docs/integration/component-registry.json`
