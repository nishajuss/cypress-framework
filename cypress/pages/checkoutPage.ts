import { byTestId } from './selectors';

export interface CustomerInformation {
  firstName: string;
  lastName: string;
  postalCode: string;
}

class CheckoutPage {
  readonly overviewPath = '/checkout-step-two.html';

  firstNameInput () {
    return cy.get(byTestId('firstName'));
  }

  lastNameInput () {
    return cy.get(byTestId('lastName'));
  }

  postalCodeInput () {
    return cy.get(byTestId('postalCode'));
  }

  continueButton () {
    return cy.get(byTestId('continue'));
  }

  errorMessage () {
    return cy.get(byTestId('error'));
  }

  /** Fills the customer form. Empty values are left blank to support validation scenarios. */
  fillCustomerInformation ({ firstName, lastName, postalCode }: CustomerInformation) {
    const fields: Array<[() => Cypress.Chainable<JQuery<HTMLElement>>, string]> = [
      [() => this.firstNameInput(), firstName],
      [() => this.lastNameInput(), lastName],
      [() => this.postalCodeInput(), postalCode],
    ];

    fields.forEach(([field, value]) => {
      field().clear();
      if (value) {
        field().type(value);
      }
    });
  }
}

export default new CheckoutPage();
