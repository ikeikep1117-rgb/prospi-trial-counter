const STORAGE_KEY = "prospi-trial-counter-v2";
const OLD_STORAGE_KEY = "prospi-trial-counter-v1";

const materialNames = {
  proof: "証",
  guide: "指南",
  secret: "極意書",
  flash: "閃きの印",
  awaken: "開眼の印",
  truth: "真価の印",
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

const fallbackMaterialImages = {
  proof: "assets/materials/proof.svg",
  guide: "assets/materials/guide.svg",
  secret: "assets/materials/secret.svg",
  flash: "assets/materials/flash.svg",
  awaken: "assets/materials/awaken.svg",
  truth: "assets/materials/truth.svg",
};

let customMaterialImages = {};

const trialColors = {
  "剛力": "#c5483d",
  "俊敏": "#2f6fc9",
  "技巧": "#2b8f50",
  "心": "#c4478d",
};

const trialTypes = ["剛力", "俊敏", "技巧", "心"];
const materialKeys = Object.keys(materialNames);
const typedMaterialKeys = ["proof", "guide", "secret"];
const commonMaterialKeys = ["flash", "awaken", "truth"];

const levelCosts = {
  1: { coin: 3000, proof: 8, flash: 2 },
  2: { coin: 5000, proof: 8, guide: 8, flash: 2 },
  3: { coin: 7000, proof: 12, guide: 12, flash: 3, awaken: 3 },
  4: { coin: 10000, guide: 16, secret: 16, awaken: 4, truth: 4 },
  5: { coin: 15000, guide: 20, secret: 20, awaken: 5, truth: 5 },
};

const defaultState = {
  inventory: buildEmptyInventory(),
  coinOwned: 0,
  players: [createPlayer("選手 1")],
};

let state = loadState();

const inventoryGrid = document.querySelector("#inventoryGrid");
const coinOwned = document.querySelector("#coinOwned");
const playerList = document.querySelector("#playerList");
const summaryGrid = document.querySelector("#summaryGrid");
const iconSettings = document.querySelector("#iconSettings");
const addPlayerButton = document.querySelector("#addPlayerButton");
const resetButton = document.querySelector("#resetButton");
const resetImagesButton = document.querySelector("#resetImagesButton");
const heroShortage = document.querySelector("#heroShortage");

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
    abilities: [createAbility("特殊能力 1"), createAbility("特殊能力 2"), createAbility("特殊能力 3")],
  };
}

function buildEmptyInventory() {
  const inventory = trialTypes.reduce((all, type) => {
    all[type] = typedMaterialKeys.reduce((items, key) => {
      items[key] = 0;
      return items;
    }, {});
    return all;
  }, {});
  inventory.common = commonMaterialKeys.reduce((items, key) => {
    items[key] = 0;
    return items;
  }, {});
  return inventory;
}

function isCommonMaterial(key) {
  return commonMaterialKeys.includes(key);
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeState(JSON.parse(saved));
    } catch {
      return structuredClone(defaultState);
    }
  }

  const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldSaved) {
    try {
      const oldState = JSON.parse(oldSaved);
      return normalizeState({
        inventory: oldState.inventory,
        coinOwned: oldState.coinOwned,
        players: [
          {
            id: crypto.randomUUID(),
            name: "選手 1",
            abilities: oldState.abilities?.slice(0, 3) || [],
          },
        ],
      });
    } catch {
      return structuredClone(defaultState);
    }
  }

  return structuredClone(defaultState);
}

function normalizeState(source = {}) {
  const players = Array.isArray(source.players) && source.players.length ? source.players : defaultState.players;
  return {
    inventory: mergeInventory(source.inventory),
    coinOwned: numberOrZero(source.coinOwned),
    players: players.map((player, playerIndex) => normalizePlayer(player, playerIndex)),
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

function openImageDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("prospi-trial-images", 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore("materials");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadCustomMaterialImages() {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("materials", "readonly");
    const store = transaction.objectStore("materials");
    const loaded = {};

    const request = store.getAllKeys();
    request.onsuccess = () => {
      request.result.forEach((key) => {
        const getRequest = store.get(key);
        getRequest.onsuccess = () => {
          if (getRequest.result) loaded[key] = getRequest.result;
        };
      });
    };

    transaction.oncomplete = () => {
      db.close();
      resolve(loaded);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function materialImageKey(type, key) {
  return isCommonMaterial(key) ? `common:${key}` : `${type}:${key}`;
}

function getCustomMaterialImage(type, key) {
  if (isCommonMaterial(key)) {
    return customMaterialImages[materialImageKey(type, key)] || customMaterialImages[key] || trialTypes.map((trialType) => customMaterialImages[`${trialType}:${key}`]).find(Boolean);
  }
  return customMaterialImages[materialImageKey(type, key)] || customMaterialImages[key];
}

async function saveCustomMaterialImage(key, dataUrl) {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("materials", "readwrite");
    transaction.objectStore("materials").put(dataUrl, key);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function clearCustomMaterialImages() {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("materials", "readwrite");
    transaction.objectStore("materials").clear();
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

function getTotals() {
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

  state.players.forEach((player) => {
    player.abilities.forEach((ability) => {
      const cost = getAbilityCost(ability);
      totals.coin += cost.coin;
      typedMaterialKeys.forEach((key) => {
        totals[ability.type][key] += cost[key];
      });
      commonMaterialKeys.forEach((key) => {
        totals.common[key] += cost[key];
      });
    });
  });

  return totals;
}

function renderInventory() {
  inventoryGrid.innerHTML = "";

  trialTypes.forEach((type) => {
    typedMaterialKeys.forEach((key) => {
      const row = document.createElement("div");
      row.className = "counter-row";
      row.innerHTML = `
        <label for="inv-${type}-${key}">
          ${materialIcon(key, type)}
          <span>${type}の${materialNames[key]}</span>
        </label>
        <input id="inv-${type}-${key}" type="number" min="0" inputmode="numeric" value="${state.inventory[type][key]}">
      `;
      row.querySelector("input").addEventListener("input", (event) => {
        state.inventory[type][key] = numberOrZero(event.target.value);
        saveAndRender();
      });
      inventoryGrid.append(row);
    });
  });

  commonMaterialKeys.forEach((key) => {
    const row = document.createElement("div");
    row.className = "counter-row";
    row.innerHTML = `
      <label for="inv-common-${key}">
        ${materialIcon(key)}
        <span>${materialNames[key]}</span>
      </label>
      <input id="inv-common-${key}" type="number" min="0" inputmode="numeric" value="${state.inventory.common[key]}">
    `;
    row.querySelector("input").addEventListener("input", (event) => {
      state.inventory.common[key] = numberOrZero(event.target.value);
      saveAndRender();
    });
    inventoryGrid.append(row);
  });

  coinOwned.value = state.coinOwned;
}

function renderIconSettings() {
  iconSettings.innerHTML = "";

  trialTypes.forEach((type) => {
    const group = document.createElement("section");
    group.className = "icon-setting-group";
    group.innerHTML = `<h4>${type}</h4><div class="icon-setting-group-grid"></div>`;
    const groupGrid = group.querySelector(".icon-setting-group-grid");

    typedMaterialKeys.forEach((key) => {
      const imageKey = materialImageKey(type, key);
      const hasExactImage = Boolean(customMaterialImages[imageKey]);
      const hasInheritedImage = !hasExactImage && Boolean(customMaterialImages[key]);
      const row = document.createElement("div");
      row.className = "icon-setting-row";
      row.innerHTML = `
        <div class="icon-setting-preview">
          ${materialIcon(key, type)}
          <div>
            <strong>${type}の${materialNames[key]}</strong>
            <span>${hasExactImage ? "個別写真を使用中" : hasInheritedImage ? "旧写真を使用中" : "標準アイコン"}</span>
          </div>
        </div>
        <label class="image-pick-button">
          写真を選ぶ
          <input type="file" accept="image/*" data-material-image="${imageKey}">
        </label>
      `;

      row.querySelector("input").addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const dataUrl = await fileToDataUrl(file);
        customMaterialImages[imageKey] = dataUrl;
        await saveCustomMaterialImage(imageKey, dataUrl);
        renderEverything();
      });

      groupGrid.append(row);
    });

    iconSettings.append(group);
  });

  const commonGroup = document.createElement("section");
  commonGroup.className = "icon-setting-group";
  commonGroup.innerHTML = `<h4>共通の印</h4><div class="icon-setting-group-grid"></div>`;
  const commonGroupGrid = commonGroup.querySelector(".icon-setting-group-grid");

  commonMaterialKeys.forEach((key) => {
    const imageKey = materialImageKey("", key);
    const hasExactImage = Boolean(customMaterialImages[imageKey]);
    const hasInheritedImage = !hasExactImage && Boolean(customMaterialImages[key]);
    const row = document.createElement("div");
    row.className = "icon-setting-row";
    row.innerHTML = `
      <div class="icon-setting-preview">
        ${materialIcon(key)}
        <div>
          <strong>${materialNames[key]}</strong>
          <span>${hasExactImage ? "個別写真を使用中" : hasInheritedImage ? "旧写真を使用中" : "標準アイコン"}</span>
        </div>
      </div>
      <label class="image-pick-button">
        写真を選ぶ
        <input type="file" accept="image/*" data-material-image="${imageKey}">
      </label>
    `;

    row.querySelector("input").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const dataUrl = await fileToDataUrl(file);
      customMaterialImages[imageKey] = dataUrl;
      await saveCustomMaterialImage(imageKey, dataUrl);
      renderEverything();
    });

    commonGroupGrid.append(row);
  });

  iconSettings.append(commonGroup);
}

function renderPlayers() {
  playerList.innerHTML = "";

  state.players.forEach((player, playerIndex) => {
    const playerCost = getPlayerCost(player);
    const shortage = getPlayerShortage(playerCost);
    const shortageDetails = getPlayerShortageDetails(playerCost);
    const card = document.createElement("article");
    card.className = "player-card";
    card.innerHTML = `
      <div class="player-head">
        <label class="field player-name">
          <span>選手名</span>
          <input data-player-field="name" value="${escapeHtml(player.name)}" aria-label="選手名">
        </label>
        <div class="player-total">
          <span>この選手の不足</span>
          <strong>${shortage.toLocaleString()}</strong>
        </div>
        <button class="remove-button" type="button" ${state.players.length === 1 ? "disabled" : ""}>削除</button>
      </div>
      <div class="ability-table" aria-label="${escapeHtml(player.name)}の特殊能力">
        ${player.abilities.map((ability, abilityIndex) => abilityRow(ability, abilityIndex)).join("")}
      </div>
      <div class="ability-result">
        <span class="pill">必要コイン ${playerCost.coin.toLocaleString()}</span>
        <span class="pill ${Math.max(0, playerCost.coin - state.coinOwned) ? "warn" : ""}">コイン不足 ${Math.max(0, playerCost.coin - state.coinOwned).toLocaleString()}</span>
        <span class="pill ${shortage ? "warn" : ""}">不足合計 ${shortage.toLocaleString()}</span>
      </div>
      <div class="shortage-detail">
        <span class="shortage-title">この選手で足りないもの</span>
        <div class="shortage-list">
          ${shortageDetails.length ? shortageDetails.map(shortageChip).join("") : '<span class="shortage-chip ok">全部足りています</span>'}
        </div>
      </div>
    `;

    card.querySelector("[data-player-field='name']").addEventListener("input", (event) => {
      state.players[playerIndex].name = event.target.value;
      saveState();
    });

    card.querySelectorAll("[data-ability-field]").forEach((input) => {
      input.addEventListener("input", (event) => {
        const abilityIndex = Number(event.target.dataset.abilityIndex);
        const field = event.target.dataset.abilityField;
        const value = ["current", "target"].includes(field) ? clampLevel(event.target.value, field === "target" ? 5 : 0, field === "target" ? 1 : 0) : event.target.value;
        state.players[playerIndex].abilities[abilityIndex][field] = value;
        const ability = state.players[playerIndex].abilities[abilityIndex];
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

    playerList.append(card);
  });
}

function abilityRow(ability, abilityIndex) {
  const cost = getAbilityCost(ability);
  const shortages = getAbilityShortages(cost, ability.type);
  const shortageText = shortages.length
    ? shortages.map((item) => `${item.name} ${item.count}個`).join(" / ")
    : "不足なし";

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
        <span class="${shortages.length ? "short-text" : "ok-text"}">${shortageText}</span>
      </div>
    </div>
  `;
}

function getAbilityShortages(cost, type) {
  const typedShortages = typedMaterialKeys.map((key) => ({
      key,
      type,
      name: `${type}の${materialNames[key]}`,
      count: Math.max(0, cost[key] - state.inventory[type][key]),
    }));
  const commonShortages = commonMaterialKeys.map((key) => ({
      key,
      name: materialNames[key],
      count: Math.max(0, cost[key] - state.inventory.common[key]),
    }));
  return [...typedShortages, ...commonShortages].filter((item) => item.count > 0);
}

function getPlayerCost(player) {
  const cost = { coin: 0, common: {} };
  commonMaterialKeys.forEach((key) => {
    cost.common[key] = 0;
  });
  trialTypes.forEach((type) => {
    cost[type] = {};
    typedMaterialKeys.forEach((key) => {
      cost[type][key] = 0;
    });
  });

  player.abilities.forEach((ability) => {
    const abilityCost = getAbilityCost(ability);
    cost.coin += abilityCost.coin;
    typedMaterialKeys.forEach((key) => {
      cost[ability.type][key] += abilityCost[key];
    });
    commonMaterialKeys.forEach((key) => {
      cost.common[key] += abilityCost[key];
    });
  });

  return cost;
}

function getPlayerShortage(cost) {
  let shortage = Math.max(0, cost.coin - state.coinOwned);
  trialTypes.forEach((type) => {
    typedMaterialKeys.forEach((key) => {
      shortage += Math.max(0, cost[type][key] - state.inventory[type][key]);
    });
  });
  commonMaterialKeys.forEach((key) => {
    shortage += Math.max(0, cost.common[key] - state.inventory.common[key]);
  });
  return shortage;
}

function getPlayerShortageDetails(cost) {
  const details = [];
  const coinShortage = Math.max(0, cost.coin - state.coinOwned);
  if (coinShortage) {
    details.push({ kind: "coin", name: "コイン", count: coinShortage });
  }

  trialTypes.forEach((type) => {
    typedMaterialKeys.forEach((key) => {
      const count = Math.max(0, cost[type][key] - state.inventory[type][key]);
      if (count) {
        details.push({ kind: "material", type, key, name: `${type}の${materialNames[key]}`, count });
      }
    });
  });
  commonMaterialKeys.forEach((key) => {
    const count = Math.max(0, cost.common[key] - state.inventory.common[key]);
    if (count) {
      details.push({ kind: "material", key, name: materialNames[key], count });
    }
  });

  return details;
}

function shortageChip(item) {
  const icon = item.kind === "coin" ? '<span class="coin-mark">C</span>' : materialIcon(item.key, item.type);
  const unit = item.kind === "coin" ? "枚" : "個";
  return `<span class="shortage-chip">${icon}<span>${item.name} ${item.count.toLocaleString()}${unit}</span></span>`;
}

function renderSummary() {
  const totals = getTotals();
  summaryGrid.innerHTML = "";

  let totalShortage = Math.max(0, totals.coin - state.coinOwned);
  summaryGrid.append(createSummaryItem("コイン", totals.coin, state.coinOwned));

  trialTypes.forEach((type) => {
    typedMaterialKeys.forEach((key) => {
      const required = totals[type][key];
      if (!required) return;
      const owned = state.inventory[type][key];
      totalShortage += Math.max(0, required - owned);
      summaryGrid.append(createSummaryItem(`${type}の${materialNames[key]}`, required, owned));
    });
  });
  commonMaterialKeys.forEach((key) => {
    const required = totals.common[key];
    if (!required) return;
    const owned = state.inventory.common[key];
    totalShortage += Math.max(0, required - owned);
    summaryGrid.append(createSummaryItem(materialNames[key], required, owned));
  });

  if (summaryGrid.children.length === 1 && totals.coin === 0) {
    const empty = document.createElement("div");
    empty.className = "summary-item";
    empty.innerHTML = `<span class="summary-name">まだ必要素材はありません</span><span class="badge ok">Lv設定を選んでください</span>`;
    summaryGrid.innerHTML = "";
    summaryGrid.append(empty);
  }

  heroShortage.textContent = totalShortage.toLocaleString();
}

function createSummaryItem(name, required, owned) {
  const shortage = Math.max(0, required - owned);
  const item = document.createElement("div");
  item.className = "summary-item";
  item.innerHTML = `
    <span class="summary-name">${summaryNameWithIcon(name)}</span>
    <span class="summary-values">
      <span class="badge">必要 ${required.toLocaleString()}</span>
      <span class="badge">所持 ${owned.toLocaleString()}</span>
      <span class="badge ${shortage ? "short" : "ok"}">不足 ${shortage.toLocaleString()}</span>
    </span>
  `;
  return item;
}

function summaryNameWithIcon(name) {
  if (name === "コイン") {
    return `<span class="coin-mark">C</span><span>${name}</span>`;
  }

  const type = trialTypes.find((trialType) => name.startsWith(`${trialType}の`));
  const materialKey = materialKeys.find((key) => name.endsWith(materialNames[key]));
  if (materialKey && isCommonMaterial(materialKey) && !type) {
    return `${materialIcon(materialKey)}<span>${escapeHtml(name)}</span>`;
  }
  if (!type || !materialKey) return `<span>${escapeHtml(name)}</span>`;

  return `${materialIcon(materialKey, type)}<span>${escapeHtml(name)}</span>`;
}

function materialIcon(key, type) {
  const src = getCustomMaterialImage(type, key) || materialImages[materialImageKey(type, key)] || fallbackMaterialImages[key];
  return `
    <span class="material-icon" style="--trial-color: ${trialColors[type] || "#0f7a4a"}">
      <img src="${src}" alt="" loading="lazy">
    </span>
  `;
}

function levelOptions(selected, min = 0) {
  return [0, 1, 2, 3, 4, 5]
    .filter((level) => level >= min)
    .map((level) => `<option value="${level}" ${Number(selected) === level ? "selected" : ""}>Lv${level}</option>`)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function saveAndRender() {
  saveState();
  renderPlayers();
  renderSummary();
}

function renderEverything() {
  renderInventory();
  renderIconSettings();
  renderPlayers();
  renderSummary();
}

addPlayerButton.addEventListener("click", () => {
  state.players.push(createPlayer(`選手 ${state.players.length + 1}`));
  saveAndRender();
});

coinOwned.addEventListener("input", (event) => {
  state.coinOwned = numberOrZero(event.target.value);
  saveAndRender();
});

resetButton.addEventListener("click", () => {
  state = structuredClone(defaultState);
  saveState();
  renderEverything();
});

resetImagesButton.addEventListener("click", async () => {
  customMaterialImages = {};
  await clearCustomMaterialImages();
  renderEverything();
});

(async function init() {
  try {
    customMaterialImages = await loadCustomMaterialImages();
  } catch {
    customMaterialImages = {};
  }
  renderEverything();
})();
