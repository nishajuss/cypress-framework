@ui @a11y
Feature: 05 SauceDemo accessibility

  Automated WCAG 2.2 AA checks with axe-core. Serious and critical violations fail the scenario;
  minor and moderate ones are logged to the Command Log for review.

  Scenario: 01 Login page has no serious accessibility violations
    Given I open the SauceDemo login page
    Then the page should have no serious accessibility violations

  Scenario: 02 Login error state has no serious accessibility violations
    Given I open the SauceDemo login page
    And I login to SauceDemo with username "locked_out_user" and password "wrong"
    Then the page should have no serious accessibility violations

  Scenario: 03 Inventory page has no serious accessibility violations
    Given I am logged in to SauceDemo as "SAUCE_STANDARD_USER"
    Then the page should have no serious accessibility violations

  Scenario: 04 Cart page has no serious accessibility violations
    Given I am logged in to SauceDemo as "SAUCE_STANDARD_USER"
    And I add "Sauce Labs Backpack" to the cart
    And I open the shopping cart
    Then the page should have no serious accessibility violations

  Scenario: 05 Checkout information page has no serious accessibility violations
    Given I am logged in to SauceDemo as "SAUCE_STANDARD_USER"
    And I add "Sauce Labs Backpack" to the cart
    And I open the shopping cart
    And I proceed to checkout
    Then the page should have no serious accessibility violations
