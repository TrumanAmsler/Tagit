(() => {
  const TAGIT_ID = "tagit-moxfield-root";
  const DECK_ID_RE = /moxfield\.com\/decks\/([^/?#]+)/i;
  const SCRYFALL_DELAY_MS = 80;

  const DEFAULT_OPTIONS = {
    ignoreTagged: true,
    includeLands: false,
    maxTagsPerCard: 3
  };

  const TAG_RULES = [
    {
      tag: "Ramp",
      tests: [
        /add(s)? (one|two|three|[{\w/}]+) mana/i,
        /search your library for .* land/i,
        /treasure token/i,
        /cost(s)? .* less to cast/i
      ],
      names: ["Sol Ring", "Arcane Signet", "Fellwar Stone", "Mind Stone", "Mana Crypt", "Mana Vault", "Chrome Mox", "Mox Diamond", "Lotus Petal", "Jeweled Lotus"]
    },
    {
      tag: "Draw",
      tests: [
        /draw (a|two|three|x|that many) cards?/i,
        /draw cards equal/i,
        /whenever .* draw/i,
        /investigate/i
      ]
    },
    {
      tag: "Tutor",
      tests: [
        /search your library for (a|an|any|up to)/i,
        /search your library .* reveal/i,
        /transmute/i
      ],
      exclude: [/basic land/i, /land card/i]
    },
    {
      tag: "Removal",
      tests: [
        /destroy target/i,
        /exile target/i,
        /return target .* to (its owner's|their owner's) hand/i,
        /counter target activated or triggered ability/i,
        /deals? .* damage to target/i,
        /target creature gets -/i
      ]
    },
    {
      tag: "Board Wipe",
      tests: [
        /destroy all/i,
        /exile all/i,
        /return all .* to (their|its) owners'? hands/i,
        /all creatures get -/i,
        /deals? .* damage to each creature/i
      ]
    },
    {
      tag: "Counterspell",
      tests: [/counter target spell/i, /counter up to one target spell/i],
      names: ["Counterspell", "Mana Drain", "Force of Will", "Force of Negation", "Swan Song", "Pact of Negation", "Flusterstorm"]
    },
    {
      tag: "Protection",
      tests: [
        /gain(s)? indestructible/i,
        /hexproof/i,
        /protection from/i,
        /phase out/i,
        /can't be the target/i,
        /prevent all damage/i
      ]
    },
    {
      tag: "Blink",
      tests: [
        /exile .* you control.*return .* to the battlefield/i,
        /exile target .* return .* to the battlefield/i,
        /exile .* then return .* to the battlefield/i,
        /exile .* until .* leaves the battlefield/i,
        /return .* to the battlefield under (its|your|their) owner's control/i
      ],
      names: ["Ephemerate", "Ghostly Flicker", "Displacer Kitten", "Thassa, Deep-Dwelling", "Teleportation Circle", "Conjurer's Closet", "Eerie Interlude", "Momentary Blink"]
    },
    {
      tag: "Recursion",
      tests: [
        /return target .* from your graveyard/i,
        /return .* from your graveyard to/i,
        /cast .* from your graveyard/i,
        /from your graveyard/i
      ]
    },
    {
      tag: "Graveyard Hate",
      tests: [
        /exile .* graveyard/i,
        /exile all cards from target player's graveyard/i,
        /cards in graveyards can't/i
      ]
    },
    {
      tag: "Stax",
      tests: [
        /can't untap/i,
        /players can't/i,
        /spells cost .* more/i,
        /unless (that player|they) pay/i,
        /skip .* step/i,
        /doesn't untap/i
      ],
      names: ["Propaganda", "Ghostly Prison", "Rhystic Study", "Smothering Tithe", "Winter Orb", "Static Orb"]
    },
    {
      tag: "Copy",
      tests: [
        /copy target/i,
        /copy .* spell/i,
        /create a token that's a copy/i,
        /becomes a copy/i,
        /you may have .* enter .* as a copy/i
      ],
      names: ["Helm of the Host", "Sculpting Steel", "Phyrexian Metamorph", "Twincast", "Lithoform Engine", "Strionic Resonator"]
    },
    {
      tag: "Tokens",
      tests: [/create .* token/i, /populate/i]
    },
    {
      tag: "Sac Outlet",
      tests: [
        /sacrifice (a|another|one or more) (creature|artifact|permanent|token)/i,
        /sacrifice .*:/i,
        /, sacrifice .*:/i
      ],
      names: ["Ashnod's Altar", "Phyrexian Altar", "Viscera Seer", "Carrion Feeder", "Goblin Bombardment", "Altar of Dementia", "Woe Strider"]
    },
    {
      tag: "Combo Piece",
      tests: [
        /untap target .* permanent/i,
        /whenever .* untap/i,
        /copy .* activated ability/i,
        /activate abilities .* without paying/i,
        /you may cast .* without paying (its|their) mana cost/i
      ],
      names: ["Isochron Scepter", "Dramatic Reversal", "Basalt Monolith", "Rings of Brighthearth", "Freed from the Real", "Pemmin's Aura", "Deadeye Navigator", "Intruder Alarm"]
    },
    {
      tag: "Payoff",
      tests: [
        /whenever .* enters .* battlefield.*draw/i,
        /whenever .* dies.*draw/i,
        /whenever .* dies.*each opponent/i,
        /whenever .* cast .* copy/i,
        /whenever .* cast .* create/i,
        /whenever .* draw .* each opponent/i,
        /whenever .* sacrifice .* each opponent/i
      ],
      names: ["Impact Tremors", "Purphoros, God of the Forge", "Blood Artist", "Zulaport Cutthroat", "Altar of the Brood", "Psychosis Crawler", "Aetherflux Reservoir"]
    },
    {
      tag: "Wincon",
      tests: [
        /you win the game/i,
        /target player loses the game/i,
        /each opponent loses/i,
        /you get an emblem/i,
        /extra turn/i,
        /can't lose the game/i
      ],
      names: ["Thassa's Oracle", "Laboratory Maniac", "Jace, Wielder of Mysteries", "Approach of the Second Sun", "Expropriate"]
    }
  ];

  const LAND_TYPES = ["Land", "Basic Land"];

  if (document.getElementById(TAGIT_ID)) return;

  const state = {
    options: { ...DEFAULT_OPTIONS },
    deck: null,
    suggestions: [],
    output: ""
  };

  const root = document.createElement("div");
  root.id = TAGIT_ID;
  root.className = "tagit-root";
  root.innerHTML = `
    <button class="tagit-tab" type="button" title="Open Tagit">T</button>
    <section class="tagit-panel tagit-hidden" aria-label="Tagit Moxfield Auto Tagger">
      <div class="tagit-header">
        <div>
          <h2 class="tagit-title">Tagit</h2>
          <p class="tagit-subtitle">Suggest Moxfield purpose tags, then paste them into Bulk Edit.</p>
        </div>
        <button class="tagit-close" type="button" title="Close">x</button>
      </div>
      <div class="tagit-body">
        <div class="tagit-actions">
          <button class="tagit-button" data-action="analyze" type="button">Analyze deck</button>
          <button class="tagit-button secondary" data-action="copy" type="button" disabled>Copy tagged list</button>
          <button class="tagit-button secondary" data-action="fill" type="button" disabled>Fill Bulk Edit</button>
        </div>
        <div class="tagit-options">
          <label class="tagit-check"><input type="checkbox" data-option="ignoreTagged" checked> Ignore cards that already have tags</label>
          <label class="tagit-check"><input type="checkbox" data-option="includeLands"> Include land tags</label>
        </div>
        <p class="tagit-status">Open a Moxfield deck page and press Analyze deck.</p>
        <div class="tagit-results"></div>
        <textarea class="tagit-output tagit-hidden" spellcheck="false" aria-label="Tagged Moxfield bulk edit output"></textarea>
      </div>
    </section>
  `;
  document.documentElement.appendChild(root);

  const tab = root.querySelector(".tagit-tab");
  const panel = root.querySelector(".tagit-panel");
  const close = root.querySelector(".tagit-close");
  const status = root.querySelector(".tagit-status");
  const results = root.querySelector(".tagit-results");
  const output = root.querySelector(".tagit-output");
  const analyzeButton = root.querySelector('[data-action="analyze"]');
  const copyButton = root.querySelector('[data-action="copy"]');
  const fillButton = root.querySelector('[data-action="fill"]');

  tab.addEventListener("click", () => {
    tab.classList.add("tagit-hidden");
    panel.classList.remove("tagit-hidden");
  });

  close.addEventListener("click", () => {
    panel.classList.add("tagit-hidden");
    tab.classList.remove("tagit-hidden");
  });

  root.querySelectorAll("[data-option]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.options[checkbox.dataset.option] = checkbox.checked;
      if (state.deck) {
        state.suggestions = state.suggestions.map((item) => ({ ...item, tags: classify(item) }));
        renderSuggestions();
      }
    });
  });

  analyzeButton.addEventListener("click", async () => {
    setBusy(true, "Fetching the Moxfield deck...");
    try {
      const deckId = getDeckId();
      if (!deckId) throw new Error("This does not look like a Moxfield deck URL.");
      state.deck = await fetchDeck(deckId);
      setStatus("Reading card text and assigning roles...");
      state.suggestions = await buildSuggestions(state.deck);
      renderSuggestions();
    } catch (error) {
      setStatus(error.message || "Something went wrong while analyzing this deck.");
      console.error("[Tagit]", error);
    } finally {
      setBusy(false);
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(state.output);
      setStatus("Tagged list copied. In Moxfield, open Bulk Edit, replace the list, and save.");
    } catch {
      output.classList.remove("tagit-hidden");
      output.select();
      setStatus("Clipboard access was blocked. The tagged list is selected below.");
    }
  });

  fillButton.addEventListener("click", () => {
    const filled = fillBulkEditor(state.output);
    if (filled) {
      setStatus("Filled the visible Bulk Edit editor. Review the list, then press Moxfield's save button.");
      return;
    }

    const opened = clickBulkEdit();
    if (opened) {
      setStatus("Opened Bulk Edit. Press Fill Bulk Edit again after the editor finishes loading.");
      return;
    }

    setStatus("I could not find Bulk Edit on this page. Open Moxfield Bulk Edit, then press Fill Bulk Edit again.");
  });

  function getDeckId() {
    const match = window.location.href.match(DECK_ID_RE);
    return match?.[1] || null;
  }

  async function fetchDeck(deckId) {
    const url = `https://api2.moxfield.com/v2/decks/all/${encodeURIComponent(deckId)}`;
    try {
      return await sendMessage({ type: "fetchJson", url });
    } catch (backgroundError) {
      try {
        const response = await fetch(url, {
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`Request returned ${response.status}`);
        return response.json();
      } catch {
        const visibleDeck = collectVisibleDeck();
        if (Object.keys(visibleDeck.mainboard).length || Object.keys(visibleDeck.commanders).length) {
          setStatus("Moxfield blocked the deck API here, so I am using the visible card list on the page.");
          return visibleDeck;
        }
        throw backgroundError;
      }
    }
  }

  async function buildSuggestions(deck) {
    const entries = collectDeckEntries(deck);
    const suggestions = [];
    for (const entry of entries) {
      const enriched = await enrichEntry(entry);
      suggestions.push({
        ...enriched,
        tags: classify(enriched)
      });
      await wait(SCRYFALL_DELAY_MS);
    }
    return suggestions;
  }

  function collectDeckEntries(deck) {
    const zones = [
      ["Commander", deck.commanders],
      ["Mainboard", deck.mainboard],
      ["Sideboard", deck.sideboard],
      ["Considering", deck.considering]
    ];
    const entries = [];
    zones.forEach(([zone, cards]) => {
      Object.values(cards || {}).forEach((entry) => {
        const card = entry.card || entry;
        const name = card.name || entry.name;
        if (!name) return;
        entries.push({
          zone,
          quantity: entry.quantity || entry.qty || entry.count || 1,
          name,
          card,
          existingTags: normalizeExistingTags(entry)
        });
      });
    });
    return entries;
  }

  function collectVisibleDeck() {
    const ignored = new Set(["Primer", "Playtest", "Bulk Edit", "Buy Deck", "More", "Change"]);
    const mainboard = {};
    const commanders = {};
    const lines = document.body.innerText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    let currentZone = "mainboard";

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^Commander\s*\(/i.test(line)) {
        currentZone = "commanders";
        continue;
      }
      if (/^[A-Za-z][\w\s'/-]+\s*\(\d+\)$/i.test(line)) {
        currentZone = "mainboard";
        continue;
      }
      if (ignored.has(line) || /^(Add to|Buy @|Sell @|Change price|Find and add)/i.test(line)) continue;

      let match = line.match(/^(\d+)\s+(.+)$/);
      if (!match && /^\d+$/.test(line) && lines[index + 1]) {
        match = [null, line, lines[index + 1]];
        index += 1;
      }
      if (!match) continue;

      const quantity = Number(match[1]);
      const name = cleanupVisibleName(match[2]);
      if (!quantity || !name || ignored.has(name) || name.length > 80) continue;

      const zone = currentZone === "commanders" ? commanders : mainboard;
      if (!zone[name]) {
        zone[name] = { quantity, card: { name } };
      }
    }

    return { commanders, mainboard, sideboard: {}, considering: {} };
  }

  function cleanupVisibleName(name) {
    return name
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeExistingTags(entry) {
    const values = [
      ...(Array.isArray(entry.tags) ? entry.tags : []),
      ...(Array.isArray(entry.card?.tags) ? entry.card.tags : [])
    ];
    return values.map(getTagName).filter(Boolean);
  }

  function getTagName(tag) {
    const value = typeof tag === "string" ? tag : tag?.name || tag?.tag || tag?.value || "";
    return String(value).replace(/^#!/, "").trim();
  }

  async function enrichEntry(entry) {
    const card = entry.card || {};
    if (card.oracle_text || card.oracleText || card.type_line || card.typeLine) return entry;
    try {
      const scryfall = await sendMessage({ type: "fetchJson", url: `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(entry.name)}` });
      return { ...entry, card: { ...card, ...scryfall } };
    } catch {
      return entry;
    }
  }

  function classify(entry) {
    const card = entry.card || {};
    const name = entry.name;
    const oracle = getOracleText(card);
    const typeLine = card.type_line || card.typeLine || "";
    const tags = new Set(entry.existingTags || []);

    if (state.options.ignoreTagged && entry.existingTags?.length) return [...tags];
    if (state.options.includeLands && LAND_TYPES.some((type) => typeLine.includes(type))) tags.add("Land");
    if (!state.options.includeLands && typeLine.includes("Land")) return [...tags];

    for (const rule of TAG_RULES) {
      const nameMatch = rule.names?.some((candidate) => candidate.toLowerCase() === name.toLowerCase());
      const textMatch = rule.tests.some((regex) => regex.test(oracle));
      const excluded = rule.exclude?.some((regex) => regex.test(oracle));
      if ((nameMatch || textMatch) && !excluded) tags.add(rule.tag);
    }

    if (typeLine.includes("Creature") && !tags.size) tags.add("Threat");
    if ((typeLine.includes("Artifact") || typeLine.includes("Enchantment")) && !tags.size) tags.add("Utility");

    return [...tags].slice(0, state.options.maxTagsPerCard);
  }

  function getOracleText(card) {
    const direct = card.oracle_text || card.oracleText || "";
    const faces = card.card_faces || card.cardFaces || [];
    const faceText = faces.map((face) => face.oracle_text || face.oracleText || "").join("\n");
    return `${direct}\n${faceText}`.trim();
  }

  function renderSuggestions() {
    const tagged = state.suggestions.filter((item) => item.tags.length);
    state.output = state.suggestions.map(formatBulkLine).join("\n");
    output.value = state.output;
    output.classList.toggle("tagit-hidden", !state.output);
    copyButton.disabled = !state.output;
    fillButton.disabled = !state.output;

    results.innerHTML = tagged.slice(0, 18).map((item) => `
      <div class="tagit-card">
        <div class="tagit-card-name">${escapeHtml(item.quantity)} ${escapeHtml(item.name)}</div>
        <div class="tagit-tags">${escapeHtml(item.tags.join(", "))}</div>
      </div>
    `).join("");

    const more = tagged.length > 18 ? ` Showing 18 of ${tagged.length} tagged cards.` : "";
    setStatus(`Built a Bulk Edit list for ${state.suggestions.length} cards with ${tagged.length} tagged cards.${more}`);
  }

  function formatBulkLine(item) {
    const tags = item.tags.map((tag) => `#!${tag}`).join(" ");
    return `${item.quantity} ${item.name}${tags ? ` ${tags}` : ""}`;
  }

  function setBusy(isBusy, message) {
    analyzeButton.disabled = isBusy;
    if (message) setStatus(message);
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function fillBulkEditor(text) {
    const textarea = findBulkTextarea();
    if (textarea) {
      textarea.focus();
      textarea.value = text;
      textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    const editable = document.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"].cm-content');
    if (editable) {
      editable.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
      editable.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      return true;
    }

    return false;
  }

  function findBulkTextarea() {
    const textareas = [...document.querySelectorAll("textarea")];
    return textareas.find((textarea) => {
      const label = [
        textarea.getAttribute("aria-label"),
        textarea.getAttribute("placeholder"),
        textarea.closest("form")?.textContent
      ].filter(Boolean).join(" ").toLowerCase();
      return label.includes("bulk") || label.includes("deck") || textarea.value.split("\n").length > 4;
    }) || null;
  }

  function clickBulkEdit() {
    const candidates = [...document.querySelectorAll("a, button")];
    const target = candidates.find((element) => element.textContent?.trim().toLowerCase() === "bulk edit");
    if (!target) return false;
    target.click();
    return true;
  }

  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "The extension could not fetch that data."));
          return;
        }
        resolve(response.data);
      });
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }
})();
