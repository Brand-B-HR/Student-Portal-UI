/**
 * Splits a typed full name on the LAST space, so multi-word given names
 * ("Mary Anne Smith") keep the surname intact. A single word becomes the
 * first name with an empty last name.
 */
export function splitName(name: string): { firstName: string; lastName: string } {
  const i = name.lastIndexOf(" ");
  if (i === -1) return { firstName: name, lastName: "" };
  return { firstName: name.slice(0, i), lastName: name.slice(i + 1) };
}
