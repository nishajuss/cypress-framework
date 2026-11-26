import reporter from 'cucumber-html-reporter';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

interface Embedding {
  data: string;
  mime_type: string;
}

interface Step {
  name: string;
  result: { status: string };
  embeddings?: Embedding[];
}

interface Scenario {
  name: string;
  steps: Step[];
}

interface Feature {
  name: string;
  elements?: Scenario[];
}

const cucumberJsonDir = 'report/JSON/';
const screenshotsDir = './cypress/screenshots';
const cucumberReportFileMap: Record<string, string> = {};
const cucumberReportMap: Record<string, Feature> = {};
const jsonIndentLevel = 2;

getCucumberReportMaps();
addScreenshots();
generateReport();

function getCucumberReportMaps () {
  try {
    const reportFiles = fs.readdirSync(cucumberJsonDir).filter((file) => file.endsWith('.json'));

    reportFiles.forEach((file) => {
      const reportPath = path.join(cucumberJsonDir, file);
      const json = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

      if (!Array.isArray(json)) {
        console.error(`ERROR: '${file}' is not a valid Cucumber JSON report. Skipping.`);
        return;
      }

      json.forEach((feature: Feature) => {
        if (!feature?.name) {
          console.warn(`WARNING: Skipping feature in '${file}' with missing name.`);
          return;
        }
        cucumberReportMap[feature.name.trim()] = feature;
        cucumberReportFileMap[feature.name.trim()] = file;
      });
    });
  } catch (error) {
    console.error('ERROR: Failed to load Cucumber report files:', error);
  }
}

function addScreenshots () {
  const getAllFilesRecursively = (dir: string): string[] =>
    fs.readdirSync(dir).flatMap((file) => {
      const fullPath = path.join(dir, file);
      return fs.statSync(fullPath).isDirectory() ? getAllFilesRecursively(fullPath) : fullPath;
    });

  if (!fs.existsSync(screenshotsDir)) {
    return;
  }

  const screenshots = getAllFilesRecursively(path.resolve(screenshotsDir)).filter((file) => file.endsWith('.png'));

  const extractedFeatures = screenshots.map((screenshot) => {
    const fileName = path.basename(screenshot).replace('(failed)', '').replace('.png', '').trim();
    const match = fileName.split(' -- ');

    return match.length === 2 ? { feature: match[0].trim(), scenario: match[1].trim(), fullPath: screenshot } : null;
  }).filter(Boolean) as Array<{ feature: string, scenario: string, fullPath: string }>;

  extractedFeatures.forEach(({ feature, scenario, fullPath }) => {
    const matchedFeature = Object.keys(cucumberReportMap).find((f) => f.toLowerCase() === feature.toLowerCase());

    if (!matchedFeature) {
      console.warn(`WARNING: Feature '${feature}' not found in JSON report.`);
      return;
    }

    const featureData = cucumberReportMap[matchedFeature];
    const scenarios = featureData.elements?.filter((e) => e.name.trim().toLowerCase() === scenario.toLowerCase());

    if (!scenarios?.length) {
      console.warn(`WARNING: No matching scenario found for '${scenario}' in feature '${feature}'.`);
      return;
    }

    let foundFailedStep = false;
    scenarios.forEach((scenarioData) => {
      if (foundFailedStep) {
        return;
      }

      const stepToAttach = scenarioData.steps.find((step) =>
        fullPath.includes('(failed)') ? step.result.status === 'failed' : step.name.includes('screenshot'));

      if (!stepToAttach) {
        return;
      }

      try {
        if (!fs.existsSync(fullPath)) {
          console.error(`ERROR: Screenshot file not found -> ${fullPath}`);
          return;
        }

        const base64Image = fs.readFileSync(fullPath).toString('base64');
        stepToAttach.embeddings = stepToAttach.embeddings || [];
        stepToAttach.embeddings.push({ data: base64Image, mime_type: 'image/png' });
        foundFailedStep = true;

        console.info(chalk.blue('\n    Adding screenshot(s) to HTML report for'));
        console.info(chalk.blue(`    '${matchedFeature} - ${scenarioData.name}'`));
      } catch (error) {
        console.error(`ERROR reading screenshot file '${fullPath}':`, error);
      }
    });

    const reportFilePath = path.join(cucumberJsonDir, cucumberReportFileMap[matchedFeature]);

    let existingData: Feature[] = [];
    if (fs.existsSync(reportFilePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(reportFilePath, 'utf8'));
        if (!Array.isArray(existingData)) {
          existingData = [];
        }
      } catch {
        existingData = [];
      }
    }

    const mergedData = [...existingData.filter((f) => f.name !== matchedFeature), featureData];

    try {
      fs.writeFileSync(reportFilePath, JSON.stringify(mergedData, null, jsonIndentLevel));
    } catch (error) {
      console.error(`ERROR: Failed to write valid JSON for '${matchedFeature}'.`, error);
    }
  });
}

function generateReport () {
  if (!fs.existsSync(cucumberJsonDir)) {
    console.warn(`WARNING: Folder '${cucumberJsonDir}' not found. REPORT CANNOT BE CREATED!`);
    return;
  }

  const jsonFiles = fs.readdirSync(cucumberJsonDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => `${cucumberJsonDir}/${file}`)
    .filter((file) => {
      const content = fs.readFileSync(file, 'utf8').trim();
      return content.length > 2;
    });

  if (jsonFiles.length === 0) {
    console.info(chalk.yellow(`No valid Cucumber JSON files found in '${cucumberJsonDir}'. REPORT CANNOT BE CREATED!`));
    return;
  }

  reporter.generate({
    brandTitle: 'Cypress Framework - Test Report',
    columnLayout: 1,
    jsonDir: cucumberJsonDir,
    launchReport: false,
    output: 'report/HTML/cucumber_report.html',
    reportSuiteAsScenarios: true,
    scenarioTimestamp: true,
    theme: 'bootstrap',
    metadata: {
      'Node.js': process.version,
      Platform: process.platform,
      Executed: process.env.CI ? 'GitHub Actions' : 'Local',
    },
  });
}
