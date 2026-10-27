# madie-cql-library

This is a single-spa Application responsible for MADiE application's Standalone CQL Library

## Development

Use Node.js 22.15 or newer. Run `npm ci`, then `npm start` to serve the SystemJS
microfrontend on port 8507 with webpack-dev-server and hot reload.

For an alternate port, run `npx webpack serve --port 8508 --env=protocol=http`.

webpack-dev-server is a development-only dependency. Its transitive
`http-proxy-middleware` / `micromatch` / `braces` chain currently produces four
high audit findings from the unpatched
[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
It is retained to preserve hot reload and is not included in production bundles.

Utility styles use prefixed Tailwind classes (`cl:`), compiled by PostCSS.
Tailwind Preflight is not loaded. `GlobalStyles` retains the previous global
reset, and custom utility colors retain the previous theme values.

Run `npm run test:styles` to verify the original reset and all migrated utilities.
