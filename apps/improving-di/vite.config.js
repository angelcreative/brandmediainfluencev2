import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..')

/* Cross-app source imports.
   improving-di is a thin shell that re-uses the table workspaces
   shipped by `better-di-in` and `topics`. Vite restricts dev file
   access to the project root by default, so we explicitly allow
   the monorepo root + the two sibling app folders. Without this
   the `import` of `../../better-di-in/src/...` is rejected with
   a 403 in dev. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      allow: [
        repoRoot,
        path.resolve(repoRoot, 'apps', 'better-di-in'),
        path.resolve(repoRoot, 'apps', 'topics'),
      ],
    },
  },
})
