import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import checkoutPage from '../../pages/checkoutPage';
import header from '../../pages/components/header';

When(/^I enter first name "(.*)", last name "(.*)", and postal code "(.*)"$/, (firstName: string, lastName: string, postalCode: string) => {
  checkoutPage.fillCustomerInformation({ firstName, lastName, postalCode });
});

When('I continue checkout', () => {
  checkoutPage.continueButton().click();
});

Then('I should be on the checkout overview page', () => {
  cy.location('pathname').should('eq', checkoutPage.overviewPath);
  header.title().should('have.text', 'Checkout: Overview');
});

Then(/^I should see the checkout error "(.*)"$/, (message: string) => {
  checkoutPage.errorMessage().should('be.visible').and('have.text', message);
});
