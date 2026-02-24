#!/usr/bin/env node
// Load .env from package root before importing any other modules
await (async () => {
  const { loadPackageEnv } = await import('./config/dotenv.ts');
  loadPackageEnv();

  const { default: React } = await import('react');
  const { render } = await import('ink');
  const { App } = await import('./ui/index.ts');

  render(React.createElement(App));
})();
