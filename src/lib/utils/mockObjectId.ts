export function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');

  const randomHex = [...Array(16)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

  return timestamp + randomHex;
}

export function isValidMockObjectId(id: string): boolean {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}
