@ui @login
Feature: 01 SauceDemo login

  Background:
    Given I open the SauceDemo login page

  @smoke
  Scenario: 01 Standard user can log in
    When I login to SauceDemo with user key "SAUCE_STANDARD_USER"
    Then I should be on the SauceDemo inventory page

  Scenario: 02 Locked out user is rejected
    When I login to SauceDemo with user key "SAUCE_LOCKED_OUT_USER"
    Then I should see the login error "Epic sadface: Sorry, this user has been locked out."

  Scenario Outline: 03 Login form validation - <case>
    When I login to SauceDemo with username "<username>" and password "<password>"
    Then I should see the login error "<error>"

    Examples:
      | case                | username      | password       | error                                                                     |
      | missing username    |               | secret_sauce   | Epic sadface: Username is required                                        |
      | missing password    | standard_user |                | Epic sadface: Password is required                                        |
      | invalid credentials | standard_user | wrong_password | Epic sadface: Username and password do not match any user in this service |
