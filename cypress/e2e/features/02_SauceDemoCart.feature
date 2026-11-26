@ui @cart
Feature: 02 SauceDemo cart management

  Background:
    Given I am logged in to SauceDemo as "SAUCE_STANDARD_USER"

  @smoke
  Scenario: 01 Add multiple items to the cart
    When I add the following products to the cart:
      | productName             |
      | Sauce Labs Backpack     |
      | Sauce Labs Bike Light   |
      | Sauce Labs Bolt T-Shirt |
    Then the cart badge should show "3"
    When I open the shopping cart
    Then the cart should contain exactly the following products:
      | productName             |
      | Sauce Labs Backpack     |
      | Sauce Labs Bike Light   |
      | Sauce Labs Bolt T-Shirt |

  Scenario: 02 Continue shopping from the cart returns to the inventory
    Given I add "Sauce Labs Fleece Jacket" to the cart
    And I open the shopping cart
    When I click continue shopping
    Then I should be on the SauceDemo inventory page
    And the cart badge should show "1"
