import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadEnv } from './loadEnv';

const projectRoot = process.cwd();
const featureRoot = path.join(projectRoot, 'cypress', 'e2e', 'features');
const envValues = loadEnv();
const defaultWorkers = 3;
const workers = resolveWorkerCount();
const browser = process.env.CYPRESS_BROWSER ?? 'chrome';
const tags = process.env.TAGS ?? 'not @ignore';

const featureFiles = listFeatureFiles(featureRoot);

if (featureFiles.length === 0) {
  console.error('No feature files found under cypress/e2e/features.');
  process.exit(1);
}

console.info(`Found ${featureFiles.length} feature file(s). Running with ${workers} worker(s).`);

const queue = [...featureFiles];
const failures: Array<{ feature: string; code: number | null }> = [];

void main();

async function main () {
  await Promise.all(Array.from({ length: workers }, (_, workerIndex) => runWorker(workerIndex + 1)));

  if (failures.length > 0) {
    console.error('\nFeature-level parallel run completed with failures:');
    failures.forEach(({ feature, code }) => {
      console.error(`- ${path.relative(projectRoot, feature)} (exit code: ${code ?? 'unknown'})`);
    });
    process.exit(1);
  }

  console.info('\nFeature-level parallel run completed successfully.');
}

function resolveWorkerCount () {
  const raw = process.env.FEATURE_PARALLEL_WORKERS ?? envValues.FEATURE_PARALLEL_WORKERS;

  if (!raw) {
    return defaultWorkers;
  }

  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    console.warn(`Invalid worker count '${raw}'. Falling back to ${defaultWorkers}.`);
    return defaultWorkers;
  }

  return parsed;
}

function listFeatureFiles (directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listFeatureFiles(fullPath);
    }

    if (entry.isFile() && entry.name.endsWith('.feature')) {
      return [fullPath];
    }

    return [];
  });

  return files.sort((a, b) => a.localeCompare(b));
}

async function runWorker (workerNumber: number) {
  while (queue.length > 0) {
    const feature = queue.shift();

    if (!feature) {
      return;
    }

    const jsonOutput = buildJsonOutputPath(feature);

    console.info(`\n[worker ${workerNumber}] START ${path.relative(projectRoot, feature)}`);
    const exitCode = await runFeature(feature, jsonOutput);

    if (exitCode !== 0) {
      failures.push({ feature, code: exitCode });
      console.error(`[worker ${workerNumber}] FAIL  ${path.relative(projectRoot, feature)} (exit code: ${exitCode ?? 'unknown'})`);
    } else {
      console.info(`[worker ${workerNumber}] PASS  ${path.relative(projectRoot, feature)}`);
    }
  }
}

function buildJsonOutputPath (featurePath: string) {
  const relative = path.relative(featureRoot, featurePath);
  const safeName = relative
    .replace(/\.feature$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_');

  return `report/JSON/cucumber_report_${safeName}.json`;
}

function runFeature (featurePath: string, jsonOutput: string): Promise<number | null> {
  // Preprocessor options are passed with --expose (cypress-cucumber-preprocessor v27+).
  const exposeParts = [
    `tags=${tags}`,
    'jsonEnabled=true',
    `jsonOutput=${jsonOutput}`,
  ];

  const args = [
    'cypress',
    'run',
    '--browser',
    browser,
    '--spec',
    featurePath,
    '--expose',
    exposeParts.join(','),
  ];

  return new Promise((resolve) => {
    const child = spawn('yarn', args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false,
    });

    child.on('close', (code) => {
      resolve(code);
    });
  });
}
