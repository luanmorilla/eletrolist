// script.js (COMPLETO) — UX PRO: categorias + sub-itens
const $ = (id) => document.getElementById(id);

// ==========================
// CATÁLOGO (BUSCA)
// ==========================
const CATALOG = [
  { key: "tomada", label: "Tomada (ponto/placa)", tag: "ELÉTRICA" },
  { key: "interruptor", label: "Interruptor (ponto/placa)", tag: "ELÉTRICA" },
  { key: "tomada_interruptor", label: "Tomada + Interruptor (mesma placa)", tag: "ELÉTRICA" },
  { key: "fio", label: "Fio / Cabo", tag: "ELÉTRICA" },
  { key: "disjuntor", label: "Disjuntor / DR / DPS", tag: "ELÉTRICA" },
  { key: "conduite", label: "Conduíte / Eletroduto", tag: "ELÉTRICA" },
  { key: "caixa", label: "Caixas (4x2 / 4x4 / octogonal...)", tag: "ELÉTRICA" },

  // LED / Iluminação
  { key: "fita", label: "Fita de LED (127/220 • 3000K/4000K/6500K)", tag: "ILUMINAÇÃO" },
  { key: "perfil_led", label: "Perfil de LED (embutir/sobrepor • branco/preto)", tag: "ILUMINAÇÃO" },
  { key: "par20", label: "Lâmpada PAR20 (quadrada recuada)", tag: "ILUMINAÇÃO" },
  { key: "mr16", label: "Lâmpada MR16", tag: "ILUMINAÇÃO" },
  { key: "arandela", label: "Arandela (preta/branca • embutir/sobrepor • definir modelo)", tag: "ILUMINAÇÃO" },
  { key: "driver_led", label: "Driver / Fonte LED (12V/24V • potência)", tag: "ILUMINAÇÃO" },
  { key: "conector_fita_led", label: "Conector p/ Fita LED (reto / L / emenda)", tag: "ILUMINAÇÃO" },
  { key: "difusor_perfil", label: "Difusor do Perfil (leitoso/transparente)", tag: "ILUMINAÇÃO" },
  { key: "trilho", label: "Trilho eletrificado (preto/branco)", tag: "ILUMINAÇÃO" },
  { key: "spot_trilho", label: "Spot p/ trilho (definir modelo)", tag: "ILUMINAÇÃO" },

  // Automação
  { key: "sensor_presenca", label: "Sensor de presença (teto/parede)", tag: "AUTOMAÇÃO" },
  { key: "fotocelula", label: "Fotocélula (sensor crepuscular)", tag: "AUTOMAÇÃO" },

  // Fixação
  { key: "bucha", label: "Bucha (6 / 8 / 10)", tag: "FIXAÇÃO" },
  { key: "parafuso_phillips", label: "Parafuso Phillips", tag: "FIXAÇÃO" },
  { key: "fita_isolante", label: "Fita isolante (PVC / auto-fusão)", tag: "FIXAÇÃO" },
];

// ==========================
// CATEGORIAS (chips PRO)
// ==========================
const CATEGORY_MAP = {
  eletrica: [
    { key: "tomada", label: "Tomada" },
    { key: "interruptor", label: "Interruptor" },
    { key: "tomada_interruptor", label: "Tomada + Interruptor" },
    { key: "fio", label: "Fio / Cabo" },
    { key: "disjuntor", label: "Disjuntor / DR / DPS" },
    { key: "conduite", label: "Conduíte" },
    { key: "caixa", label: "Caixa elétrica" },
  ],
  iluminacao: [
    { key: "fita", label: "Fita LED" },
    { key: "perfil_led", label: "Perfil LED" },
    { key: "arandela", label: "Arandela" },
    { key: "par20", label: "Lâmpada PAR20" },
    { key: "mr16", label: "Lâmpada MR16" },
    { key: "driver_led", label: "Driver / Fonte" },
    { key: "trilho", label: "Trilho" },
    { key: "spot_trilho", label: "Spot p/ trilho" },
    { key: "conector_fita_led", label: "Conector p/ fita" },
    { key: "difusor_perfil", label: "Difusor do perfil" },
  ],
  fixacao: [
    { key: "bucha", label: "Bucha" },
    { key: "parafuso_phillips", label: "Parafuso" },
    { key: "fita_isolante", label: "Fita isolante" },
  ],
  automacao: [
    { key: "sensor_presenca", label: "Sensor de presença" },
    { key: "fotocelula", label: "Fotocélula" },
  ],
};

// limites reais
const MAX_MOD = { "4x2": 3, "4x4": 6 };

// estado
let selectedKey = null;
let items = [];

// storage
const STORAGE_KEY = "eletrolist_v1";

// ==========================
// ID ÚNICO
// ==========================
function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// ==========================
// TOASTS
// ==========================
function toast(title, desc = "", type = "success") {
  const box = $("toasts");
  if (!box) return;

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="toastIcon">${type === "success" ? "✓" : "!"}</div>
    <div class="toastText">
      <div class="toastTitle">${escapeHtml(title)}</div>
      ${desc ? `<div class="toastDesc">${escapeHtml(desc)}</div>` : ""}
    </div>
  `;
  box.appendChild(el);

  setTimeout(() => {
    el.style.animation = "toastOut 160ms ease forwards";
    setTimeout(() => el.remove(), 200);
  }, 1800);
}

// ==========================
// STORAGE
// ==========================
function saveStorage() {
  try {
    const payload = {
      empresa: ($("empresa")?.value || ""),
      cliente: ($("cliente")?.value || ""),
      data: ($("data")?.value || ""),
      items
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {}
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);
    if (data?.empresa && $("empresa")) $("empresa").value = data.empresa;
    if (data?.cliente && $("cliente")) $("cliente").value = data.cliente;
    if (data?.data && $("data")) $("data").value = data.data;
    if (Array.isArray(data?.items)) items = data.items;
  } catch (e) {}
}

// ==========================
// QTD VISIBILIDADE (FIO)
// ==========================
function setQtyModeForKey(key) {
  const qtyLabel = document.querySelector(".field.qty");
  const qtyInput = $("qtd");
  const searchRow = document.querySelector(".searchRow");
  if (!qtyLabel || !qtyInput) return;

  if (key === "fio") {
    qtyLabel.style.display = "none";
    qtyInput.value = 1;
    qtyInput.disabled = true;
    if (searchRow) searchRow.classList.add("qtyHidden");
    return;
  }

  qtyLabel.style.display = "";
  qtyInput.disabled = false;
  if (searchRow) searchRow.classList.remove("qtyHidden");

  const v = Number(qtyInput.value || 0);
  if (!v || v <= 0) qtyInput.value = 1;
}

// ==========================
// CHIPS PRO: SUB-ITENS
// ==========================
function renderSubChips(category) {
  const box = $("chipItems");
  if (!box) return;

  box.innerHTML = "";
  const list = CATEGORY_MAP[category];
  if (!list) {
    box.style.display = "none";
    return;
  }

  list.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = item.label;
    btn.addEventListener("click", () => selectItem(item.key));
    box.appendChild(btn);
  });

  box.style.display = "flex";
}

// ==========================
// INIT
// ==========================
function init() {
  const hoje = new Date().toISOString().slice(0, 10);
  if ($("data") && !$("data").value) $("data").value = hoje;

  loadStorage();

  $("search").addEventListener("input", onSearchInput);
  $("search").addEventListener("focus", onSearchInput);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".searchBox")) hideSuggestions();
  });

  $("btnAdd").addEventListener("click", addToList);
  $("btnClearForm").addEventListener("click", clearSelection);

  $("btnClearAll").addEventListener("click", () => {
    if (!confirm("Tem certeza que deseja limpar tudo?")) return;
    items = [];
    renderCards();
    updateSummaryAndControls();
    saveStorage();
    clearSelection();
    toast("Lista limpa", "Tudo foi removido.");
  });

  $("btnPDF").addEventListener("click", generatePDF);

  // categorias
  document.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => renderSubChips(btn.dataset.cat));
  });

  // organizar lista
  const btnOrg = $("btnOrganizar");
  if (btnOrg) btnOrg.addEventListener("click", () => {
    organizeAndMergeItems();
    renderCards();
    updateSummaryAndControls();
    saveStorage();
    toast("Lista organizada", "Itens iguais foram somados.");
  });

  // salvar ao editar dados
  ["empresa", "cliente", "data"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("input", saveStorage);
    if (el) el.addEventListener("change", saveStorage);
  });

  renderForm(null);
  setQtyModeForKey(null);
  renderCards();
  updateSummaryAndControls();
}

// ==========================
// BUSCA
// ==========================
function onSearchInput() {
  const q = $("search").value.trim().toLowerCase();
  const sug = $("suggestions");

  if (!q) {
    hideSuggestions();
    return;
  }

  const filtered = CATALOG
    .filter(x =>
      x.label.toLowerCase().includes(q) ||
      x.tag.toLowerCase().includes(q) ||
      x.key.toLowerCase().includes(q)
    )
    .slice(0, 10);

  if (filtered.length === 0) {
    hideSuggestions();
    return;
  }

  sug.innerHTML = filtered.map(x => `
    <div class="sugItem" data-key="${x.key}">
      <div>${escapeHtml(x.label)}</div>
      <div class="sugTag">${escapeHtml(x.tag)}</div>
    </div>
  `).join("");

  sug.style.display = "block";

  [...sug.querySelectorAll(".sugItem")].forEach(el => {
    el.addEventListener("click", () => selectItem(el.dataset.key));
  });
}

function hideSuggestions() {
  $("suggestions").style.display = "none";
}

function selectItem(key) {
  selectedKey = key;

  const found = CATALOG.find(x => x.key === key);
  $("search").value = found ? found.label : key;

  hideSuggestions();
  setQtyModeForKey(key);
  renderForm(key);
}

// ==========================
// FORM DINÂMICO
// ==========================
function renderForm(key) {
  const area = $("formArea");

  if (!key) {
    area.innerHTML = `
      <div class="emptyState">
        Escolha uma categoria acima ou digite no campo de busca e selecione um item.
      </div>
    `;
    return;
  }

  // --- Tomada ---
  if (key === "tomada") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Placa</span>
          <select id="placa">
            <option value="4x2">4x2</option>
            <option value="4x4">4x4</option>
          </select>
        </label>

        <label class="field">
          <span>Tomadas no ponto</span>
          <select id="qtdTomadas"></select>
        </label>

        <label class="field">
          <span>Amperagem</span>
          <select id="amp">
            <option>10A</option>
            <option>20A</option>
          </select>
        </label>

        <label class="field">
          <span>Tensão</span>
          <select id="tensao">
            <option value="110">110V (branca)</option>
            <option value="220">220V (vermelha)</option>
            <option value="misto">Misto (110 e 220)</option>
          </select>
        </label>

        <label class="field">
          <span>Local (opcional)</span>
          <input id="local" placeholder="Ex: Sala / Cozinha" />
        </label>

        <label class="field">
          <span>Marca/Linha (opcional)</span>
          <input id="marca" placeholder="Ex: Schneider / Tramontina" />
        </label>

        <label class="field">
          <span>Cor da placa (opcional)</span>
          <select id="corPlaca">
            <option value="">(não informar)</option>
            <option>Branca</option>
            <option>Preta</option>
            <option>Cinza</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: com USB / linha X" />
        </label>
      </div>

      <div id="mistoBox" style="display:none;margin-top:12px;">
        <div class="formGrid">
          <label class="field">
            <span>Qtd 110V (branca)</span>
            <input id="q110" type="number" min="0" value="0" />
          </label>

          <label class="field">
            <span>Qtd 220V (vermelha)</span>
            <input id="q220" type="number" min="0" value="0" />
          </label>

          <label class="field">
            <span>Total do ponto</span>
            <input id="totalPoint" disabled />
          </label>

          <label class="field">
            <span>Dica</span>
            <input value="110 + 220 precisa bater com o total." disabled />
          </label>
        </div>
      </div>
    `;

    $("placa").addEventListener("change", syncTomadasOptions);
    $("qtdTomadas").addEventListener("change", syncMistoTotal);
    $("tensao").addEventListener("change", toggleMistoTomada);

    syncTomadasOptions();
    toggleMistoTomada();
    return;
  }

  // --- Interruptor ---
  if (key === "interruptor") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Placa</span>
          <select id="placa">
            <option value="4x2">4x2</option>
            <option value="4x4">4x4</option>
          </select>
        </label>

        <label class="field">
          <span>Teclas</span>
          <select id="teclas"></select>
        </label>

        <label class="field">
          <span>Tipo</span>
          <select id="tipoInt">
            <option>Simples</option>
            <option>Paralelo (three-way)</option>
            <option>Intermediário (four-way)</option>
          </select>
        </label>

        <label class="field">
          <span>Local (opcional)</span>
          <input id="local" placeholder="Ex: Quarto / Corredor" />
        </label>

        <label class="field">
          <span>Marca/Linha (opcional)</span>
          <input id="marca" placeholder="Ex: Schneider / Tramontina" />
        </label>

        <label class="field">
          <span>Cor da placa (opcional)</span>
          <select id="corPlaca">
            <option value="">(não informar)</option>
            <option>Branca</option>
            <option>Preta</option>
            <option>Cinza</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: com LED / retorno" />
        </label>

        <label class="field">
          <span>—</span>
          <input value="(ok)" disabled />
        </label>
      </div>
    `;

    $("placa").addEventListener("change", syncTeclasOptions);
    syncTeclasOptions();
    return;
  }

  // --- Misto ---
  if (key === "tomada_interruptor") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Placa</span>
          <select id="placa">
            <option value="4x2">4x2</option>
            <option value="4x4">4x4</option>
          </select>
        </label>

        <label class="field">
          <span>Tomadas</span>
          <select id="qtdTomadas"></select>
        </label>

        <label class="field">
          <span>Teclas</span>
          <select id="teclas"></select>
        </label>

        <label class="field">
          <span>Tipo interruptor</span>
          <select id="tipoInt">
            <option>Simples</option>
            <option>Paralelo (three-way)</option>
            <option>Intermediário (four-way)</option>
          </select>
        </label>

        <label class="field">
          <span>Amperagem (tomadas)</span>
          <select id="amp">
            <option>10A</option>
            <option>20A</option>
          </select>
        </label>

        <label class="field">
          <span>Tensão (tomadas)</span>
          <select id="tensao">
            <option value="110">110V (branca)</option>
            <option value="220">220V (vermelha)</option>
            <option value="misto">Misto (110 e 220)</option>
          </select>
        </label>

        <label class="field">
          <span>Local (opcional)</span>
          <input id="local" placeholder="Ex: Sala / Cozinha" />
        </label>

        <label class="field">
          <span>Marca/Linha (opcional)</span>
          <input id="marca" placeholder="Ex: Schneider / Tramontina" />
        </label>

        <label class="field">
          <span>Cor da placa (opcional)</span>
          <select id="corPlaca">
            <option value="">(não informar)</option>
            <option>Branca</option>
            <option>Preta</option>
            <option>Cinza</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: com USB / retorno" />
        </label>

        <label class="field">
          <span>Total de módulos</span>
          <input id="totalMods" disabled />
        </label>

        <label class="field">
          <span>Limite da placa</span>
          <input id="limiteMods" disabled />
        </label>
      </div>

      <div id="mistoBox" style="display:none;margin-top:12px;">
        <div class="formGrid">
          <label class="field">
            <span>Qtd 110V (branca)</span>
            <input id="q110" type="number" min="0" value="0" />
          </label>

          <label class="field">
            <span>Qtd 220V (vermelha)</span>
            <input id="q220" type="number" min="0" value="0" />
          </label>

          <label class="field">
            <span>Total de tomadas</span>
            <input id="totalPoint" disabled />
          </label>

          <label class="field">
            <span>Dica</span>
            <input value="110 + 220 precisa bater com o total." disabled />
          </label>
        </div>
      </div>
    `;

    $("placa").addEventListener("change", () => {
      syncTomadasOptions();
      syncTeclasOptions();
      syncComboLimit();
    });
    $("qtdTomadas").addEventListener("change", () => {
      syncMistoTotal();
      syncComboLimit();
    });
    $("teclas").addEventListener("change", syncComboLimit);
    $("tensao").addEventListener("change", toggleMistoTomada);

    syncTomadasOptions();
    syncTeclasOptions();
    syncComboLimit();
    toggleMistoTomada();
    return;
  }

  // --- Fio ---
  if (key === "fio") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="fioTipo">
            <option>Fio/Cabo (750V)</option>
            <option>Cabo PP</option>
            <option>Cabo paralelo</option>
            <option>Cabo de comando/sinal</option>
          </select>
        </label>

        <label class="field">
          <span>Bitola</span>
          <select id="bitola">
            <option>1,5 mm²</option>
            <option>2,5 mm²</option>
            <option>4 mm²</option>
            <option>6 mm²</option>
            <option>10 mm²</option>
            <option>16 mm²</option>
          </select>
        </label>

        <label class="field">
          <span>Metros</span>
          <input id="metros" type="number" min="1" placeholder="Ex: 25" />
        </label>

        <label class="field">
          <span>Cor (opcional)</span>
          <select id="fioCor">
            <option value="">(não informar)</option>
            <option>Preto</option>
            <option>Azul</option>
            <option>Vermelho</option>
            <option>Verde/Amarelo (terra)</option>
            <option>Branco</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: fase / neutro / retorno" />
        </label>
      </div>
    `;
    return;
  }

  // --- Disjuntor ---
  if (key === "disjuntor") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="djTipo">
            <option>Disjuntor</option>
            <option>DR (IDR)</option>
            <option>DPS</option>
          </select>
        </label>

        <label class="field">
          <span>Corrente</span>
          <select id="corrente">
            <option>10A</option><option>16A</option><option>20A</option><option>25A</option>
            <option>32A</option><option>40A</option><option>50A</option><option>63A</option>
          </select>
        </label>

        <label class="field">
          <span>Pólos</span>
          <select id="polos">
            <option>1P (unipolar)</option>
            <option>2P (bipolar)</option>
            <option>3P (tripolar)</option>
          </select>
        </label>

        <label class="field">
          <span>Curva (opcional)</span>
          <select id="curva">
            <option value="">(não informar)</option>
            <option>Curva B</option>
            <option>Curva C</option>
            <option>Curva D</option>
          </select>
        </label>
      </div>
    `;
    return;
  }

  // --- Conduíte ---
  if (key === "conduite") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="condTipo">
            <option>Corrugado</option>
            <option>PVC rígido</option>
            <option>Flexível</option>
            <option>Metálico</option>
          </select>
        </label>

        <label class="field">
          <span>Diâmetro</span>
          <select id="diam">
            <option>20mm</option>
            <option>25mm</option>
            <option>32mm</option>
          </select>
        </label>

        <label class="field">
          <span>Item</span>
          <select id="item">
            <option>Eletroduto/Conduíte</option>
            <option>Curva/Joelho</option>
            <option>Luva</option>
            <option>Bucha/Arruela</option>
            <option>Abraçadeira/Suporte</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: embutido / aparente" />
        </label>
      </div>
    `;
    return;
  }

  // --- Caixas ---
  if (key === "caixa") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo de caixa</span>
          <select id="cxTipo">
            <option>4x2</option>
            <option>4x4</option>
            <option>Octogonal</option>
            <option>Passagem</option>
            <option>Teto</option>
            <option>Sobrepor</option>
          </select>
        </label>

        <label class="field">
          <span>Profundidade (opcional)</span>
          <select id="prof">
            <option value="">(não informar)</option>
            <option>Rasa</option>
            <option>Funda</option>
          </select>
        </label>

        <label class="field">
          <span>Com tampa?</span>
          <select id="tampa">
            <option>Sim</option>
            <option>Não</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: alvenaria / drywall" />
        </label>
      </div>
    `;
    return;
  }

  // --- Fita LED ---
  if (key === "fita") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tensão</span>
          <select id="ledTensao">
            <option>127V</option>
            <option>220V</option>
          </select>
        </label>

        <label class="field">
          <span>Temperatura</span>
          <select id="ledTemp">
            <option value="3000K">Branco Quente — 3000K</option>
            <option value="4000K">Branco Neutro — 4000K</option>
            <option value="6500K">Branco Frio — 6500K</option>
          </select>
        </label>

        <label class="field">
          <span>Comprimento</span>
          <select id="ledComp">
            <option value="10">Rolo 10m</option>
            <option value="def">Definir metragem</option>
          </select>
        </label>

        <label class="field" id="ledMetrosBox" style="display:none;">
          <span>Metros</span>
          <input id="ledMetros" type="number" min="1" placeholder="Ex: 15" />
        </label>

        <label class="field">
          <span>Com driver/fonte?</span>
          <select id="ledFonte">
            <option value="não">Não</option>
            <option value="sim">Sim</option>
          </select>
        </label>

        <label class="field">
          <span>Uso (opcional)</span>
          <select id="ledUso">
            <option value="">(não informar)</option>
            <option>Interno</option>
            <option>Externo</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: IP65 / alto brilho" />
        </label>
      </div>
    `;

    const toggle = () => {
      const v = $("ledComp")?.value;
      const box = $("ledMetrosBox");
      if (!box) return;
      box.style.display = (v === "def") ? "block" : "none";
    };
    $("ledComp").addEventListener("change", toggle);
    toggle();
    return;
  }

  // --- Perfil LED ---
  if (key === "perfil_led") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="perfilTipo">
            <option>Embutir</option>
            <option>Sobrepor</option>
          </select>
        </label>

        <label class="field">
          <span>Cor do perfil</span>
          <select id="perfilCor">
            <option>Branco</option>
            <option>Preto</option>
          </select>
        </label>

        <label class="field">
          <span>Metragem (metros)</span>
          <input id="perfilMetros" type="number" min="1" placeholder="Ex: 2" />
        </label>

        <label class="field">
          <span>Difusor (opcional)</span>
          <select id="perfilDif">
            <option value="">(não informar)</option>
            <option>Leitoso</option>
            <option>Transparente</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: canto / reto / recorte" />
        </label>
      </div>
    `;
    return;
  }

  // --- PAR20 ---
  if (key === "par20") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Modelo</span>
          <select id="parModelo">
            <option>Quadrada recuada</option>
          </select>
        </label>

        <label class="field">
          <span>Temperatura</span>
          <select id="parTemp">
            <option value="3000K">3000K (quente)</option>
            <option value="4000K">4000K (neutro)</option>
            <option value="6500K">6500K (frio)</option>
          </select>
        </label>

        <label class="field">
          <span>Tensão (opcional)</span>
          <select id="parTensao">
            <option value="">(não informar)</option>
            <option>127V</option>
            <option>220V</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: dimerizável / alto IRC" />
        </label>
      </div>
    `;
    return;
  }

  // --- MR16 ---
  if (key === "mr16") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tensão</span>
          <select id="mrTensao">
            <option>127V</option>
            <option>220V</option>
          </select>
        </label>

        <label class="field">
          <span>Temperatura</span>
          <select id="mrTemp">
            <option value="3000K">3000K (quente)</option>
            <option value="4000K">4000K (neutro)</option>
            <option value="6500K">6500K (frio)</option>
          </select>
        </label>

        <label class="field">
          <span>Precisa driver?</span>
          <select id="mrDriver">
            <option>Não</option>
            <option>Sim</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: direcionável / dimerizável" />
        </label>
      </div>
    `;
    return;
  }

  // --- Arandela ---
  if (key === "arandela") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Cor</span>
          <select id="aranCor">
            <option>Preta</option>
            <option>Branca</option>
          </select>
        </label>

        <label class="field">
          <span>Instalação</span>
          <select id="aranInst">
            <option>Embutir</option>
            <option>Sobrepor</option>
          </select>
        </label>

        <label class="field">
          <span>Modelo</span>
          <input id="aranModelo" placeholder="DEFINIR MODELO (obrigatório)" />
        </label>

        <label class="field">
          <span>Uso (opcional)</span>
          <select id="aranUso">
            <option value="">(não informar)</option>
            <option>Interno</option>
            <option>Externo</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: 2 fachos / IP65" />
        </label>
      </div>
    `;
    return;
  }

  // --- Driver/Fonte ---
  if (key === "driver_led") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="drvTipo">
            <option>Driver</option>
            <option>Fonte</option>
          </select>
        </label>

        <label class="field">
          <span>Saída</span>
          <select id="drvSaida">
            <option>12V</option>
            <option>24V</option>
          </select>
        </label>

        <label class="field">
          <span>Potência (W)</span>
          <input id="drvW" type="number" min="1" placeholder="Ex: 60" />
        </label>

        <label class="field">
          <span>Uso (opcional)</span>
          <select id="drvUso">
            <option value="">(não informar)</option>
            <option>Interno</option>
            <option>Externo</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: bivolt / slim" />
        </label>
      </div>
    `;
    return;
  }

  // --- Conector fita ---
  if (key === "conector_fita_led") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="conTipo">
            <option>Reto</option>
            <option>Emenda</option>
            <option>Em L</option>
          </select>
        </label>

        <label class="field">
          <span>Largura (opcional)</span>
          <select id="conLarg">
            <option value="">(não informar)</option>
            <option>8mm</option>
            <option>10mm</option>
            <option>12mm</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: p/ fita 12V / COB" />
        </label>
      </div>
    `;
    return;
  }

  // --- Difusor ---
  if (key === "difusor_perfil") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="difTipo">
            <option>Leitoso</option>
            <option>Transparente</option>
          </select>
        </label>

        <label class="field">
          <span>Metragem (metros)</span>
          <input id="difMetros" type="number" min="1" placeholder="Ex: 2" />
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: para perfil embutir" />
        </label>
      </div>
    `;
    return;
  }

  // --- Trilho ---
  if (key === "trilho") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Cor</span>
          <select id="trCor">
            <option>Preto</option>
            <option>Branco</option>
          </select>
        </label>

        <label class="field">
          <span>Comprimento (metros)</span>
          <input id="trMetros" type="number" min="1" placeholder="Ex: 2" />
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: com alimentação / emenda" />
        </label>
      </div>
    `;
    return;
  }

  // --- Spot p/ trilho ---
  if (key === "spot_trilho") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Cor (opcional)</span>
          <select id="spCor">
            <option value="">(não informar)</option>
            <option>Preto</option>
            <option>Branco</option>
          </select>
        </label>

        <label class="field">
          <span>Modelo</span>
          <input id="spModelo" placeholder="DEFINIR MODELO (obrigatório)" />
        </label>

        <label class="field">
          <span>Temperatura (opcional)</span>
          <select id="spTemp">
            <option value="">(não informar)</option>
            <option>3000K</option>
            <option>4000K</option>
            <option>6500K</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: 7W / 10W / direcionável" />
        </label>
      </div>
    `;
    return;
  }

  // --- Sensor presença ---
  if (key === "sensor_presenca") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Instalação</span>
          <select id="senInst">
            <option>Teto</option>
            <option>Parede</option>
          </select>
        </label>

        <label class="field">
          <span>Uso (opcional)</span>
          <select id="senUso">
            <option value="">(não informar)</option>
            <option>Interno</option>
            <option>Externo</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: alcance 6m / bivolt" />
        </label>
      </div>
    `;
    return;
  }

  // --- Fotocélula ---
  if (key === "fotocelula") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tensão (opcional)</span>
          <select id="fotoTen">
            <option value="">(não informar)</option>
            <option>127V</option>
            <option>220V</option>
            <option>Bivolt</option>
          </select>
        </label>

        <label class="field">
          <span>Corrente (opcional)</span>
          <select id="fotoA">
            <option value="">(não informar)</option>
            <option>10A</option>
            <option>16A</option>
            <option>20A</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: p/ fachada / p/ refletores" />
        </label>
      </div>
    `;
    return;
  }

  // --- Bucha ---
  if (key === "bucha") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tamanho</span>
          <select id="buTam">
            <option>6</option>
            <option>8</option>
            <option>10</option>
          </select>
        </label>

        <label class="field">
          <span>Tipo (opcional)</span>
          <select id="buTipo">
            <option value="">(não informar)</option>
            <option>Nylon</option>
            <option>Universal</option>
          </select>
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: para luminária/arandela" />
        </label>
      </div>
    `;
    return;
  }

  // --- Parafuso ---
  if (key === "parafuso_phillips") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Bitola (opcional)</span>
          <select id="phBitola">
            <option value="">(não informar)</option>
            <option>3,5mm</option>
            <option>4,0mm</option>
            <option>4,5mm</option>
            <option>5,0mm</option>
          </select>
        </label>

        <label class="field">
          <span>Comprimento (mm) (opcional)</span>
          <select id="phComp">
            <option value="">(não informar)</option>
            <option>20mm</option>
            <option>25mm</option>
            <option>30mm</option>
            <option>35mm</option>
            <option>40mm</option>
          </select>
        </label>

        <label class="field">
          <span>Acabamento (opcional)</span>
          <select id="phAcab">
            <option value="">(não informar)</option>
            <option>Zincado</option>
            <option>Preto</option>
            <option>Inox</option>
          </select>
        </label>

        <label class="field">
          <span>Definir (opcional)</span>
          <input id="phDef" placeholder="Ex: 4.0x30 p/ bucha 8" />
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: cabeça chata" />
        </label>
      </div>
    `;
    return;
  }

  // --- Fita isolante ---
  if (key === "fita_isolante") {
    area.innerHTML = `
      <div class="formGrid">
        <label class="field">
          <span>Tipo</span>
          <select id="fitaTipo">
            <option>Comum (PVC)</option>
            <option>Auto-fusão</option>
          </select>
        </label>

        <label class="field">
          <span>Cor</span>
          <select id="fitaCor">
            <option>Preta</option>
            <option>Branca</option>
            <option>Vermelha</option>
            <option>Azul</option>
            <option>Verde</option>
            <option>Amarela</option>
          </select>
        </label>

        <label class="field">
          <span>Marca (opcional)</span>
          <input id="marca" placeholder="Ex: 3M" />
        </label>

        <label class="field">
          <span>Obs (opcional)</span>
          <input id="obs" placeholder="Ex: alta isolação" />
        </label>
      </div>
    `;
    return;
  }

  area.innerHTML = `<div class="emptyState">Seleção inválida.</div>`;
}

// ==========================
// HELPERS tomadas/teclas
// ==========================
function syncTomadasOptions() {
  const placa = $("placa").value;
  const max = MAX_MOD[placa];
  const sel = $("qtdTomadas");
  sel.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i} tomada(s)`;
    sel.appendChild(opt);
  }
  sel.value = "1";
  syncMistoTotal();
}

function syncTeclasOptions() {
  const placa = $("placa").value;
  const max = MAX_MOD[placa];
  const sel = $("teclas");
  sel.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i} tecla(s)`;
    sel.appendChild(opt);
  }
  sel.value = "1";
  syncComboLimit();
}

function syncMistoTotal() {
  const total = Number($("qtdTomadas")?.value || 0);
  if ($("totalPoint")) $("totalPoint").value = String(total);
}

function toggleMistoTomada() {
  const t = $("tensao")?.value;
  const box = $("mistoBox");
  if (!box) return;
  box.style.display = (t === "misto") ? "block" : "none";
  syncMistoTotal();
}

function syncComboLimit() {
  const placa = $("placa")?.value;
  if (!placa || !$("totalMods")) return;

  const limite = MAX_MOD[placa];
  const tomadas = Number($("qtdTomadas").value || 0);
  const teclas = Number($("teclas").value || 0);
  const total = tomadas + teclas;

  $("totalMods").value = `${total} módulo(s)`;
  $("limiteMods").value = `${limite} (placa ${placa})`;

  if (total > limite) {
    $("totalMods").style.borderColor = "#ef4444";
    $("totalMods").style.boxShadow = "0 0 0 4px rgba(239,68,68,0.18)";
  } else {
    $("totalMods").style.borderColor = "rgba(255,255,255,0.12)";
    $("totalMods").style.boxShadow = "none";
  }
}

// ==========================
// ORGANIZAR + SOMAR IGUAIS
// ==========================
function organizeAndMergeItems() {
  const map = new Map();
  for (const it of items) {
    const key = `${it.tipo}|||${it.descricao}`;
    const prev = map.get(key);
    if (prev) prev.qtd += Number(it.qtd || 0);
    else map.set(key, { ...it, qtd: Number(it.qtd || 0) });
  }

  const merged = Array.from(map.values());

  merged.sort((a, b) => {
    const t = a.tipo.localeCompare(b.tipo, "pt-BR");
    if (t !== 0) return t;
    return a.descricao.localeCompare(b.descricao, "pt-BR");
  });

  items = merged;
}

// ==========================
// RESUMO + CONTROLES
// ==========================
function updateSummaryAndControls() {
  const summary = $("listSummary");
  const btnPDF = $("btnPDF");

  if (btnPDF) btnPDF.disabled = (items.length === 0);

  if (!summary) return;

  if (items.length === 0) {
    summary.style.display = "none";
    return;
  }

  const totalItens = items.length;
  const totalUnidades = items.reduce((s, it) => s + Number(it.qtd || 0), 0);

  $("sumItens").textContent = String(totalItens);
  $("sumUnidades").textContent = String(totalUnidades);
  summary.style.display = "flex";
}

// ==========================
// ADICIONAR / LIMPAR
// ==========================
function addToList() {
  if (!selectedKey) {
    toast("Selecione um item", "Escolha uma categoria ou use a busca.", "danger");
    return;
  }

  let qtd = Number($("qtd")?.value || 0);
  if (selectedKey === "fio") qtd = 1;

  if (!qtd || qtd <= 0) {
    toast("Quantidade inválida", "Precisa ser maior que 0.", "danger");
    return;
  }

  const built = buildDescription(selectedKey);
  if (!built.ok) {
    toast("Faltou preencher", built.error, "danger");
    return;
  }

  items.push({
    id: makeId(),
    tipo: built.tipo,
    descricao: built.text,
    qtd,
  });

  organizeAndMergeItems();

  renderCards();
  updateSummaryAndControls();

  clearSelection();

  saveStorage();
  toast("Item adicionado", "Pronto. Próximo item.");
}

function clearSelection() {
  selectedKey = null;
  $("search").value = "";
  $("qtd").value = 1;

  setQtyModeForKey(null);

  renderForm(null);
  hideSuggestions();
}

function buildDescription(key) {
  const val = (id) => (document.getElementById(id)?.value || "").trim();

  // --- TOMADA ---
  if (key === "tomada") {
    const placa = val("placa");
    const n = Number(val("qtdTomadas") || 0);
    const amp = val("amp");
    const tensao = val("tensao");
    const local = val("local");
    const marca = val("marca");
    const corPlaca = val("corPlaca");
    const obs = val("obs");

    if (!placa || !n) return { ok:false, error:"Preencha placa e quantidade de tomadas." };

    const parts = [];
    if (local) parts.push(`Local: ${local}`);
    parts.push(`Placa: ${placa}`);
    parts.push(`Tomadas: ${n}x ${amp}`);

    if (tensao === "misto") {
      const q110 = Number(val("q110") || 0);
      const q220 = Number(val("q220") || 0);
      if (q110 + q220 !== n) return { ok:false, error:`No modo MISTO, 110 + 220 precisa dar ${n}.` };
      parts.push(`Tensão: ${q110}x 110V (branca) + ${q220}x 220V (vermelha)`);
    } else if (tensao === "110") parts.push("Tensão: 110V (branca)");
    else parts.push("Tensão: 220V (vermelha)");

    const extras = [];
    if (marca) extras.push(`Marca/Linha: ${marca}`);
    if (corPlaca) extras.push(`Cor placa: ${corPlaca}`);
    if (extras.length) parts.push(extras.join(" | "));
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:`Elétrica — Tomada (${placa})`, text: parts.join(" | ") };
  }

  // --- INTERRUPTOR ---
  if (key === "interruptor") {
    const placa = val("placa");
    const teclas = Number(val("teclas") || 0);
    const tipoInt = val("tipoInt");
    const local = val("local");
    const marca = val("marca");
    const corPlaca = val("corPlaca");
    const obs = val("obs");

    if (!placa || !teclas) return { ok:false, error:"Preencha placa e teclas." };

    const parts = [];
    if (local) parts.push(`Local: ${local}`);
    parts.push(`Placa: ${placa}`);
    parts.push(`Interruptor: ${tipoInt} — ${teclas} tecla(s)`);

    const extras = [];
    if (marca) extras.push(`Marca/Linha: ${marca}`);
    if (corPlaca) extras.push(`Cor placa: ${corPlaca}`);
    if (extras.length) parts.push(extras.join(" | "));
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:`Elétrica — Interruptor (${placa})`, text: parts.join(" | ") };
  }

  // --- MISTO ---
  if (key === "tomada_interruptor") {
    const placa = val("placa");
    const tomadas = Number(val("qtdTomadas") || 0);
    const teclas = Number(val("teclas") || 0);
    const tipoInt = val("tipoInt");
    const amp = val("amp");
    const tensao = val("tensao");
    const local = val("local");
    const marca = val("marca");
    const corPlaca = val("corPlaca");
    const obs = val("obs");

    if (!placa || !tomadas || !teclas) return { ok:false, error:"Preencha placa, tomadas e teclas." };

    const limite = MAX_MOD[placa];
    const totalMods = tomadas + teclas;
    if (totalMods > limite) {
      return { ok:false, error:`Esse conjunto usa ${totalMods} módulos e a placa ${placa} suporta ${limite}.` };
    }

    const parts = [];
    if (local) parts.push(`Local: ${local}`);
    parts.push(`Placa: ${placa}`);
    parts.push(`Tomadas: ${tomadas}x ${amp}`);

    if (tensao === "misto") {
      const q110 = Number(val("q110") || 0);
      const q220 = Number(val("q220") || 0);
      if (q110 + q220 !== tomadas) return { ok:false, error:`No modo MISTO, 110 + 220 precisa dar ${tomadas}.` };
      parts.push(`Tensão: ${q110}x 110V (branca) + ${q220}x 220V (vermelha)`);
    } else if (tensao === "110") parts.push("Tensão: 110V (branca)");
    else parts.push("Tensão: 220V (vermelha)");

    parts.push(`Interruptor: ${tipoInt} — ${teclas} tecla(s)`);

    const extras = [];
    if (marca) extras.push(`Marca/Linha: ${marca}`);
    if (corPlaca) extras.push(`Cor placa: ${corPlaca}`);
    if (extras.length) parts.push(extras.join(" | "));
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:`Elétrica — Ponto misto (${placa})`, text: parts.join(" | ") };
  }

  // --- FIO ---
  if (key === "fio") {
    const tipo = val("fioTipo");
    const bitola = val("bitola");
    const metros = Number(val("metros") || 0);
    const cor = val("fioCor");
    const obs = val("obs");

    if (!metros || metros <= 0) return { ok:false, error:"Informe a metragem (metros) do cabo/fio." };

    const parts = [`${tipo} — ${bitola} — ${metros} metros`];
    if (cor) parts.push(`Cor: ${cor}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Elétrica — Fio/Cabo", text: parts.join(" | ") };
  }

  // --- DISJUNTOR ---
  if (key === "disjuntor") {
    const tipo = val("djTipo");
    const corrente = val("corrente");
    const polos = val("polos");
    const curva = val("curva");

    const parts = [`${tipo} — ${corrente} — ${polos}`];
    if (curva) parts.push(curva);

    return { ok:true, tipo:"Elétrica — Proteção/Quadro", text: parts.join(" | ") };
  }

  // --- CONDUÍTE ---
  if (key === "conduite") {
    const tipo = val("condTipo");
    const diam = val("diam");
    const item = val("item");
    const obs = val("obs");

    const parts = [`${item} — ${tipo} — ${diam}`];
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Elétrica — Conduíte/Eletroduto", text: parts.join(" | ") };
  }

  // --- CAIXA ---
  if (key === "caixa") {
    const t = val("cxTipo");
    const prof = val("prof");
    const tampa = val("tampa");
    const obs = val("obs");

    const parts = [`Caixa ${t}`];
    if (prof) parts.push(`Prof: ${prof}`);
    parts.push(`Tampa: ${tampa}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Elétrica — Caixas", text: parts.join(" | ") };
  }

  // --- FITA LED ---
  if (key === "fita") {
    const tensao = val("ledTensao");
    const temp = val("ledTemp");
    const compSel = val("ledComp");
    const metrosDef = Number(val("ledMetros") || 0);
    const fonte = val("ledFonte");
    const uso = val("ledUso");
    const obs = val("obs");

    let compTxt = "Rolo 10m";
    if (compSel === "def") {
      if (!metrosDef || metrosDef <= 0) return { ok:false, error:"Defina a metragem da fita de LED." };
      compTxt = `${metrosDef}m`;
    }

    const parts = [`Fita LED — ${tensao} — ${temp} — ${compTxt}`];
    parts.push(`Fonte/Driver: ${fonte === "sim" ? "Sim" : "Não"}`);
    if (uso) parts.push(`Uso: ${uso}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Fita LED", text: parts.join(" | ") };
  }

  // --- PERFIL LED ---
  if (key === "perfil_led") {
    const tipo = val("perfilTipo");
    const cor = val("perfilCor");
    const metros = Number(val("perfilMetros") || 0);
    const dif = val("perfilDif");
    const obs = val("obs");

    if (!metros || metros <= 0) return { ok:false, error:"Informe a metragem (metros) do perfil de LED." };

    const parts = [`Perfil LED — ${tipo} — ${cor} — ${metros}m`];
    if (dif) parts.push(`Difusor: ${dif}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Perfis", text: parts.join(" | ") };
  }

  // --- PAR20 ---
  if (key === "par20") {
    const modelo = val("parModelo");
    const temp = val("parTemp");
    const tensao = val("parTensao");
    const obs = val("obs");

    const parts = [`PAR20 — ${modelo} — ${temp}`];
    if (tensao) parts.push(`Tensão: ${tensao}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Lâmpadas", text: parts.join(" | ") };
  }

  // --- MR16 ---
  if (key === "mr16") {
    const tensao = val("mrTensao");
    const temp = val("mrTemp");
    const driver = val("mrDriver");
    const obs = val("obs");

    const parts = [`MR16 — ${tensao} — ${temp}`, `Driver: ${driver}`];
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Lâmpadas", text: parts.join(" | ") };
  }

  // --- ARANDELA (modelo obrigatório) ---
  if (key === "arandela") {
    const cor = val("aranCor");
    const inst = val("aranInst");
    const modelo = val("aranModelo");
    const uso = val("aranUso");
    const obs = val("obs");

    if (!modelo) return { ok:false, error:"Em Arandela, preencha o campo DEFINIR MODELO." };

    const parts = [`Arandela — ${cor} — ${inst} — Modelo: ${modelo}`];
    if (uso) parts.push(`Uso: ${uso}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Arandelas", text: parts.join(" | ") };
  }

  // --- DRIVER/FONTE ---
  if (key === "driver_led") {
    const tipo = val("drvTipo");
    const saida = val("drvSaida");
    const w = Number(val("drvW") || 0);
    const uso = val("drvUso");
    const obs = val("obs");

    if (!w || w <= 0) return { ok:false, error:"Informe a potência (W) do driver/fonte." };

    const parts = [`${tipo} LED — ${saida} — ${w}W`];
    if (uso) parts.push(`Uso: ${uso}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Drivers/Fontes", text: parts.join(" | ") };
  }

  // --- CONECTOR FITA ---
  if (key === "conector_fita_led") {
    const tipo = val("conTipo");
    const larg = val("conLarg");
    const obs = val("obs");

    const parts = [`Conector p/ fita LED — ${tipo}`];
    if (larg) parts.push(`Largura: ${larg}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Acessórios", text: parts.join(" | ") };
  }

  // --- DIFUSOR ---
  if (key === "difusor_perfil") {
    const tipo = val("difTipo");
    const metros = Number(val("difMetros") || 0);
    const obs = val("obs");

    if (!metros || metros <= 0) return { ok:false, error:"Informe a metragem (metros) do difusor." };

    const parts = [`Difusor — ${tipo} — ${metros}m`];
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Acessórios", text: parts.join(" | ") };
  }

  // --- TRILHO ---
  if (key === "trilho") {
    const cor = val("trCor");
    const metros = Number(val("trMetros") || 0);
    const obs = val("obs");

    if (!metros || metros <= 0) return { ok:false, error:"Informe o comprimento (metros) do trilho." };

    const parts = [`Trilho eletrificado — ${cor} — ${metros}m`];
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Trilhos", text: parts.join(" | ") };
  }

  // --- SPOT TRILHO (modelo obrigatório) ---
  if (key === "spot_trilho") {
    const cor = val("spCor");
    const modelo = val("spModelo");
    const temp = val("spTemp");
    const obs = val("obs");

    if (!modelo) return { ok:false, error:"Em Spot p/ trilho, preencha o campo DEFINIR MODELO." };

    const parts = [`Spot p/ trilho — Modelo: ${modelo}`];
    if (cor) parts.push(`Cor: ${cor}`);
    if (temp) parts.push(`Temp: ${temp}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Iluminação — Trilhos", text: parts.join(" | ") };
  }

  // --- SENSOR PRESENÇA ---
  if (key === "sensor_presenca") {
    const inst = val("senInst");
    const uso = val("senUso");
    const obs = val("obs");

    const parts = [`Sensor de presença — ${inst}`];
    if (uso) parts.push(`Uso: ${uso}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Automação — Sensores", text: parts.join(" | ") };
  }

  // --- FOTOCÉLULA ---
  if (key === "fotocelula") {
    const ten = val("fotoTen");
    const a = val("fotoA");
    const obs = val("obs");

    const parts = ["Fotocélula"];
    if (ten) parts.push(`Tensão: ${ten}`);
    if (a) parts.push(`Corrente: ${a}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Automação — Sensores", text: parts.join(" | ") };
  }

  // --- BUCHA ---
  if (key === "bucha") {
    const tam = val("buTam");
    const tipo = val("buTipo");
    const obs = val("obs");

    const parts = [`Bucha ${tam}`];
    if (tipo) parts.push(`Tipo: ${tipo}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Fixação", text: parts.join(" | ") };
  }

  // --- PARAFUSO ---
  if (key === "parafuso_phillips") {
    const bit = val("phBitola");
    const comp = val("phComp");
    const acab = val("phAcab");
    const def = val("phDef");
    const obs = val("obs");

    const parts = ["Parafuso Phillips"];
    const specs = [];
    if (bit) specs.push(bit);
    if (comp) specs.push(comp);
    if (acab) specs.push(acab);
    if (specs.length) parts.push(`(${specs.join(" / ")})`);
    if (def) parts.push(`Definir: ${def}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Fixação", text: parts.join(" | ") };
  }

  // --- FITA ISOLANTE ---
  if (key === "fita_isolante") {
    const tipo = val("fitaTipo");
    const cor = val("fitaCor");
    const marca = val("marca");
    const obs = val("obs");

    const parts = [`Fita ${tipo} — ${cor}`];
    if (marca) parts.push(`Marca: ${marca}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Fixação", text: parts.join(" | ") };
  }

  return { ok:false, error:"Item não reconhecido." };
}

// ==========================
// LISTA EM CARDS
// ==========================
function renderCards() {
  const container = $("listCards");
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `
      <div class="emptyState">
        Nenhum item adicionado ainda. Adicione pelo campo de busca acima.
      </div>
    `;
    return;
  }

  const groups = {};
  for (const it of items) {
    if (!groups[it.tipo]) groups[it.tipo] = [];
    groups[it.tipo].push(it);
  }

  const tipos = Object.keys(groups).sort((a,b)=>a.localeCompare(b,"pt-BR"));

  tipos.forEach(tipo => {
    const totalGrupo = groups[tipo].reduce((s, it) => s + Number(it.qtd || 0), 0);

    const head = document.createElement("div");
    head.className = "groupTitle";
    head.innerHTML = `
      <strong>${escapeHtml(tipo)}</strong>
      <span class="groupMeta">${totalGrupo} un</span>
    `;
    container.appendChild(head);

    groups[tipo].forEach((it) => {
      const card = document.createElement("div");
      card.className = "itemCard";

      card.innerHTML = `
        <div>
          <div class="itemTitle">${escapeHtml(it.tipo)}</div>
          <div class="itemDesc">${escapeHtml(it.descricao)}</div>
        </div>

        <div class="itemMeta">
          <div class="badge">Qtd: ${it.qtd}</div>
          <button class="remove" type="button">Remover</button>
        </div>
      `;

      card.querySelector(".remove").addEventListener("click", () => {
        const i = items.findIndex(x => x.id === it.id);
        if (i >= 0) items.splice(i, 1);
        saveStorage();
        renderCards();
        updateSummaryAndControls();
        toast("Item removido");
      });

      container.appendChild(card);
    });
  });
}

// ==========================
// PDF
// ==========================
function generatePDF() {
  if (items.length === 0) {
    toast("Sem itens", "Adicione itens antes do PDF.", "danger");
    return;
  }

  const btn = $("btnPDF");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Gerando...";
  }

  const empresa = ($("empresa").value || "Empresa").trim();
  const cliente = ($("cliente").value || "Cliente").trim();
  const dataISO = $("data").value || new Date().toISOString().slice(0, 10);

  const totalItens = items.length;
  const totalUnidades = items.reduce((s, it) => s + Number(it.qtd || 0), 0);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const AZUL = [11, 94, 215];
  const CINZA = [40, 40, 40];

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...CINZA);
    doc.text("RELAÇÃO DE MATERIAIS ELÉTRICOS", 105, 14, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...AZUL);
    doc.text(empresa.toUpperCase(), 14, 28);

    doc.setDrawColor(210);
    doc.line(14, 31, 196, 31);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...CINZA);
    doc.text(`Cliente: ${cliente}`, 14, 36);
    doc.text(`Data: ${formatBR(dataISO)}`, 14, 42);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Itens: ${totalItens}  •  Total: ${totalUnidades} unidades`, 14, 48);
  };

  const drawFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Gerado no ELETROLIST — Página ${pageNumber}/${pageCount}`, 105, 290, { align: "center" });
  };

  const bodyRows = items.map(it => [it.tipo, it.descricao, String(it.qtd)]);

  drawHeader();

  doc.autoTable({
    startY: 54,
    head: [["Tipo", "Descrição", "Qtd"]],
    body: bodyRows,
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 4,
      overflow: "linebreak",
      valign: "top",
      textColor: 20,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 113 },
      2: { cellWidth: 16, halign: "right" },
    },
    headStyles: {
      fillColor: AZUL,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 12,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
    didDrawPage: () => { drawHeader(); drawFooter(); },
  });

  const safeEmpresa = empresa.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
  const safeCliente = cliente.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
  const fileName = `${safeEmpresa || "Empresa"}_${safeCliente || "Cliente"}_${dataISO}_ELETROLIST.pdf`;

  doc.save(fileName);

  if (btn) {
    btn.textContent = "Gerar PDF";
    btn.disabled = (items.length === 0);
  }
  toast("PDF gerado", "Pronto para enviar no WhatsApp.");
}

// ==========================
// UTILS
// ==========================
function formatBR(iso) {
  const [y, m, d] = String(iso).split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// start
init();
