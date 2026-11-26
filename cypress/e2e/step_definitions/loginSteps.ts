import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import loginPage from '../../pages/loginPage';
import inventoryPage from '../../pages/inventoryPage';
import header from '../../pages/components/header';

Given('I open the SauceDemo login page', () => {
  loginPage.visit();
});

Given(/^I am logged in to SauceDemo as "(.*)"$/, (userKey: string) => {
  cy.loginAs(userKey);
  inventoryPage.visit();
});

When(/^I login to SauceDemo with user key "(.*)"$/, (userKey: string) => {
  cy.sauceDemoCredentials(userKey).then(({ username, password }) => {
    loginPage.login(username, password);
  });
});

When(/^I login to SauceDemo with username "(.*)" and password "(.*)"$/, (username: string, password: string) => {
  loginPage.login(username, password);
});

Then('I should be on the SauceDemo inventory page', () => {
  cy.location('pathname').should('eq', inventoryPage.path);
  header.title().should('have.text', 'Products');
});

Then(/^I should see the login error "(.*)"$/, (message: string) => {
  cy.location('pathname').should('eq', loginPage.path);
  loginPage.errorMessage().should('be.visible').and('have.text', message);
});
