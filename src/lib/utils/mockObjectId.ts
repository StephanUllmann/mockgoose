/**
 * Generates a mock ObjectId string.
 * 
 * @returns A 24-character hexadecimal string representing an ObjectId.
 */
export function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');

  const randomHex = [...Array(16)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

  return timestamp + randomHex;
}

/**
 * Checks if a string is a valid mock ObjectId.
 * 
 * @param id - The string to check.
 * @returns True if the string is a valid mock ObjectId, false otherwise.
 */
export function isValidMockObjectId(id: string): boolean {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}
