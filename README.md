# How the cipher works?
- Password
  - we grab a string of symbols and turn them into numbers thru ASCII, e.g. % = symbol from the ASCII numeration, BUT for english its a bit different, it becomes number of letter in the alphabet, example a -> 0 (because in code counting from 0 rather than 1)
  - this works for literally ANY symbol, not just letters — emoji, russian letters, whatever, `ord()` gives every symbol a number no matter what
  - problem: those numbers can be huge (emoji = 128512 for example), way bigger than our 26-letter alphabet can handle
  - fix: we use `% 26` (modulo = remainder after division), so no matter how big the number is, it always lands somewhere in 0-25
  - so password of any length, any symbols, turns into a list of numbers 0-25, one number per symbol, e.g. `"key123"` -> `[10, 4, 24, 1, 2, 3]`

- Text
  - same as the password turning symbols into ASCII, but only applied to actual letters (a-z, A-Z) — everything else (spaces, punctuation, numbers) gets skipped for now, handled separately
  - letter -> number via `ord(letter) - ord('a')`, so a=0, b=1, c=2 ... z=25
  - we go through the text one letter at a time, left to right

- Combining password and text together
  - for every letter in the text, we grab the next number from the password
  - if password is shorter than the text, we just loop back to the start of the password and keep going (basically Vigenere cipher)
  - letter_number + password_number = shifted number
  - then we subtract 3 extra, just as an additional twist (totally arbitrary, could be any fixed number)
  - if the result goes above 25 or below 0, it "wraps around" like a clock — 26 becomes 0, -1 becomes 25 (this wraparound math is called modulo)

- Non-letters (spaces, punctuation, digits)
  - they get wrapped in brackets, like `[ ]` or `[!]`

- How the Uppercase gets handled?
  - we do all the math treating every letter as lowercase
  - if the original letter was uppercase, we just add 26 to the final number as a flag

# You can check how the cipher works on the [here](https://whymaks.github.io/Cipher/), btw
