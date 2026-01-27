const $ = (id) => document.getElementById(id);

// ==========================
// CATÁLOGO (BUSCA)
// ==========================
const CATALOG = [
  { key: "tomada", label: "Tomada (ponto/placa)", tag: "TOM" },
  { key: "interruptor", label: "Interruptor (ponto/placa)", tag: "INT" },
  { key: "tomada_interruptor", label: "Tomada + Interruptor (mesma placa)", tag: "MISTO" },
  { key: "fio", label: "Fio / Cabo", tag: "FIO" },
  { key: "disjuntor", label: "Disjuntor / DR / DPS", tag: "DISJ" },
  { key: "conduite", label: "Conduíte / Eletroduto", tag: "COND" },
  { key: "caixa", label: "Caixas (4x2 / 4x4 / octogonal...)", tag: "CAIXA" },
  { key: "fita", label: "Fita isolante", tag: "FITA" },
];

// limites reais
const MAX_MOD = { "4x2": 3, "4x4": 6 };

// estado
let selectedKey = null;
let items = [];

// storage
const STORAGE_KEY = "eletrolist_v1";

// ==========================
// TOASTS (UX PREMIUM)
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
// INIT
// ==========================
function init() {
  // data hoje (se não tiver salvo)
  const hoje = new Date().toISOString().slice(0, 10);
  if ($("data") && !$("data").value) $("data").value = hoje;

  // carregar rascunho salvo
  loadStorage();

  // eventos
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

  // chips
  document.querySelectorAll(".chip[data-key]").forEach(btn => {
    btn.addEventListener("click", () => selectItem(btn.dataset.key));
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

  // salvar quando editar dados do documento
  ["empresa", "cliente", "data"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("input", saveStorage);
    if (el) el.addEventListener("change", saveStorage);
  });

  // render inicial
  renderForm(null);
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
    .slice(0, 8);

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
        Digite no campo de busca e selecione um item para aparecerem as opções.
      </div>
    `;
    return;
  }

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

  if (key === "fio") {
    // ✅ melhoria: metragem
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

  if (key === "fita") {
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
// ORGANIZAR + SOMAR IGUAIS (melhoria #4)
// ==========================
function organizeAndMergeItems() {
  // soma iguais por chave tipo|descricao
  const map = new Map();
  for (const it of items) {
    const key = `${it.tipo}|||${it.descricao}`;
    const prev = map.get(key);
    if (prev) prev.qtd += Number(it.qtd || 0);
    else map.set(key, { ...it, qtd: Number(it.qtd || 0) });
  }

  const merged = Array.from(map.values());

  // ordena por tipo e depois por descrição
  merged.sort((a, b) => {
    const t = a.tipo.localeCompare(b.tipo, "pt-BR");
    if (t !== 0) return t;
    return a.descricao.localeCompare(b.descricao, "pt-BR");
  });

  items = merged;
}

// ==========================
// RESUMO + CONTROLES (melhoria #5 + PDF disabled)
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
    toast("Selecione um item", "Digite ou use os atalhos.", "danger");
    return;
  }

  const qtd = Number($("qtd").value || 0);
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
    tipo: built.tipo,
    descricao: built.text,
    qtd,
  });

  // soma iguais e ordena (deixa sempre limpo)
  organizeAndMergeItems();

  renderCards();
  updateSummaryAndControls();

  // ✅ melhoria: limpar seleção após adicionar
  clearSelection();

  saveStorage();
  toast("Item adicionado", "Pronto. Próximo item.");
}

function clearSelection() {
  selectedKey = null;
  $("search").value = "";
  $("qtd").value = 1;
  renderForm(null);
  hideSuggestions();
}

function buildDescription(key) {
  const val = (id) => (document.getElementById(id)?.value || "").trim();

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

    return { ok:true, tipo:`Ponto Tomada (${placa})`, text: parts.join(" | ") };
  }

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

    return { ok:true, tipo:`Ponto Interruptor (${placa})`, text: parts.join(" | ") };
  }

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

    return { ok:true, tipo:`Ponto Misto (${placa})`, text: parts.join(" | ") };
  }

  if (key === "fio") {
    const tipo = val("fioTipo");
    const bitola = val("bitola");
    const metros = Number(val("metros") || 0); // ✅
    const cor = val("fioCor");
    const obs = val("obs");

    if (!metros || metros <= 0) {
      return { ok:false, error:"Informe a metragem (metros) do cabo/fio." };
    }

    const parts = [`${tipo} — ${bitola} — ${metros} metros`];
    if (cor) parts.push(`Cor: ${cor}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Fio/Cabo", text: parts.join(" | ") };
  }

  if (key === "disjuntor") {
    const tipo = val("djTipo");
    const corrente = val("corrente");
    const polos = val("polos");
    const curva = val("curva");

    const parts = [`${tipo} — ${corrente} — ${polos}`];
    if (curva) parts.push(curva);

    return { ok:true, tipo:"Proteção/Quadro", text: parts.join(" | ") };
  }

  if (key === "conduite") {
    const tipo = val("condTipo");
    const diam = val("diam");
    const item = val("item");
    const obs = val("obs");

    const parts = [`${item} — ${tipo} — ${diam}`];
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Conduíte/Eletroduto", text: parts.join(" | ") };
  }

  if (key === "caixa") {
    const t = val("cxTipo");
    const prof = val("prof");
    const tampa = val("tampa");
    const obs = val("obs");

    const parts = [`Caixa ${t}`];
    if (prof) parts.push(`Prof: ${prof}`);
    parts.push(`Tampa: ${tampa}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Caixas", text: parts.join(" | ") };
  }

  if (key === "fita") {
    const tipo = val("fitaTipo");
    const cor = val("fitaCor");
    const marca = val("marca");
    const obs = val("obs");

    const parts = [`Fita ${tipo} — ${cor}`];
    if (marca) parts.push(`Marca: ${marca}`);
    if (obs) parts.push(`Obs: ${obs}`);

    return { ok:true, tipo:"Fixação/Conexões", text: parts.join(" | ") };
  }

  return { ok:false, error:"Item não reconhecido." };
}

// ==========================
// LISTA EM CARDS (AGRUPADA POR TIPO)
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

  // agrupa por tipo
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

    groups[tipo].forEach((it, idx) => {
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
        // remove pelo match (seguro mesmo se tiver reordenação)
        const i = items.findIndex(x => x.tipo === it.tipo && x.descricao === it.descricao);
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
// PDF PREMIUM (letra maior + empresa elegante + resumo)
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

    // empresa premium
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
    doc.text(
      `Gerado no ELETROLIST — Página ${pageNumber}/${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  };

  const bodyRows = items.map(it => [it.tipo, it.descricao, String(it.qtd)]);

  drawHeader();

  doc.autoTable({
    startY: 54,
    head: [["Tipo", "Descrição", "Qtd"]],
    body: bodyRows,
    styles: {
      font: "helvetica",
      fontSize: 11,      // ✅ maior
      cellPadding: 4,    // ✅ mais respiro
      overflow: "linebreak",
      valign: "top",
      textColor: 20,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 118 },
      2: { cellWidth: 16, halign: "right" },
    },
    headStyles: {
      fillColor: AZUL,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 12, // ✅ header maior
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
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
