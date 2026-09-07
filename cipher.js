const BYTE = 256;
const SHIFT = 3;
const GROUP_WIDTH = 3;

function pymod(a, n) { return ((a % n) + n) % n; }

function strToNums(str) {
  if (!str) throw new Error('String cannot be empty');
  return Array.from(str).map(c => pymod(c.codePointAt(0), BYTE));
}

function passphraseToNums(passphrase) {
  return strToNums(passphrase);
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

function timeToNums(timeStr) {
  const t = (timeStr || '').trim();
  if (!t) throw new Error('Time value cannot be empty');
  return strToNums(t);
}

function dateTimeToNums(precision) {
  const now = new Date();
  const Y = String(now.getFullYear());
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const D = String(now.getDate()).padStart(2, '0');
  const H = String(now.getHours()).padStart(2, '0');
  const Mi = String(now.getMinutes()).padStart(2, '0');
  const S = String(now.getSeconds()).padStart(2, '0');
  let str;
  switch (precision) {
    case 'year':   str = Y; break;
    case 'month':  str = Y + M; break;
    case 'day':    str = Y + M + D; break;
    case 'hour':   str = Y + M + D + H; break;
    case 'minute': str = Y + M + D + H + Mi; break;
    case 'second': str = Y + M + D + H + Mi + S; break;
    default:       str = Y + M + D + H + Mi + S;
  }
  return strToNums(str);
}

function buildKeyStream(passNums, hexNums, timeNums, length, algo) {
  const sources = [];
  if (passNums) sources.push(passNums);
  if (hexNums) sources.push(hexNums);
  if (timeNums) sources.push(timeNums);
  if (sources.length === 0) {
    throw new Error('At least one key must be included');
  }
  const key = [];
  for (let i = 0; i < length; i++) {
    let val = sources[0][i % sources[0].length];
    for (let s = 1; s < sources.length; s++) {
      const sk = sources[s][i % sources[s].length];
      val = algo === 'multiply' ? pymod(val * sk, BYTE) : pymod(val + sk, BYTE);
    }
    key.push(val);
  }
  return key;
}

function encodeCipher(passphrase, hexKey, timePrecision, text, algo) {
  algo = algo || 'add';
  const pNums = passphrase ? passphraseToNums(passphrase) : null;
  const hNums = hexKey ? hexToNums(hexKey) : null;
  const tNums = timePrecision ? dateTimeToNums(timePrecision) : null;
  const chars = Array.from(text);
  const key = buildKeyStream(pNums, hNums, tNums, chars.length, algo);

  let result = '';
  chars.forEach((ch, i) => {
    const p = pymod(ch.codePointAt(0), BYTE);
    let c = pymod(p + key[i], BYTE);
    c = pymod(c - SHIFT, BYTE);
    result += String(c).padStart(GROUP_WIDTH, '0');
  });
  return result;
}

function decodeCipher(passphrase, hexKey, timeStr, cipherText, algo) {
  algo = algo || 'add';
  if (cipherText.length % GROUP_WIDTH !== 0) {
    throw new Error('Cipher text length must be a multiple of 3');
  }
  const pNums = passphrase ? passphraseToNums(passphrase) : null;
  const hNums = hexKey ? hexToNums(hexKey) : null;
  const tNums = timeStr ? timeToNums(timeStr) : null;
  const nChars = cipherText.length / GROUP_WIDTH;
  const key = buildKeyStream(pNums, hNums, tNums, nChars, algo);

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
