import fs from 'node:fs';
import path from 'node:path';

/** Parses a dotenv-style file into key/value pairs. Missing files resolve to an empty object. */
function readEnvFile (fileName: string): Record<string, string> {
  const envPath = path.resolve(process.cwd(), fileName);

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf('=');
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key) {
        acc[key] = value;
      }

      return acc;
    }, {});
}

/**
 * Loads environment values with the following precedence (highest wins):
 * process environment (e.g. CI secrets) > `.env` (local, git-ignored) > `.env.template` (committed defaults).
 * Only keys declared in either file are read from the process environment.
 */
export function loadEnv (): Record<string, string> {
  const merged = { ...readEnvFile('.env.template'), ...readEnvFile('.env') };

  Object.keys(merged).forEach((key) => {
    const fromProcess = process.env[key];
    if (fromProcess !== undefined && fromProcess !== '') {
      merged[key] = fromProcess;
    }
  });

  return merged;
}
