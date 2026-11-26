/** Builds a selector for SauceDemo's `data-test` attributes, the most stable hook the app exposes. */
export const byTestId = (id: string) => `[data-test="${id}"]`;
