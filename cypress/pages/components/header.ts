import { byTestId } from '../selectors';

/** Header shared by every authenticated SauceDemo page. */
class Header {
  title () {
    return cy.get(byTestId('title'));
  }

  cartLink () {
    return cy.get(byTestId('shopping-cart-link'));
  }

  cartBadge () {
    return cy.get(byTestId('shopping-cart-badge'));
  }
}

export default new Header();
