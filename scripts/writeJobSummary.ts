/**
 * Writes a summary of the Cucumber JSON results to the GitHub Actions run page
 * (or to stdout when run locally): scenarios per feature, known bugs, and any failures.
 *
 * Usage: tsx scripts/writeJobSummary.ts [title]
 */
import fs from 'node:fs';
import path from 'node:path';

const cucumberJsonDir = 'report/JSON/';
const reportUrl = 'https://nishajuss.github.io/cypress-framework/';

interface Step {
  name?: string;
  keyword?: string;
  result: { status: string; error_message?: string };
}

interface Scenario {
  name: string;
  type: string;
  tags?: { name: string }[];
  steps: Step[];
}

interface Feature {
  name: string;
  elements?: Scenario[];
}

type Outcome = 'passed' | 'failed' | 'skipped';

const outcomeOf = ({ steps }: Scenario): Outcome => {
  if (steps.some(({ result }) => result.status === 'failed')) {
    return 'failed';
  }
  return steps.every(({ result }) => result.status === 'passed') ? 'passed' : 'skipped';
};

const features: Feature[] = fs.existsSync(cucumberJsonDir)
  ? fs.readdirSync(cucumberJsonDir)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => JSON.parse(fs.readFileSync(path.join(cucumberJsonDir, file), 'utf8')) as Feature[])
  : [];

const rows = features.map((feature) => {
  const scenarios = (feature.elements ?? []).filter(({ type }) => type === 'scenario');
  return { feature, scenarios, outcomes: scenarios.map(outcomeOf) };
});

const all = rows.flatMap(({ scenarios, outcomes }) => scenarios.map((scenario, i) => ({ scenario, outcome: outcomes[i] })));
const total = (outcome: Outcome) => all.filter((item) => item.outcome === outcome).length;
const failed = rows.flatMap(({ feature, scenarios, outcomes }) =>
  scenarios.filter((_, i) => outcomes[i] === 'failed').map((scenario) => ({ feature, scenario })));
const knownBugs = all.filter(({ scenario }) => scenario.tags?.some(({ name }) => name === '@known-bug'));

const title = process.argv[2] ?? 'Cypress test results';
const headline = all.length === 0
  ? '⚠️ **No results found**: the run may have stopped before any scenario finished.'
  : failed.length === 0
    ? `✅ **All ${total('passed')} scenarios passed**`
    : `❌ **${failed.length} of ${all.length} scenarios failed**`;

const lines = [
  `## ${title}`,
  '',
  headline,
  '',
];

if (all.length > 0) {
  lines.push(
    '| Feature | Passed | Failed | Skipped |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map(({ feature, outcomes }) => {
      const n = (outcome: Outcome) => outcomes.filter((o) => o === outcome).length;
      return `| ${feature.name} | ${n('passed')} | ${n('failed')} | ${n('skipped')} |`;
    }),
    `| **Total** | **${total('passed')}** | **${failed.length}** | **${total('skipped')}** |`,
    '',
  );
}

if (knownBugs.length > 0) {
  const names = [...new Set(knownBugs.map(({ scenario }) => scenario.name))];
  lines.push(
    `🐞 **Known bugs:** ${names.length} \`@known-bug\` scenario${names.length === 1 ? '' : 's'} document${names.length === 1 ? 's' : ''} a confirmed defect in the application under test and pass while the defect exists:`,
    ...names.map((name) => `- ${name}`),
    '',
  );
}

if (failed.length > 0) {
  lines.push('### Failures', '');
  failed.forEach(({ feature, scenario }) => {
    const step = scenario.steps.find(({ result }) => result.status === 'failed');
    const stepText = step?.name ? `${step.keyword?.trim() ?? ''} ${step.name}`.trim() : 'a hook';
    const error = (step?.result.error_message ?? 'No error message').split('\n')[0].trim();
    lines.push(`- **${feature.name}** › ${scenario.name}  \n  Failed at: _${stepText}_  \n  \`${error.replace(/`/g, "'")}\``);
  });
  lines.push('');
}

lines.push(`📊 Full HTML report, with screenshots of any failures: attached to this run, and published to [GitHub Pages](${reportUrl}) from \`main\`.`, '');

const summary = lines.join('\n');
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
} else {
  console.log(summary);
}
