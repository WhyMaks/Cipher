#!/usr/bin/env python3
"""
Simple passphrase-based cipher.

Mechanics:
1. Each letter (a-z) is converted to a number 0-25.
2. The passphrase can consist of ANY characters (letters, digits, symbols,
   emoji, etc.) — each character of the passphrase is converted to a number
   0-25 via ord(c) % 26, meaning the passphrase acts purely as a numeric
   shift rather than an alphabetic key. The passphrase repeats cyclically
   if it's shorter than the text.
3. The result is taken modulo 26 (guaranteed to always be 0-25, nothing lost).
4. A shift of -3 is applied (also modulo 26).
5. The resulting number is output as 2 digits (00-25) — fixed width,
   so decoding has no ambiguity when splitting the string.

Decoding — the same chain of operations in reverse order.

Not just letters: anything outside a-z (spaces, punctuation, digits)
is passed through as-is, unencrypted — simply inserted in plain form
into the text representation, but NOT mixed into the numeric stream
(to avoid confusing the 2-digit split). See handle_non_alpha below.
"""

ALPHABET_SIZE = 26
GROUP_WIDTH = 2   # digit-group width per character
SHIFT = 3         # shift -3 / +3


def letter_to_num(ch: str) -> int:
    """a -> 0, b -> 1, ..., z -> 25"""
    return ord(ch.lower()) - ord('a')


def num_to_letter(n: int) -> str:
    """0 -> a, 1 -> b, ..., 25 -> z"""
    return chr((n % ALPHABET_SIZE) + ord('a'))


def passphrase_to_nums(passphrase: str) -> list:
    """
    Converts a passphrase of ANY composition (letters, digits, symbols, emoji,
    anything) into a list of numbers 0-25. Each character is taken by its
    code (ord) and reduced to the 0-25 range via mod 26 — the passphrase
    acts purely as a numeric shift, with no restriction to a specific alphabet.
    """
    if not passphrase:
        raise ValueError("Passphrase cannot be empty")
    return [ord(c) % ALPHABET_SIZE for c in passphrase]


def encode(passphrase: str, text: str) -> str:
    """
    Encrypts text. Letters a-z/A-Z are encrypted and turned into 2-digit
    groups. Everything else (spaces, punctuation, digits) is wrapped in
    [--x--] markers so decoding can restore its exact position without
    confusing it with the numeric stream.
    """
    key_nums = passphrase_to_nums(passphrase)
    key_len = len(key_nums)

    result_parts = []
    key_index = 0  # advance the passphrase pointer only on letters in the text

    for ch in text:
        if ch.isalpha():
            p = letter_to_num(ch)
            k = key_nums[key_index % key_len]
            c = (p + k) % ALPHABET_SIZE
            c = (c - SHIFT) % ALPHABET_SIZE
            # store case separately as a flag: uppercase -> +26 (26-51)
            if ch.isupper():
                c += ALPHABET_SIZE
            result_parts.append(f"{c:0{GROUP_WIDTH+1}d}")  # 3 digits, since range is 0-51
            key_index += 1
        else:
            # non-letter character: wrap as-is, with an explicit marker
            result_parts.append(f"[{ch}]")

    return ''.join(result_parts)


def decode(passphrase: str, cipher_text: str) -> str:
    """
    Decrypts text produced by encode().
    Parses the stream: either a 3-digit group (a letter) or [x] (a non-letter).
    """
    key_nums = passphrase_to_nums(passphrase)
    key_len = len(key_nums)

    result_chars = []
    key_index = 0
    i = 0
    n = len(cipher_text)
    group_len = GROUP_WIDTH + 1  # 3 digits per letter (range 0-51)

    while i < n:
        if cipher_text[i] == '[':
            end = cipher_text.index(']', i)
            result_chars.append(cipher_text[i + 1:end])
            i = end + 1
        else:
            group = cipher_text[i:i + group_len]
            c = int(group)
            is_upper = c >= ALPHABET_SIZE
            c = c % ALPHABET_SIZE
            c = (c + SHIFT) % ALPHABET_SIZE
            k = key_nums[key_index % key_len]
            p = (c - k) % ALPHABET_SIZE
            letter = num_to_letter(p)
            result_chars.append(letter.upper() if is_upper else letter)
            key_index += 1
            i += group_len

    return ''.join(result_chars)


def print_menu():
    print("\n=== Passphrase Cipher ===")
    print("options:")
    print("1. decode -> (passphrase) (text)")
    print("2. encode -> (passphrase) (text)")
    print("3. exit")


def main():
    while True:
        print_menu()
        choice = input("\nChoose an option (1/2/3): ").strip()

        if choice == '1':
            passphrase = input("passphrase: ").strip()
            text = input("text: ").strip()
            try:
                result = decode(passphrase, text)
                print(f"\n-> Decoded: {result}")
            except Exception as e:
                print(f"\nError: {e}")

        elif choice == '2':
            passphrase = input("passphrase: ").strip()
            text = input("text: ").strip()
            try:
                result = encode(passphrase, text)
                print(f"\n-> Encoded: {result}")
            except Exception as e:
                print(f"\nError: {e}")

        elif choice == '3':
            print("Bye!")
            break

        else:
            print("Unknown option, try again.")


if __name__ == "__main__":
    main()
