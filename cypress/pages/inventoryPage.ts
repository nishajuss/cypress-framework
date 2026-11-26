import { byTestId } from './selectors';

class InventoryPage {
  readonly path = '/inventory.html';

  /**
   * SauceDemo is a single-page app: its server answers deep links with HTTP 404
   * before the client-side router renders the page, so the status code is not meaningful here.
   */
  visit () {
    cy.visit(this.path, { failOnStatusCode: false });
  }

  sortSelect () {
    return cy.get(byTestId('product-sort-container'));
  }

  itemPrices () {
    return cy.get(byTestId('inventory-item-price'));
  }

  itemNames () {
    return cy.get(byTestId('inventory-item-name'));
  }

  item (itemName: string) {
    return cy.contains(byTestId('inventory-item'), itemName);
  }

  addToCartButton (itemName: string) {
    return this.item(itemName).find('[data-test^="add-to-cart-"]');
  }

  addToCart (itemName: string) {
    this.addToCartButton(itemName).click();
  }
}

export default new InventoryPage();
