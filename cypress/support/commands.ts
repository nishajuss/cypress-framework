import loginPage from '../pages/loginPage';
import inventoryPage from '../pages/inventoryPage';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Resolves SauceDemo credentials for the given env key (e.g. `SAUCE_STANDARD_USER`).
       * Fails fast with a clear message if either value is missing.
       */
      sauceDemoCredentials (userKey: string): Chainable<{ username: string; password: string }>;

      /**
       * Logs in through the UI once per user and caches the session with `cy.session`,
       * so subsequent scenarios restore the cookie instead of repeating the login flow.
       */
      loginAs (userKey: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('sauceDemoCredentials', (userKey: string) => {
  return cy.env([userKey, 'SAUCE_PASSWORD']).then((envValues) => {
    const username = envValues[userKey];
    const password = envValues.SAUCE_PASSWORD;

    expect(username, `Cypress env value for ${userKey}`).to.be.a('string').and.not.be.empty;
    expect(password, 'Cypress env value for SAUCE_PASSWORD').to.be.a('string').and.not.be.empty;

    return { username: String(username), password: String(password) };
  });
});

Cypress.Commands.add('loginAs', (userKey: string) => {
  cy.sauceDemoCredentials(userKey).then(({ username, password }) => {
    cy.session(
      ['sauce-demo', username],
      () => {
        loginPage.visit();
        loginPage.login(username, password);
        cy.location('pathname').should('eq', inventoryPage.path);
      },
      {
        validate: () => {
          cy.getCookie('session-username').should('have.property', 'value', username);
        },
        cacheAcrossSpecs: true,
      },
    );
  });
});

export {};
