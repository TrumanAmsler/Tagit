const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("src/content.js", "utf8");
const sandbox = {
  document: { getElementById: () => true },
  console
};

vm.runInNewContext(source, sandbox);

const classify = sandbox.__tagitTest.classifyForTest;
const collectDeckEntries = sandbox.__tagitTest.collectDeckEntriesForTest;

const cases = [
  {
    name: "Chasm Skulker",
    card: {
      name: "Chasm Skulker",
      type_line: "Creature - Squid Horror",
      oracle_text: "Whenever you draw a card, put a +1/+1 counter on Chasm Skulker.\nWhen Chasm Skulker dies, create X 1/1 blue Squid creature tokens with islandwalk, where X is the number of +1/+1 counters on Chasm Skulker."
    },
    mustNotInclude: ["Draw", "Card Advantage", "Cantrip"],
    mustInclude: ["Payoff", "Tokens"]
  },
  {
    name: "Loran of the Third Path",
    card: {
      name: "Loran of the Third Path",
      type_line: "Legendary Creature - Human Artificer",
      oracle_text: "Vigilance\nWhen Loran of the Third Path enters the battlefield, destroy up to one target artifact or enchantment.\n{T}: You and target opponent each draw a card."
    },
    mustInclude: ["Draw"]
  },
  {
    name: "Counterspell",
    card: {
      name: "Counterspell",
      type_line: "Instant",
      oracle_text: "Counter target spell."
    },
    mustInclude: ["Counterspell"]
  },
  {
    name: "Shorikai, Genesis Engine",
    zone: "Commander",
    existingTags: ["Commander"],
    card: {
      name: "Shorikai, Genesis Engine",
      type_line: "Legendary Artifact - Vehicle",
      oracle_text: "{1}, {T}: Draw two cards, then discard a card. Create a 1/1 colorless Pilot creature token with 'This creature crews Vehicles as though its power were 2 greater.'"
    },
    mustNotInclude: ["Commander", "Draw", "Tokens"]
  },
  {
    name: "Aether Gale",
    zone: "Sideboard",
    card: {
      name: "Aether Gale",
      type_line: "Sorcery",
      oracle_text: "Return six target nonland permanents to their owners' hands."
    },
    mustNotInclude: ["Bounce", "Removal"]
  }
];

for (const test of cases) {
  const tags = classify({ zone: test.zone || "Mainboard", quantity: 1, name: test.name, card: test.card, existingTags: test.existingTags || [] });
  for (const tag of test.mustInclude || []) {
    if (!tags.includes(tag)) throw new Error(`${test.name} should include ${tag}. Got: ${tags.join(", ")}`);
  }
  for (const tag of test.mustNotInclude || []) {
    if (tags.includes(tag)) throw new Error(`${test.name} should not include ${tag}. Got: ${tags.join(", ")}`);
  }
}

const protectedZoneEntries = collectDeckEntries({
  commanders: {
    commander: {
      quantity: 1,
      card: { name: "Shorikai, Genesis Engine" }
    }
  },
  sideboard: {
    sideboardCard: {
      quantity: 1,
      card: { name: "Aether Gale" }
    }
  },
  mainboard: {
    duplicate: {
      quantity: 1,
      card: { name: "Shorikai, Genesis Engine" }
    },
    sideboardDuplicate: {
      quantity: 1,
      card: { name: "Aether Gale" }
    },
    solRing: {
      quantity: 1,
      card: { name: "Sol Ring" }
    }
  }
});

const commanderCopies = protectedZoneEntries.filter((entry) => entry.name === "Shorikai, Genesis Engine");
if (commanderCopies.length !== 0) {
  throw new Error(`Commander should not be emitted for tagging. Got: ${JSON.stringify(commanderCopies)}`);
}

const sideboardCopies = protectedZoneEntries.filter((entry) => entry.name === "Aether Gale");
if (sideboardCopies.length !== 0) {
  throw new Error(`Sideboard cards should not be emitted for tagging. Got: ${JSON.stringify(sideboardCopies)}`);
}

const solRingCopies = protectedZoneEntries.filter((entry) => entry.name === "Sol Ring");
if (solRingCopies.length !== 1 || solRingCopies[0].zone !== "Mainboard") {
  throw new Error(`Mainboard cards should still be emitted once. Got: ${JSON.stringify(solRingCopies)}`);
}

console.log("classifier checks ok");
