import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Load .env from the package root directory.
 * This solves the issue where `npm link` causes dotenv to look
 * for .env in the current working directory instead of the package directory.
 */
export function loadPackageEnv(): void {
  // Get the directory of the current module
  const currentDir = dirname(fileURLToPath(import.meta.url));

  // Resolve to package root (src/config → src → package-root)
  const packageRoot = resolve(currentDir, '../..');

  const envPath = resolve(packageRoot, '.env');

  // Only load if .env exists
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, quiet: true });
  }
}
