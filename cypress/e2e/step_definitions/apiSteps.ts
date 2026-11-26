import { After, DataTable, Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { z } from 'zod';
import { apiSchemas, type ApiSchemaName, type Booking } from '../../api/schemas';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiResponse {
  status: number;
  body: unknown;
}

interface RequestOptions {
  body?: object;
  qs?: Record<string, string>;
  token?: string;
}

/** Bookings created during a scenario, so the After hook can delete any a scenario leaves behind. */
const createdBookings = new Set<number>();

const apiUrl = (path: string) => `${Cypress.expose('apiBaseUrl')}${path}`;

const getBooking = () => cy.get<Booking>('@booking');
const getBookingId = () => cy.get<number>('@bookingId');
const getToken = () => cy.get<string>('@token');
const getApiResponse = () => cy.get<ApiResponse>('@apiResponse');

/**
 * Sends a request and stores the status and body under the `@apiResponse` alias.
 * Error statuses don't fail the request: scenarios assert on them explicitly.
 * Restful Booker reads the auth token from a `token` cookie.
 */
function sendRequest (method: HttpMethod, path: string, { body, qs, token }: RequestOptions = {}) {
  return cy.request({
    method,
    url: apiUrl(path),
    body,
    qs,
    headers: {
      Accept: 'application/json',
      ...(token ? { Cookie: `token=${token}` } : {}),
    },
    failOnStatusCode: false,
  }).then(({ status, body: responseBody }) => {
    cy.wrap<ApiResponse>({ status, body: responseBody }, { log: false }).as('apiResponse', { type: 'static' });
  });
}

function createBooking (booking: object) {
  return sendRequest('POST', '/booking', { body: booking }).then(() => {
    getApiResponse().then(({ status, body }) => {
      if (status === 200) {
        const { bookingid } = body as { bookingid: number };
        createdBookings.add(bookingid);
        cy.wrap(bookingid, { log: false }).as('bookingId', { type: 'static' });
      }
    });
  });
}

function requestToken (password?: string) {
  return cy.env(['BOOKER_USERNAME', 'BOOKER_PASSWORD']).then((env) => {
    expect(env.BOOKER_USERNAME, 'Cypress env value for BOOKER_USERNAME').to.be.a('string').and.not.be.empty;
    expect(env.BOOKER_PASSWORD, 'Cypress env value for BOOKER_PASSWORD').to.be.a('string').and.not.be.empty;

    return sendRequest('POST', '/auth', {
      body: { username: env.BOOKER_USERNAME, password: password ?? env.BOOKER_PASSWORD },
    });
  });
}

/**
 * Applies a two-column data table (field | value) to a booking. Values are converted to the
 * type each field holds, and `checkin` / `checkout` are written into `bookingdates`.
 * Returns the full updated booking and just the changed fields (for partial updates).
 */
function applyChanges (booking: Booking, table: DataTable): { updated: Booking; changes: Partial<Booking> } {
  const updated: Booking = { ...booking, bookingdates: { ...booking.bookingdates } };
  const changes: Partial<Booking> = {};

  Object.entries(table.rowsHash()).forEach(([field, value]) => {
    switch (field) {
      case 'firstname':
      case 'lastname':
      case 'additionalneeds':
        updated[field] = value;
        changes[field] = value;
        break;
      case 'totalprice':
        updated.totalprice = Number(value);
        changes.totalprice = Number(value);
        break;
      case 'depositpaid':
        updated.depositpaid = value === 'true';
        changes.depositpaid = value === 'true';
        break;
      case 'checkin':
      case 'checkout':
        updated.bookingdates[field] = value;
        changes.bookingdates = updated.bookingdates;
        break;
      default:
        throw new Error(`Unknown booking field in data table: "${field}"`);
    }
  });

  return { updated, changes };
}

Given('I prepare a unique booking', () => {
  const uniqueId = `${Date.now()}${Cypress._.random(1000, 9999)}`;

  cy.fixture<Booking>('bookingPayload').then((template) => {
    cy.wrap<Booking>({ ...template, lastname: `${template.lastname}-${uniqueId}` }).as('booking', { type: 'static' });
  });
});

Given('the prepared booking exists', () => {
  getBooking().then(createBooking);
  getApiResponse().its('status').should('eq', 200);
});

Given('I am authenticated as an admin', () => {
  requestToken();
  getApiResponse().then(({ status, body }) => {
    expect(status, 'auth status').to.eq(200);
    const { token } = apiSchemas.token.parse(body);
    cy.wrap(token, { log: false }).as('token', { type: 'static' });
  });
});

When('I create the prepared booking', () => {
  getBooking().then(createBooking);
});

When('I create a booking with only a first name', () => {
  getBooking().then(({ firstname }) => createBooking({ firstname }));
});

When('I request the booking', () => {
  getBookingId().then((id) => sendRequest('GET', `/booking/${id}`));
});

When('I search for bookings by the guest name', () => {
  getBooking().then(({ firstname, lastname }) => sendRequest('GET', '/booking', { qs: { firstname, lastname } }));
});

When('I authenticate with the admin credentials', () => {
  requestToken();
});

When('I authenticate with an incorrect password', () => {
  requestToken('not-the-password');
});

When('I replace the booking with these changes:', (table: DataTable) => {
  getBooking().then((booking) => {
    const { updated } = applyChanges(booking, table);
    cy.wrap<Booking>(updated).as('booking', { type: 'static' });

    getBookingId().then((id) => {
      getToken().then((token) => sendRequest('PUT', `/booking/${id}`, { body: updated, token }));
    });
  });
});

When('I partially update the booking with these changes:', (table: DataTable) => {
  getBooking().then((booking) => {
    const { updated, changes } = applyChanges(booking, table);
    cy.wrap<Booking>(updated).as('booking', { type: 'static' });

    getBookingId().then((id) => {
      getToken().then((token) => sendRequest('PATCH', `/booking/${id}`, { body: changes, token }));
    });
  });
});

When('I delete the booking', () => {
  getBookingId().then((id) => {
    getToken().then((token) => sendRequest('DELETE', `/booking/${id}`, { token }));
  });
});

When(/^I send a "(PUT|PATCH|DELETE)" request for the booking with (no|an invalid) token$/, (method: HttpMethod, tokenVariant: string) => {
  const token = tokenVariant === 'no' ? undefined : 'not-a-valid-token';

  getBooking().then((booking) => {
    // An attempted change that the scenario then checks was not applied.
    const bodies: Partial<Record<HttpMethod, object>> = {
      PUT: { ...booking, lastname: 'Unauthorised' },
      PATCH: { lastname: 'Unauthorised' },
    };

    getBookingId().then((id) => sendRequest(method, `/booking/${id}`, { body: bodies[method], token }));
  });
});

Then('the response status should be {int}', (expected: number) => {
  getApiResponse().its('status').should('eq', expected);
});

/**
 * For known bugs: asserts the status the API returns today, and records the correct one.
 * If the bug is fixed, the assertion fails with a message saying so.
 */
Then('the response status should be {int} instead of the correct {int}', (current: number, correct: number) => {
  getApiResponse().its('status').then((status) => {
    expect(status, `status (known bug: should be ${correct}; if it is now, the bug has been fixed and this scenario needs updating)`)
      .to.eq(current);
  });
});

Then('the response body should be {string}', (expected: string) => {
  getApiResponse().its('body').should('eq', expected);
});

Then('the response body should match the {string} schema', (schemaName: ApiSchemaName) => {
  expect(apiSchemas, 'known schema names').to.have.property(schemaName);

  getApiResponse().then(({ body }) => {
    const result = apiSchemas[schemaName].safeParse(body);
    const problems = result.success ? '' : `:\n${z.prettifyError(result.error)}`;

    expect(result.success, `response body matches the "${schemaName}" schema${problems}`).to.be.true;
  });
});

Then('the response should contain the prepared booking', () => {
  getBooking().then((booking) => {
    getApiResponse().its('body').then((body) => {
      // `POST /booking` wraps the booking with its id; other endpoints return the booking itself.
      const returned = (body as { booking?: Booking }).booking ?? body;
      expect(returned, 'returned booking').to.deep.equal(booking);
    });
  });
});

Then('the stored booking should match the prepared booking', () => {
  getBooking().then((booking) => {
    getBookingId().then((id) => {
      cy.request({ url: apiUrl(`/booking/${id}`), headers: { Accept: 'application/json' } })
        .its('body')
        .should('deep.equal', booking);
    });
  });
});

Then('the results should contain only the booking', () => {
  getBookingId().then((id) => {
    getApiResponse().its('body').should('deep.equal', [{ bookingid: id }]);
  });
});

Then('the booking should no longer exist', () => {
  getBookingId().then((id) => {
    cy.request({ url: apiUrl(`/booking/${id}`), headers: { Accept: 'application/json' }, failOnStatusCode: false })
      .its('status')
      .should('eq', 404);
  });
});

/**
 * Deletes every booking a scenario created, including after a failure, so the shared
 * public API isn't left with test data. Bookings that are already gone are ignored.
 */
After({ tags: '@api' }, () => {
  if (createdBookings.size === 0) {
    return;
  }

  cy.env(['BOOKER_USERNAME', 'BOOKER_PASSWORD']).then((env) => {
    cy.request({
      method: 'POST',
      url: apiUrl('/auth'),
      body: { username: env.BOOKER_USERNAME, password: env.BOOKER_PASSWORD },
      log: false,
    }).then(({ body }) => {
      const { token } = body as { token: string };

      createdBookings.forEach((id) => {
        cy.request({
          method: 'DELETE',
          url: apiUrl(`/booking/${id}`),
          headers: { Cookie: `token=${token}` },
          failOnStatusCode: false,
          log: false,
        });
      });
      createdBookings.clear();
    });
  });
});
