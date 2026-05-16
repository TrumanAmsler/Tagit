[README.md](https://github.com/user-attachments/files/27831058/README.md)
# Tagit - Moxfield Auto Tagger

Tagit is a Chrome/Edge browser extension that analyzes a Moxfield Magic: The Gathering deck and generates Moxfield Bulk Edit lines with purpose tags.

It is built for Commander-style deck organization. Tagit reads the deck, checks card rules text, classifies each card by role, and outputs local Moxfield deck tag syntax like `#Ramp`, `#Mana Rock`, and `#Creature Removal`.

Tagit does NOT ask for your Moxfield login or any private information. It fills or copies a Bulk Edit list, then leaves the final save to you.

## Install locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the folder you unzipped.

*If you are using the zip file, unzip it first. Browsers cannot load the packed `.zip` through Load unpacked.*

## Use

1. Open a Moxfield deck page.
2. Click the floating star button in the bottom-right corner.
3. Choose your options.
4. Click Analyze deck.
5. Click Fill Bulk Edit.
6. Review the list in Moxfield's Bulk Edit view, then save.

*If the Bulk Edit editor is not visible yet, Tagit will try to open it. You can also use Copy tagged list and paste manually.*

After analysis, Tagit shows a tag mix bar with a Current/Recommended switch. Current uses the deck's visible or stored tags, including Bulk Edit inline tags and grouped tag headings on the main deck page. On the main page, a grouped heading only counts when Tagit can see an actual main-deck card under it, so utility sections like Moxfield's token dropdown are ignored. Recommended uses Tagit's generated tags. If no current tags are found, Current falls back to recommendations. The chart can be expanded into a full bar chart that compares every tag instead of only the top tags.

## Options

Tagit currently has three toggles:

- Ignore cards that already have tags: keeps existing Moxfield tags on those cards and skips adding new guessed tags to them.
- Include land tags: adds land-focused tags like `#Land`, `#Utility Land`, and `#MDFC Land`. This is off by default to avoid noisy deck lists.
- Split removal into specific tags: uses detailed removal tags like `#Creature Removal`, `#Artifact Removal`, `#Enchantment Removal`, `#Permanent Removal`, and `#Bounce`. Turn this off to use only `#Removal`.

Commanders and sideboard cards are protected. Tagit does not classify them, tag them, or emit them into the generated Bulk Edit output. If Moxfield exposes the same card in the mainboard and a protected zone, Tagit skips the mainboard duplicate too.

## Tag Format

Tagit now emits local deck tags with `#Tag`. It does not emit global tags with `#!Tag`.

```text
1 Sol Ring #Ramp
1 Counterspell #Counterspell
1 Reality Shift #Creature Removal #Removal
1 Arcane Signet #Mana Rock #Fixing #Ramp
```

With Split removal into specific tags turned off, removal cards use the simpler form:

```text
1 Reality Shift #Removal
```

## Current Tags

Tagit currently recognizes these default deckbuilding roles:

- Ramp
- Mana Rock
- Mana Dork
- Land Ramp
- Land Hate
- Ritual
- Cost Reduction
- Fixing
- Emerge
- +X/+-X
- Gambit
- Draw
- Card Advantage
- Cantrip
- Loot
- Wheel
- Tutor
- Removal
- Creature Removal
- Artifact Removal
- Enchantment Removal
- Permanent Removal
- Bounce
- Board Wipe
- Counterspell
- Ability Counter
- Protection
- Flash
- Haste
- Life Gain
- Evasion
- Fog
- Theft
- Recursion
- Reanimation
- Graveyard Hate
- Self-Mill
- Mill
- Poison
- Proliferate
- Tokens
- Copy
- Sac Outlet
- Stax
- Control
- Ping
- Group Slug
- Threat
- Combo Piece
- Payoff
- Wincon
- Land
- Utility Land
- MDFC Land

`Threat` is a fallback tag. A creature with no clearer role becomes `Threat`.

Draw-related tags are only kept when the card actually creates a draw effect. Cards like `Chasm Skulker` that care about you drawing cards are treated as payoff cards instead of draw cards.

## Checks

Run the classifier regression checks with:

```text
node scripts/check-classifier.js
```

## How It Reads Decks

Tagit first tries Moxfield's public deck endpoint. If Moxfield blocks that request, it tries from the active Moxfield page. If that also fails, it falls back to reading the visible card list on the page.

When card rules text is missing from Moxfield data, Tagit asks Scryfall for the card by exact name and uses the returned Oracle text and type line for classification.

## Notes

Moxfield can change its public API, page structure, or Bulk Edit behavior. If that happens, Tagit should fail safely by showing an error instead of changing anything in your deck. (Look for an update if that happens!)
