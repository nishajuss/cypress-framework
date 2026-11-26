import axe from 'axe-core';
import type { AxeResults, ImpactValue, Result } from 'axe-core';

export interface AccessibilityCheckOptions {
  /** Violation impacts that fail the check. Defaults to the two most severe levels. */
  impacts?: ImpactValue[];
  /** axe rule IDs to skip, e.g. for a known issue in the application under test. Each one should say why. */
  skipRules?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Runs an axe-core audit of the current page against WCAG 2.x A/AA rules.
       * Each violation is logged to the Command Log with the offending elements, and the
       * command fails if any violation has one of the given impacts.
       */
      checkAccessibility (options?: AccessibilityCheckOptions): Chainable<void>;
    }
  }
}

type AxeWindow = Window & { axe?: typeof axe };

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function logViolation (violation: Result) {
  Cypress.log({
    name: 'a11y',
    message: `[${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} element(s))`,
    consoleProps: () => ({
      Rule: violation.id,
      Impact: violation.impact,
      Description: violation.description,
      'Help URL': violation.helpUrl,
      Elements: violation.nodes.map((node) => node.target.join(' ')),
    }),
  });
}

function summarise (violations: Result[]) {
  return violations
    .map((v) => `  - [${v.impact}] ${v.id}: ${v.help}\n      ${v.nodes.map((n) => n.target.join(' ')).join('\n      ')}`)
    .join('\n');
}

Cypress.Commands.add('checkAccessibility', ({ impacts = ['critical', 'serious'], skipRules = [] }: AccessibilityCheckOptions = {}) => {
  cy.window({ log: false }).then((win: AxeWindow) => {
    // axe is bundled with the spec and injected into the application window, so no CDN or plugin is needed.
    if (!win.axe) {
      const script = win.document.createElement('script');
      script.textContent = axe.source;
      win.document.head.appendChild(script);
    }

    const rules = Object.fromEntries(skipRules.map((id) => [id, { enabled: false }]));

    return cy.wrap(
      win.axe!.run(win.document, { runOnly: { type: 'tag', values: WCAG_TAGS }, rules }),
      { log: false, timeout: 30000 },
    ).then((results) => {
      const { violations } = results as AxeResults;
      violations.forEach(logViolation);

      const blocking = violations.filter((v) => v.impact && impacts.includes(v.impact));
      expect(blocking, `${impacts.join('/')} accessibility violations:\n${summarise(blocking)}`).to.have.length(0);
    });
  });
});

export {};
