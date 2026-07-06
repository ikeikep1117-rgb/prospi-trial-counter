const STORAGE_KEY = "prospi-trial-counter-v3";
const OLD_STORAGE_KEYS = ["prospi-trial-counter-v2", "prospi-trial-counter-v1"];

const materialNames = {
  proof: "証",
  guide: "指南",
  secret: "極意書",
  flash: "閃きの印",
  awaken: "開眼の印",
  truth: "真価の印",
};

const trialTypes = ["剛力", "俊敏", "技巧", "心"];
const typedMaterialKeys = ["proof", "guide", "secret"];
const commonMaterialKeys = ["flash", "awaken", "truth"];
const materialKeys = [...typedMaterialKeys, ...commonMaterialKeys];
const priorities = {
  high: "高",
  middle: "中",
  low: "低",
};

const materialImages = {
  "剛力:proof": "assets/material-photos/gouriki-proof.jpg",
  "剛力:guide": "assets/material-photos/gouriki-guide.jpg",
  "剛力:secret": "assets/material-photos/gouriki-secret.jpg",
  "俊敏:proof": "assets/material-photos/shunbin-proof.jpg",
  "俊敏:guide": "assets/material-photos/shunbin-guide.jpg",
  "俊敏:secret": "assets/material-photos/shunbin-secret.jpg",
  "技巧:proof": "assets/material-photos/gikou-proof.jpg",
  "技巧:guide": "assets/material-photos/gikou-guide.jpg",
  "技巧:secret": "assets/material-photos/gikou-secret.jpg",
  "心:proof": "assets/material-photos/kokoro-proof.jpg",
  "心:guide": "assets/material-photos/kokoro-guide.jpg",
  "心:secret": "assets/material-photos/kokoro-secret.jpg",
  "common:flash": "assets/material-photos/mark-flash.jpg",
  "common:awaken": "assets/material-photos/mark-awaken.jpg",
  "common:truth": "assets/material-photos/mark-truth.jpg",
};

const trialColors = {
  "剛力": "#ff3d5f",
  "俊敏": "#33a3ff",
  "技巧": "#25f08c",
  "心": "#ff4ddb",
};

const levelCosts = {
  1: { coin: 3000, proof: 8, flash: 2 },
  2: { coin: 5000, proof: 8, guide: 8, flash: 2 },
  3: { coin: 7000, proof: 12, guide: 12, flash: 3, awaken: 3 },
  4: { coin: 10000, guide: 16, secret: 16, awaken: 4, truth: 4 },
  5: { coin: 15000, guide: 20, secret: 20, awaken: 5, truth: 5 },
};

const inventoryGrid = document.querySelector("#inventoryGrid");
const coinOwned = document.querySelector("#coinOwned");
const playerList = document.querySelector("#playerList");
const summaryGrid = document.querySelector("#summaryGrid");
const addPlayerButton = document.querySelector("#addPlayerButton");
const resetButton = document.querySelector("#resetButton");
const heroShortage = document.querySelector("#heroShortage");
const priorityFilter = document.querySelector("#priorityFilter");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

let state = loadState();

function createAbility(name = "") {
  return {
    id: crypto.randomUUID(),
    name,
    current: 0,
    target: 5,
    type: "剛力",
  };
}

function createPlayer(name) {
  return {
    id: crypto.randomUUID(),
    name,
    priority: "middle",
    isOpen: true,
    abilities: [createAbility("特殊能力 1"), createAbility("特殊能力 2"), createAbility("特殊能力 3")],
  };
}

function buildEmptyInventory() {
  const inventory = { common: {} };
  trialTypes.forEach((type) => {
    inventory[type] = {};
    typedMaterialKeys.forEach((key) => {
      inventory[type][key] = 0;
    });
  });
  commonMaterialKeys.forEach((key) => {
    inventory.common[key] = 0;
  });
  return inventory;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY) || OLD_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!saved) {
    return {
      inventory: buildEmptyInventory(),
      coinOwned: 0,
      players: [createPlayer("選手 1")],
    };
  }

  try {
    const parsed = JSON.parse(saved);
    if (parsed.abilities && !parsed.players) {
      parsed.players = [{ id: crypto.randomUUID(), name: "選手 1", abilities: parsed.abilities.slice(0, 3) }];
    }
    return normalizeState(parsed);
  } catch {
    return {
      inventory: buildEmptyInventory(),
      coinOwned: 0,
      players: [createPlayer("選手 1")],
    };
  }
}

function normalizeState(source = {}) {
  const players = Array.isArray(source.players) && source.players.length ? source.players : [createPlayer("選手 1")];
  return {
    inventory: mergeInventory(source.inventory),
    coinOwned: numberOrZero(source.coinOwned),
    players: players.map(normalizePlayer),
  };
}

function normalizePlayer(player, playerIndex) {
  const abilities = Array.isArray(player.abilities) ? player.abilities.slice(0, 3) : [];
  while (abilities.length < 3) {
    abilities.push(createAbility(`特殊能力 ${abilities.length + 1}`));
  }

  return {
    id: player.id || crypto.randomUUID(),
    name: player.name || `選手 ${playerIndex + 1}`,
    priority: priorities[player.priority] ? player.priority : "middle",
    isOpen: player.isOpen === undefined ? true : Boolean(player.isOpen),
    abilities: abilities.map((ability, abilityIndex) => ({
      id: ability.id || crypto.randomUUID(),
      name: ability.name || `特殊能力 ${abilityIndex + 1}`,
      current: clampLevel(ability.current, 0),
      target: clampLevel(ability.target, 5, 1),
      type: trialTypes.includes(ability.type) ? ability.type : "剛力",
    })),
  };
}

function mergeInventory(saved = {}) {
  const merged = buildEmptyInventory();
  trialTypes.forEach((type) => {
    typedMaterialKeys.forEach((key) => {
      merged[type][key] = numberOrZero(saved[type]?.[key]);
    });
  });
  commonMaterialKeys.forEach((key) => {
    const legacyValues = trialTypes.map((type) => numberOrZero(saved[type]?.[key]));
    merged.common[key] = numberOrZero(saved.common?.[key]) || Math.max(...legacyValues, 0);
  });
  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function numberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

function clampLevel(value, fallback, min = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(5, Math.max(min, Math.floor(numeric)));
}

function materialImageKey(type, key) {
  return commonMaterialKeys.includes(key) ? `common:${key}` : `${type}:${key}`;
}

function materialIcon(key, type = "") {
  const color = commonMaterialKeys.includes(key) ? "#ffd166" : trialColors[type] || "#7df9ff";
  return `
    <span class="material-icon" style="--trial-color: ${color}">
      <img src="${materialImages[materialImageKey(type, key)]}" alt="" loading="lazy">
    </span>
  `;
}

function getCostFromTo(current, target) {
  const cost = { coin: 0 };
  materialKeys.forEach((key) => {
    cost[key] = 0;
  });

  for (let level = current + 1; level <= target; level += 1) {
    const levelCost = levelCosts[level] || {};
    cost.coin += levelCost.coin || 0;
    materialKeys.forEach((key) => {
      cost[key] += levelCost[key] || 0;
    });
  }

  return cost;
}

function getAbilityCost(ability) {
  const current = Math.min(Number(ability.current), Number(ability.target));
  const target = Math.max(Number(ability.current), Number(ability.target));
  return getCostFromTo(current, target);
}

function createEmptyTotals() {
  const totals = { coin: 0, common: {} };
  commonMaterialKeys.forEach((key) => {
    totals.common[key] = 0;
  });
  trialTypes.forEach((type) => {
    totals[type] = {};
    typedMaterialKeys.forEach((key) => {
      totals[type][key] = 0;
    });
  });
  return totals;
}

function getTotals() {
  const totals = createEmptyTotals();
  state.players.forEach((player) => {
    player.abilities.forEach((ability) => {
      addAbilityCostToTotals(totals, ability, getAbilityCost(ability));
    });
  });
  return totals;
}

function getPlayerCost(player) {
  const totals = createEmptyTotals();
  player.abilities.forEach((ability) => {
    addAbilityCostToTotals(totals, ability, getAbilityCost(ability));
  });
  return totals;
}

function addAbilityCostToTotals(totals, ability, cost) {
  totals.coin += cost.coin;
  typedMaterialKeys.forEach((key) => {
    totals[ability.type][key] += cost[key];
  });
  commonMaterialKeys.forEach((key) => {
    totals.common[key] += cost[key];
  });
}

function getOwnedForItem(item) {
  if (item.kind === "coin") return state.coinOwned;
  if (item.type) return state.inventory[item.type][item.key];
  return state.inventory.common[item.key];
}

function getRequiredItemsFromTotals(totals) {
  const items = [{ kind: "coin", key: "coin", name: "コイン", required: totals.coin }];
  trialTypes.forEach((type) => {
    typedMaterialKeys.forEach((key) => {
      items.push({ kind: "material", type, key, name: `${type}の${materialNames[key]}`, required: totals[type][key] });
    });
  });
  commonMaterialKeys.forEach((key) => {
    items.push({ kind: "material", key, name: materialNames[key], required: totals.common[key] });
  });
  return items.filter((item) => item.required > 0 || item.kind === "coin");
}

function getShortageItemsFromTotals(totals) {
  return getRequiredItemsFromTotals(totals)
    .map((item) => ({ ...item, owned: getOwnedForItem(item), shortage: Math.max(0, item.required - getOwnedForItem(item)) }))
    .filter((item) => item.shortage > 0);
}

function getTotalShortage(totals) {
  return getRequiredItemsFromTotals(totals).reduce((sum, item) => {
    return sum + Math.max(0, item.required - getOwnedForItem(item));
  }, 0);
}

function renderInventory() {
  inventoryGrid.innerHTML = "";

  trialTypes.forEach((type) => {
    typedMaterialKeys.forEach((key) => {
      inventoryGrid.append(createInventoryRow(`${type}の${materialNames[key]}`, materialIcon(key, type), state.inventory[type][key], (value) => {
        state.inventory[type][key] = value;
      }));
    });
  });

  commonMaterialKeys.forEach((key) => {
    inventoryGrid.append(createInventoryRow(materialNames[key], materialIcon(key), state.inventory.common[key], (value) => {
      state.inventory.common[key] = value;
    }));
  });

  coinOwned.value = state.coinOwned;
}

function createInventoryRow(label, icon, value, onInput) {
  const row = document.createElement("div");
  row.className = "counter-row";
  row.innerHTML = `
    <label>${icon}<span>${label}</span></label>
    <input type="number" min="0" inputmode="numeric" value="${value}">
  `;
  row.querySelector("input").addEventListener("input", (event) => {
    onInput(numberOrZero(event.target.value));
    saveAndRenderSummaryOnly();
  });
  return row;
}

function renderSummary() {
  const totals = getTotals();
  summaryGrid.innerHTML = "";
  getRequiredItemsFromTotals(totals).forEach((item) => {
    const owned = getOwnedForItem(item);
    summaryGrid.append(createSummaryItem(item, owned));
  });
  heroShortage.textContent = getTotalShortage(totals).toLocaleString();
}

function createSummaryItem(item, owned) {
  const shortage = Math.max(0, item.required - owned);
  const div = document.createElement("div");
  div.className = "summary-item";
  div.innerHTML = `
    <span class="summary-name">${itemIcon(item)}<span>${item.name}</span></span>
    <span class="summary-values">
      <span class="badge">必要 ${item.required.toLocaleString()}</span>
      <span class="badge">所持 ${owned.toLocaleString()}</span>
      <span class="badge ${shortage ? "short" : "ok"}">不足 ${shortage.toLocaleString()}</span>
    </span>
  `;
  return div;
}

function renderPlayers() {
  playerList.innerHTML = "";
  const visiblePlayers = getVisiblePlayers();

  if (!visiblePlayers.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "この優先順位の選手はまだいません";
    playerList.append(empty);
    return;
  }

  visiblePlayers.forEach(({ player, playerIndex }) => {
    const playerTotals = getPlayerCost(player);
    const playerShortages = getShortageItemsFromTotals(playerTotals);
    const totalShortage = getTotalShortage(playerTotals);
    const isOpen = Boolean(player.isOpen);
    const card = document.createElement("article");
    card.className = `player-card ${isOpen ? "is-open" : "is-collapsed"}`;
    card.innerHTML = `
      <div class="player-head">
        <button class="collapse-button" type="button" aria-expanded="${isOpen}" aria-label="${isOpen ? "閉じる" : "開く"}">
          <span class="collapse-icon">${isOpen ? "−" : "+"}</span>
        </button>
        <label class="field player-name">
          <span>選手名</span>
          <input data-player-field="name" value="${escapeHtml(player.name)}" aria-label="選手名">
        </label>
        <label class="field priority-field">
          <span>優先順位</span>
          <select data-player-field="priority">
            ${priorityOptions(player.priority)}
          </select>
        </label>
        <div class="player-total">
          <span>この選手の不足合計</span>
          <strong>${totalShortage.toLocaleString()}</strong>
        </div>
        <div class="player-actions">
          <button class="sort-button" type="button" data-move="up" ${playerIndex === 0 ? "disabled" : ""}>↑</button>
          <button class="sort-button" type="button" data-move="down" ${playerIndex === state.players.length - 1 ? "disabled" : ""}>↓</button>
          <button class="remove-button" type="button" ${state.players.length === 1 ? "disabled" : ""}>削除</button>
        </div>
      </div>
      <div class="player-body" ${isOpen ? "" : "hidden"}>
        <div class="ability-table">
          ${player.abilities.map((ability, abilityIndex) => abilityRow(ability, abilityIndex)).join("")}
        </div>
        <div class="shortage-detail">
          <span class="shortage-title">この選手の合計不足</span>
          <div class="shortage-list">
            ${playerShortages.length ? playerShortages.map(shortageChip).join("") : '<span class="shortage-chip ok">全部足りています</span>'}
          </div>
        </div>
      </div>
    `;

    card.querySelector(".collapse-button").addEventListener("click", () => {
      state.players[playerIndex].isOpen = !state.players[playerIndex].isOpen;
      saveAndRender();
    });

    card.querySelector("[data-player-field='name']").addEventListener("input", (event) => {
      state.players[playerIndex].name = event.target.value;
      saveState();
    });

    card.querySelector("[data-player-field='priority']").addEventListener("input", (event) => {
      state.players[playerIndex].priority = event.target.value;
      saveAndRender();
    });

    card.querySelectorAll("[data-ability-field]").forEach((input) => {
      input.addEventListener("input", (event) => {
        const abilityIndex = Number(event.target.dataset.abilityIndex);
        const field = event.target.dataset.abilityField;
        const ability = state.players[playerIndex].abilities[abilityIndex];

        if (field === "name") {
          ability.name = event.target.value;
          saveState();
          return;
        }

        ability[field] = ["current", "target"].includes(field)
          ? clampLevel(event.target.value, field === "target" ? 5 : 0, field === "target" ? 1 : 0)
          : event.target.value;

        if (ability.target < ability.current) {
          ability.target = ability.current;
        }
        saveAndRender();
      });
    });

    card.querySelector(".remove-button").addEventListener("click", () => {
      state.players = state.players.filter((item) => item.id !== player.id);
      saveAndRender();
    });

    card.querySelectorAll("[data-move]").forEach((button) => {
      button.addEventListener("click", () => {
        movePlayer(playerIndex, button.dataset.move);
      });
    });

    playerList.append(card);
  });
}

function getVisiblePlayers() {
  const selectedPriority = priorityFilter.value;
  return state.players
    .map((player, playerIndex) => ({ player, playerIndex }))
    .filter(({ player }) => selectedPriority === "all" || player.priority === selectedPriority);
}

function movePlayer(playerIndex, direction) {
  const nextIndex = direction === "up" ? playerIndex - 1 : playerIndex + 1;
  if (nextIndex < 0 || nextIndex >= state.players.length) return;
  const [player] = state.players.splice(playerIndex, 1);
  state.players.splice(nextIndex, 0, player);
  saveAndRender();
}

function abilityRow(ability, abilityIndex) {
  const cost = getAbilityCost(ability);
  const shortages = getAbilityShortages(cost, ability.type);
  return `
    <div class="ability-row">
      <label class="field ability-name">
        <span>特殊能力 ${abilityIndex + 1}</span>
        <input data-ability-index="${abilityIndex}" data-ability-field="name" value="${escapeHtml(ability.name)}" aria-label="特殊能力${abilityIndex + 1}の名前">
      </label>
      <label class="field">
        <span>現在Lv</span>
        <select data-ability-index="${abilityIndex}" data-ability-field="current">${levelOptions(ability.current)}</select>
      </label>
      <label class="field">
        <span>目標Lv</span>
        <select data-ability-index="${abilityIndex}" data-ability-field="target">${levelOptions(ability.target, 1)}</select>
      </label>
      <label class="field">
        <span>試練タイプ</span>
        <select data-ability-index="${abilityIndex}" data-ability-field="type">${trialTypes.map((type) => `<option ${type === ability.type ? "selected" : ""}>${type}</option>`).join("")}</select>
      </label>
      <div class="row-result">
        <span>必要 ${cost.coin.toLocaleString()}コイン</span>
        <div class="shortage-list compact">
          ${shortages.length ? shortages.map(shortageChip).join("") : '<span class="shortage-chip ok">不足なし</span>'}
        </div>
      </div>
    </div>
  `;
}

function getAbilityShortages(cost, type) {
  const items = [];
  typedMaterialKeys.forEach((key) => {
    const required = cost[key];
    const owned = state.inventory[type][key];
    const shortage = Math.max(0, required - owned);
    if (shortage) items.push({ kind: "material", type, key, name: `${type}の${materialNames[key]}`, shortage });
  });
  commonMaterialKeys.forEach((key) => {
    const required = cost[key];
    const owned = state.inventory.common[key];
    const shortage = Math.max(0, required - owned);
    if (shortage) items.push({ kind: "material", key, name: materialNames[key], shortage });
  });
  return items;
}

function shortageChip(item) {
  const unit = item.kind === "coin" ? "枚" : "個";
  return `<span class="shortage-chip">${itemIcon(item)}<span>${item.name} ${item.shortage.toLocaleString()}${unit}</span></span>`;
}

function itemIcon(item) {
  if (item.kind === "coin") return '<span class="coin-mark">C</span>';
  return materialIcon(item.key, item.type || "");
}

function levelOptions(selected, min = 0) {
  return [0, 1, 2, 3, 4, 5]
    .filter((level) => level >= min)
    .map((level) => `<option value="${level}" ${Number(selected) === level ? "selected" : ""}>Lv${level}</option>`)
    .join("");
}

function priorityOptions(selected) {
  return Object.entries(priorities)
    .map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function saveAndRenderSummaryOnly() {
  saveState();
  renderSummary();
  renderPlayers();
}

function saveAndRender() {
  saveState();
  renderSummary();
  renderPlayers();
}

function renderEverything() {
  renderInventory();
  renderSummary();
  renderPlayers();
}

function activateTab(button) {
  const panelId = button.getAttribute("aria-controls");
  tabButtons.forEach((tabButton) => {
    const isActive = tabButton === button;
    tabButton.classList.toggle("is-active", isActive);
    tabButton.setAttribute("aria-selected", String(isActive));
  });
  tabPanels.forEach((panel) => {
    const isActive = panel.id === panelId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => activateTab(button));
});

addPlayerButton.addEventListener("click", () => {
  state.players.unshift(createPlayer(`選手 ${state.players.length + 1}`));
  saveAndRender();
});

priorityFilter.addEventListener("input", () => {
  renderPlayers();
});

coinOwned.addEventListener("input", (event) => {
  state.coinOwned = numberOrZero(event.target.value);
  saveAndRenderSummaryOnly();
});

resetButton.addEventListener("click", () => {
  state = {
    inventory: buildEmptyInventory(),
    coinOwned: 0,
    players: [createPlayer("選手 1")],
  };
  priorityFilter.value = "all";
  saveState();
  renderEverything();
});

renderEverything();
