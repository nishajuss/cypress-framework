import { byTestId } from './selectors';

class CartPage {
  readonly path = '/cart.html';

  itemNames () {
    return cy.get(`${byTestId('cart-list')} ${byTestId('inventory-item-name')}`);
  }

  continueShoppingButton () {
    return cy.get(byTestId('continue-shopping'));
  }

  checkoutButton () {
    return cy.get(byTestId('checkout'));
  }
}

export default new CartPage();
