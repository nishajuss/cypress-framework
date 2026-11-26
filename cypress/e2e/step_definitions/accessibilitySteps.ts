import { Then } from '@badeball/cypress-cucumber-preprocessor';

Then('the page should have no serious accessibility violations', () => {
  cy.checkAccessibility();
});
