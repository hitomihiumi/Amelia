/**
 * `JSON.parse` that keeps whole numbers too big for a JavaScript number as text.
 *
 * Discord ids are 64-bit. A model that writes one without quotes (`"roleId": 123456789012345678`)
 * would otherwise have it rounded to a different id before anything could check it. So the text
 * is read once first, and every bare run of 16 or more digits outside a string gets quotes.
 */
export function parseJson(text: string): unknown {
  let out = "";
  let inString = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (inString) {
      out += char;
      if (char === "\\") out += text[++index] ?? "";
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === "-" || (char >= "0" && char <= "9")) {
      let end = index + 1;
      while (end < text.length && /[0-9.eE+-]/.test(text[end])) end++;
      const number = text.slice(index, end);
      out += /^-?\d{16,}$/.test(number) ? `"${number}"` : number;
      index = end - 1;
      continue;
    }

    out += char;
  }

  return JSON.parse(out);
}
