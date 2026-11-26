import { z } from 'zod';

/**
 * Response contracts for the Restful Booker API.
 *
 * Objects are strict: an unexpected field fails validation, so the weekly CI run
 * flags any change to the API's response shape, not only to its values.
 */

export const bookingSchema = z.strictObject({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  totalprice: z.number().int().nonnegative(),
  depositpaid: z.boolean(),
  bookingdates: z.strictObject({
    checkin: z.iso.date(),
    checkout: z.iso.date(),
  }),
  additionalneeds: z.string().optional(),
});

/** Returned by `POST /booking`. */
export const createdBookingSchema = z.strictObject({
  bookingid: z.number().int().positive(),
  booking: bookingSchema,
});

/** Returned by `GET /booking`, optionally filtered by name or dates. */
export const bookingIdsSchema = z.array(z.strictObject({
  bookingid: z.number().int().positive(),
}));

/** Returned by `POST /auth` for valid credentials. */
export const tokenSchema = z.strictObject({
  token: z.string().regex(/^[0-9a-f]+$/, 'expected a hex token'),
});

/** Returned by `POST /auth` for invalid credentials (with HTTP 200: see the known-bug scenarios). */
export const authFailureSchema = z.strictObject({
  reason: z.string().min(1),
});

/** Schemas by the name used in feature files. */
export const apiSchemas = {
  'booking': bookingSchema,
  'created booking': createdBookingSchema,
  'booking ids': bookingIdsSchema,
  'token': tokenSchema,
  'auth failure': authFailureSchema,
} as const;

export type ApiSchemaName = keyof typeof apiSchemas;
export type Booking = z.infer<typeof bookingSchema>;
