const BYTE = 256;
const SHIFT = 3;
const GROUP_WIDTH = 3;

function pymod(a, n) { return ((a % n) + n) % n; }

function passphraseToNums(passphrase) {
  if (!passphrase) throw new Error('Passphrase cannot be empty');
  return Array.from(passphrase).map(c => pymod(c.codePointAt(0), BYTE));
}

function hexToNums(hexKey) {
  let h = hexKey.trim().replace(/^#/, '');
  if (!h) throw new Error('Hex key cannot be empty');
  if (!/^[0-9a-fA-F]+$/.test(h)) {
    throw new Error('Hex key must contain only hex digits (0-9, a-f)');
  }
  if (h.length % 2 !== 0) h = '0' + h;
  const nums = [];
  for (let i = 0; i < h.length; i += 2) {
    nums.push(parseInt(h.slice(i, i + 2), 16));
  }
  return nums;
}

function buildKeyStream(passNums, hexNums, length, algo) {
  if (!passNums && !hexNums) {
    throw new Error('At least one of password or hex key must be included');
  }
  const key = [];
  for (let i = 0; i < length; i++) {
    let val;
    if (passNums && hexNums) {
      const pk = passNums[i % passNums.length];
      const hk = hexNums[i % hexNums.length];
      val = algo === 'multiply' ? pymod(pk * hk, BYTE) : pymod(pk + hk, BYTE);
    } else if (passNums) {
      val = passNums[i % passNums.length];
    } else {
      val = hexNums[i % hexNums.length];
    }
    key.push(val);
  }
  return key;
}

function encodeCipher(passphrase, hexKey, text, algo) {
  algo = algo || 'add';
  const pNums = passphrase ? passphraseToNums(passphrase) : null;
  const hNums = hexKey ? hexToNums(hexKey) : null;
  const chars = Array.from(text);
  const key = buildKeyStream(pNums, hNums, chars.length, algo);

  let result = '';
  chars.forEach((ch, i) => {
    const p = pymod(ch.codePointAt(0), BYTE);
    let c = pymod(p + key[i], BYTE);
    c = pymod(c - SHIFT, BYTE);
    result += String(c).padStart(GROUP_WIDTH, '0');
  });
  return result;
}

function decodeCipher(passphrase, hexKey, cipherText, algo) {
  algo = algo || 'add';
  if (cipherText.length % GROUP_WIDTH !== 0) {
    throw new Error('Cipher text length must be a multiple of 3');
  }
  const pNums = passphrase ? passphraseToNums(passphrase) : null;
  const hNums = hexKey ? hexToNums(hexKey) : null;
  const nChars = cipherText.length / GROUP_WIDTH;
  const key = buildKeyStream(pNums, hNums, nChars, algo);

  let result = '';
  for (let i = 0; i < nChars; i++) {
    const group = cipherText.slice(i * GROUP_WIDTH, (i + 1) * GROUP_WIDTH);
    if (!/^\d{3}$/.test(group)) throw new Error('Malformed cipher text near position ' + (i * GROUP_WIDTH));
    let c = parseInt(group, 10);
    c = pymod(c + SHIFT, BYTE);
    const p = pymod(c - key[i], BYTE);
    result += String.fromCodePoint(p);
  }
  return result;
}
