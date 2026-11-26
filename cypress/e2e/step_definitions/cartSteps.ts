import { DataTable, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import cartPage from '../../pages/cartPage';
import header from '../../pages/components/header';

When('I open the shopping cart', () => {
  header.cartLink().click();
  cy.location('pathname').should('eq', cartPage.path);
});

When('I click continue shopping', () => {
  cartPage.continueShoppingButton().click();
});

When('I proceed to checkout', () => {
  cartPage.checkoutButton().click();
});

Then('the cart should contain exactly the following products:', (dataTable: DataTable) => {
  const expected = dataTable.hashes().map(({ productName }) => productName);

  cartPage.itemNames().should(($items) => {
    const actual = [...$items].map((el) => el.innerText.trim());
    expect(actual).to.have.members(expected);
  });
});

Then(/^the cart badge should show "(\d+)"$/, (count: string) => {
  header.cartBadge().should('be.visible').and('have.text', count);
});
