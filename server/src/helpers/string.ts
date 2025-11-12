const CHARACTERS: string =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "abcdefghijklmnopqrstuvwxyz" +
  "0123456789" +
  "!@#$%^&*";

export function GeneratePassword(length: number = 12): string {
  if (length <= 0) {
    return "";
  }

  const randomArray = new Uint8Array(length);

  crypto.getRandomValues(randomArray);

  let password = "";
  const charLength = CHARACTERS.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = randomArray[i] % charLength;
    password += CHARACTERS[randomIndex];
  }

  return password;
}

