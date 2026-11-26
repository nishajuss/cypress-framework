@ui @checkout
Feature: 03 SauceDemo inventory sorting and checkout validation

  Background:
    Given I am logged in to SauceDemo as "SAUCE_STANDARD_USER"

  Scenario Outline: 01 Sort inventory - <sortOption>
    When I sort the inventory by "<sortOption>"
    Then the inventory should be sorted by "<expectedOrder>"

    Examples:
      | sortOption          | expectedOrder    |
      | Price (low to high) | price ascending  |
      | Price (high to low) | price descending |
      | Name (A to Z)       | name ascending   |
      | Name (Z to A)       | name descending  |

  @smoke
  Scenario: 02 Valid customer information proceeds to the checkout overview
    Given I add "Sauce Labs Backpack" to the cart
    And I open the shopping cart
    And I proceed to checkout
    When I enter first name "John", last name "Doe", and postal code "90210"
    And I continue checkout
    Then I should be on the checkout overview page

  Scenario Outline: 03 Checkout information validation - <case>
    Given I add "Sauce Labs Backpack" to the cart
    And I open the shopping cart
    And I proceed to checkout
    When I enter first name "<firstName>", last name "<lastName>", and postal code "<postalCode>"
    And I continue checkout
    Then I should see the checkout error "<error>"

    Examples:
      | case                | firstName | lastName | postalCode | error                          |
      | missing first name  |           | Doe      | 90210      | Error: First Name is required  |
      | missing last name   | John      |          | 90210      | Error: Last Name is required   |
      | missing postal code | John      | Doe      |            | Error: Postal Code is required |
