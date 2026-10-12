/** The questionnaire's path, shared by the gate on the page itself and by
 * every prompt that offers to take someone there. A client component cannot
 * import it from the server page without pulling that page's data access in,
 * so it lives here on its own. */
export const FIND_A_PLACE_PATH = "/get-started/find-a-place"
