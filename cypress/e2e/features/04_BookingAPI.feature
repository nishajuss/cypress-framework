@api
Feature: 04 Booking API

  Restful Booker is a hotel booking REST API. Anyone can create and read bookings;
  changing or deleting one needs a token from the auth endpoint.

  Background:
    Given I prepare a unique booking

  @smoke
  Scenario: 01 Create a booking
    When I create the prepared booking
    Then the response status should be 200
    And the response body should match the "created booking" schema
    And the response should contain the prepared booking

  Scenario: 02 Read a booking
    Given the prepared booking exists
    When I request the booking
    Then the response status should be 200
    And the response body should match the "booking" schema
    And the response should contain the prepared booking

  Scenario: 03 Find a booking by guest name
    Given the prepared booking exists
    When I search for bookings by the guest name
    Then the response status should be 200
    And the response body should match the "booking ids" schema
    And the results should contain only the booking

  @smoke
  Scenario: 04 Authenticate as an admin
    When I authenticate with the admin credentials
    Then the response status should be 200
    And the response body should match the "token" schema

  Scenario: 05 Replace a booking
    Given the prepared booking exists
    And I am authenticated as an admin
    When I replace the booking with these changes:
      | lastname        | Lovelace      |
      | totalprice      | 410           |
      | depositpaid     | false         |
      | checkout        | 2027-03-06    |
      | additionalneeds | Late checkout |
    Then the response status should be 200
    And the response body should match the "booking" schema
    And the response should contain the prepared booking
    And the stored booking should match the prepared booking

  Scenario: 06 Partially update a booking
    Given the prepared booking exists
    And I am authenticated as an admin
    When I partially update the booking with these changes:
      | totalprice | 199 |
    Then the response status should be 200
    And the stored booking should match the prepared booking

  Scenario: 07 Delete a booking
    Given the prepared booking exists
    And I am authenticated as an admin
    When I delete the booking
    Then the booking should no longer exist

  Scenario Outline: 08 <method> without a valid token is rejected
    Given the prepared booking exists
    When I send a "<method>" request for the booking with <token> token
    Then the response status should be 403
    And the response body should be "Forbidden"
    And the stored booking should match the prepared booking

    Examples:
      | method | token      |
      | PUT    | no         |
      | PATCH  | an invalid |
      | DELETE | no         |

  # Known bugs: each scenario asserts what the API does today and names the correct status.
  # If a bug is fixed, its scenario fails with a message saying so, as a prompt to update it.

  @known-bug
  Scenario: 09 Known bug: a wrong password is accepted as a successful request
    When I authenticate with an incorrect password
    Then the response status should be 200 instead of the correct 401
    And the response body should match the "auth failure" schema

  @known-bug
  Scenario: 10 Known bug: an incomplete booking causes a server error
    When I create a booking with only a first name
    Then the response status should be 500 instead of the correct 400

  @known-bug
  Scenario: 11 Known bug: deleting a booking responds "Created"
    Given the prepared booking exists
    And I am authenticated as an admin
    When I delete the booking
    Then the response status should be 201 instead of the correct 200
    And the response body should be "Created"

  @known-bug
  Scenario: 12 Known bug: deleting a missing booking is "Method Not Allowed"
    Given the prepared booking exists
    And I am authenticated as an admin
    And I delete the booking
    When I delete the booking
    Then the response status should be 405 instead of the correct 404
