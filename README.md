# madie-cql-library

This is a single-spa Application responsible for MADiE application's Standalone CQL Library

## Development

Use Node.js 22.15 or newer. Run `npm ci`, then `npm start` to serve the SystemJS
microfrontend on port 8507. Webpack polls source files and rebuilds automatically;
refresh the browser manually after a successful rebuild. HMR and automatic browser
refresh are not provided. The development server uses Node's HTTP server instead
of webpack-dev-server to avoid its vulnerable dependency chain.

Use `PORT=8508 npm start` or `npm start -- --port 8508` to select another port.
The server exposes compiled assets and `/public/` assets with CORS enabled,
and returns HTTP 503 until a successful build is available.

Utility styles use prefixed Tailwind classes (`cl:`), compiled by PostCSS.
Tailwind Preflight is not loaded. `GlobalStyles` retains the previous global
reset, and custom utility colors retain the previous theme values.

Run `npm run test:styles` to verify the original reset and all migrated utilities.
Run `npm run test:server` to verify the development-server response contract.
