# Tagit - Moxfield Auto Tagger

Tagit is a Chrome/Edge browser extension that analyzes a Moxfield deck and generates Moxfield Bulk Edit lines with purpose tags.

It uses Moxfield's public deck endpoint to read the deck and Scryfall's public card endpoint as a fallback for card rules text. It does not ask for your Moxfield login and does not call private write endpoints.

## Install locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked *Make sure zip file is unpacked*.
4. Select this folder: `C:\Users\awpch\OneDrive\Desktop\Tagit`.

## Use

1. Open a Moxfield deck page, for example `https://moxfield.com/decks/Wq9lNxU8Ck2gT8mN5N48UQ`.
2. Click the floating `T` button in the bottom-right corner.
3. Click Analyze deck.
4. Click Fill Bulk Edit.
5. Review the list in Moxfield's Bulk Edit view, then save.

If the Bulk Edit editor is not visible yet, Tagit will try to open it. You can also use Copy tagged list and paste manually.

Moxfield tag syntax uses `#!Tag`, so a generated line can look like:

```text
1 Sol Ring #!Ramp
1 Counterspell #!Counterspell
1 Reality Shift #!Removal
```

## Current tag categories

Tagit currently recognizes common Commander deck roles:

- Ramp
- Draw
- Tutor
- Removal
- Board Wipe
- Counterspell
- Protection
- Blink
- Recursion
- Graveyard Hate
- Stax
- Copy
- Tokens
- Sac Outlet
- Combo Piece
- Payoff
- Wincon
- Threat
- Utility
- Land

The "Ignore cards that already have tags" option keeps existing Moxfield tags on those cards and skips adding new guessed tags to them.

## Notes

Moxfield can change its public API or Bulk Edit behavior. If that happens, Tagit should fail safely by showing an error instead of changing anything in your deck.
