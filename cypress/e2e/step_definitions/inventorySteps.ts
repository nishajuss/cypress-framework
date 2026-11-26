import { DataTable, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import inventoryPage from '../../pages/inventoryPage';

type SortOrder = 'price ascending' | 'price descending' | 'name ascending' | 'name descending';

const textOf = ($elements: JQuery<HTMLElement>) => [...$elements].map((el) => el.innerText.trim());

When(/^I sort the inventory by "(.*)"$/, (sortOption: string) => {
  inventoryPage.sortSelect().select(sortOption);
});

Then(/^the inventory should be sorted by "(.*)"$/, (order: SortOrder) => {
  const [field, direction] = order.split(' ');
  const descending = direction === 'descending';

  if (field === 'price') {
    inventoryPage.itemPrices().then(($prices) => {
      const prices = textOf($prices).map((text) => Number(text.replace('$', '')));
      const expected = [...prices].sort((a, b) => (descending ? b - a : a - b));
      expect(prices, `prices sorted ${direction}`).to.deep.equal(expected);
    });
  } else if (field === 'name') {
    inventoryPage.itemNames().then(($names) => {
      const names = textOf($names);
      const expected = [...names].sort((a, b) => (descending ? b.localeCompare(a) : a.localeCompare(b)));
      expect(names, `names sorted ${direction}`).to.deep.equal(expected);
    });
  } else {
    throw new Error(`Unsupported sort order '${order}'. Expected one of: price/name ascending/descending.`);
  }
});

When(/^I add "(.*)" to the cart$/, (itemName: string) => {
  inventoryPage.addToCart(itemName);
});

When('I add the following products to the cart:', (dataTable: DataTable) => {
  dataTable.hashes().forEach(({ productName }) => inventoryPage.addToCart(productName));
});
