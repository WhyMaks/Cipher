function pymod(a, n) { return ((a % n) + n) % n; }

function letterToNum(ch) {
  return ch.toLowerCase().codePointAt(0) - 'a'.codePointAt(0);
}

function numToLetter(n) {
  return String.fromCodePoint(pymod(n, 26) + 'a'.codePointAt(0));
}

function passphraseToNums(passphrase) {
  if (!passphrase) throw new Error('Passphrase cannot be empty');
  return Array.from(passphrase).map(c => pymod(c.codePointAt(0), 26));
}

const ALPHABET_SIZE = 26;
const SHIFT = 3;

function isLetter(ch) {
  return /\p{L}/u.test(ch);
}
function isUpperChar(ch) {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

function encodeCipher(passphrase, text) {
  const keyNums = passphraseToNums(passphrase);
  const keyLen = keyNums.length;
  let result = '';
  let keyIndex = 0;

  for (const ch of Array.from(text)) {
    if (isLetter(ch)) {
      const p = letterToNum(ch);
      const k = keyNums[keyIndex % keyLen];
      let c = pymod(p + k, ALPHABET_SIZE);
      c = pymod(c - SHIFT, ALPHABET_SIZE);
      if (isUpperChar(ch)) c += ALPHABET_SIZE;
      result += String(c).padStart(3, '0');
      keyIndex++;
    } else {
      result += '[' + ch + ']';
    }
  }
  return result;
}

function decodeCipher(passphrase, cipherText) {
  const keyNums = passphraseToNums(passphrase);
  const keyLen = keyNums.length;
  let result = '';
  let keyIndex = 0;
  let i = 0;
  const n = cipherText.length;

  while (i < n) {
    if (cipherText[i] === '[') {
      const end = cipherText.indexOf(']', i);
      if (end === -1) throw new Error('Malformed input: unmatched [');
      result += cipherText.slice(i + 1, end);
      i = end + 1;
    } else {
      const group = cipherText.slice(i, i + 3);
      if (group.length < 3 || !/^\d{3}$/.test(group)) {
        throw new Error('Malformed input near position ' + i);
      }
      let c = parseInt(group, 10);
      const isUpper = c >= ALPHABET_SIZE;
      c = pymod(c, ALPHABET_SIZE);
      c = pymod(c + SHIFT, ALPHABET_SIZE);
      const k = keyNums[keyIndex % keyLen];
      const p = pymod(c - k, ALPHABET_SIZE);
      let letter = numToLetter(p);
      if (isUpper) letter = letter.toUpperCase();
      result += letter;
      keyIndex++;
      i += 3;
    }
  }
  return result;
}
