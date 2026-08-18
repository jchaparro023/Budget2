import { useState, useEffect, useMemo, useCallback } from "react";
import PanelMetricas from "./componentes/PanelMetricas";
import {
  Plus, Wallet, PieChart, Tags, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Trash2, X, Check, Receipt
} from "lucide-react";

const datosReales = {
  ingreso: 90665284,
  egreso: 88467953,
  fijos: 14961726,      // aproximado: suma fijos ene-ago del Excel (ajústalo si quieres el dato exacto)
  variables: 54602686,  // idem, quítale la moto si ya la reclasificaste como activo
  deuda: 44881722,
  provisiones: 5696743,
  ahorro: 0,
};

const datosProyectados = {
  ingreso: 36294886,
  egreso: 31674924,
};

const deudaPorAcreedor = [
  { nombre: "Bancolombia Crédito", saldo: 53024343 },
  { nombre: "Hipotecario", saldo: 17013111 },
  { nombre: "C. Rappi", saldo: 12877121 },
  { nombre: "Compensar", saldo: 8371023 },
  { nombre: "NU", saldo: 5633216 },
  { nombre: "AV Villas", saldo: 2159685 },
  { nombre: "Rappi", saldo: 89000 },
];

// ---------------------------------------------------------------------------
// Modelo de datos
// Transacción: { id, fecha (ISO), tipo: 'ingreso'|'egreso', categoria,
//                detalle, valor (number), recurrencia }
// Categoría:   { id, nombre, tipo: 'ingreso'|'egreso' }
// ---------------------------------------------------------------------------

const CATS_DEFAULT = [
  { id: "salario", nombre: "Salario / Quincena", tipo: "ingreso" },
  { id: "otros_ing", nombre: "Otros ingresos", tipo: "ingreso" },
  { id: "alimentacion", nombre: "Alimentación", tipo: "egreso" },
  { id: "moto", nombre: "Moto", tipo: "egreso" },
  { id: "carro", nombre: "Carro", tipo: "egreso" },
  { id: "vivienda", nombre: "Vivienda / Servicios", tipo: "egreso" },
  { id: "deuda", nombre: "Deudas / Tarjetas", tipo: "egreso" },
  { id: "diarios", nombre: "Gastos diarios", tipo: "egreso" },
  { id: "ahorro", nombre: "Ahorro", tipo: "egreso" },
  { id: "otros_egr", nombre: "Otros gastos", tipo: "egreso" },
];

const RECURRENCIAS = ["Único", "Eventual", "Recurrente"];

const TIPO_MAP = { i: "ingreso", e: "egreso" };
const REC_MAP = { U: "Único", E: "Eventual", R: "Recurrente" };
// Nota: se quitó el listado de datos migrados (SEED_TXS) para que la app
// arranque siempre en $0. Si más adelante quieres volver a importar el
// Excel, dime y te regenero esa parte.
const SEED_TXS = [];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const money = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------------------------------------------------------------------------

export default function PresupuestoApp() {
  const [tab, setTab] = useState("registrar");
  const [txs, setTxs] = useState(null); // null = loading
  const [cats, setCats] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [toast, setToast] = useState(null);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("transacciones", false);
        setTxs(r ? JSON.parse(r.value) : []);
      } catch {
        setTxs([]);
      }
      try {
        const r = await window.storage.get("categorias", false);
        setCats(r ? JSON.parse(r.value) : CATS_DEFAULT);
      } catch {
        setCats(CATS_DEFAULT);
      }
    })();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const saveTxs = useCallback(async (next) => {
    setTxs(next);
    try {
      const res = await window.storage.set("transacciones", JSON.stringify(next), false);
      if (!res) showToast("No se pudo guardar. Intenta de nuevo.");
    } catch {
      showToast("Error guardando. Intenta de nuevo.");
    }
  }, [showToast]);

  const saveCats = useCallback(async (next) => {
    setCats(next);
    try {
      await window.storage.set("categorias", JSON.stringify(next), false);
    } catch {
      showToast("Error guardando categoría.");
    }
  }, [showToast]);

  const addTx = useCallback((tx) => {
    const next = [{ ...tx, id: uid() }, ...(txs || [])];
    saveTxs(next);
    showToast("Movimiento registrado");
  }, [txs, saveTxs, showToast]);

  const deleteTx = useCallback((id) => {
    saveTxs((txs || []).filter((t) => t.id !== id));
  }, [txs, saveTxs]);

  const resetAllTxs = useCallback(() => {
    saveTxs([]);
    showToast("Se borraron todos los movimientos");
  }, [saveTxs, showToast]);

  const addCat = useCallback((nombre, tipo) => {
    const id = nombre.toLowerCase().trim().replace(/\s+/g, "_") + "_" + uid().slice(0, 3);
    saveCats([...(cats || []), { id, nombre: nombre.trim(), tipo }]);
  }, [cats, saveCats]);

  const loading = txs === null || cats === null;

  const refDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthTxs = useMemo(() => {
    if (!txs) return [];
    const y = refDate.getFullYear(), m = refDate.getMonth();
    return txs.filter((t) => {
      const d = new Date(t.fecha + "T00:00:00");
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [txs, refDate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#EDE6D6", fontFamily: "'Georgia', serif" }}>
      <style>{`
        .mono { font-family: 'Courier New', ui-monospace, monospace; }
      `}</style>

      <Header refDate={refDate} monthOffset={monthOffset} setMonthOffset={setMonthOffset} monthTxs={monthTxs} />

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-md w-full mx-auto">
        {loading ? (
          <div className="text-center py-20 mono text-sm" style={{ color: "#6b6252" }}>Cargando libro…</div>
        ) : tab === "registrar" ? (
          <RegistrarTab cats={cats} onAdd={addTx} recentTxs={txs.slice(0, 6)} onDelete={deleteTx} />
        ) : tab === "resumen" ? (
          <ResumenTab monthTxs={monthTxs} cats={cats} refDate={refDate} />
        ) : tab === "categorias" ? (
          <CategoriasTab cats={cats} monthTxs={monthTxs} onAddCat={addCat} onResetAll={resetAllTxs} totalTxCount={(txs || []).length} />
        ) : (
          <div className="pb-6">
            <PanelMetricas real={datosReales} proyectado={datosProyectados} deudaDetalle={deudaPorAcreedor} />
          </div>
        )}
      </main>

      <TabBar tab={tab} setTab={setTab} />

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm mono shadow-lg z-50"
          style={{ background: "#1F3A2E", color: "#EDE6D6" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// --- Header con saldo del mes -------------------------------------------------

function Header({ refDate, monthOffset, setMonthOffset, monthTxs }) {
  const ingresos = monthTxs.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + Number(t.valor || 0), 0);
  const egresos = monthTxs.filter((t) => t.tipo === "egreso").reduce((s, t) => s + Number(t.valor || 0), 0);
  const saldo = ingresos - egresos;

  return (
    <div style={{ background: "#1F3A2E", color: "#EDE6D6" }} className="px-4 pt-6 pb-5">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonthOffset(monthOffset - 1)} aria-label="Mes anterior" className="p-1 opacity-80 hover:opacity-100">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-xs tracking-[0.2em] uppercase opacity-70 mono">Presupuesto</div>
            <div className="text-lg" style={{ fontWeight: 600 }}>{MESES[refDate.getMonth()]} {refDate.getFullYear()}</div>
          </div>
          <button onClick={() => setMonthOffset(monthOffset + 1)} aria-label="Mes siguiente" className="p-1 opacity-80 hover:opacity-100">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="border-t border-dashed opacity-40 my-2" />

        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wide opacity-70">Saldo del mes</span>
          <span className="mono text-2xl" style={{ color: saldo >= 0 ? "#C89B3C" : "#D97757" }}>
            {money(saldo)}
          </span>
        </div>
        <div className="flex justify-between mt-1 text-xs mono opacity-80">
          <span>Ingresos {money(ingresos)}</span>
          <span>Egresos {money(egresos)}</span>
        </div>
      </div>
    </div>
  );
}

// --- Tab: Registrar ---------------------------------------------------------

function RegistrarTab({ cats, onAdd, recentTxs, onDelete }) {
  const [tipo, setTipo] = useState("egreso");
  const [categoria, setCategoria] = useState(cats.find((c) => c.tipo === "egreso")?.id || "");
  const [detalle, setDetalle] = useState("");
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [recurrencia, setRecurrencia] = useState("Eventual");

  const catsFiltradas = cats.filter((c) => c.tipo === tipo);

  useEffect(() => {
    if (!catsFiltradas.find((c) => c.id === categoria)) {
      setCategoria(catsFiltradas[0]?.id || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const submit = (e) => {
    e.preventDefault();
    const v = parseFloat(valor);
    if (!v || v <= 0 || !categoria) return;
    onAdd({ tipo, categoria, detalle: detalle.trim() || "Sin detalle", valor: v, fecha, recurrencia });
    setDetalle("");
    setValor("");
  };

  return (
    <div>
      <form onSubmit={submit} className="rounded-xl p-4 mb-6" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        <div className="flex rounded-lg overflow-hidden mb-4" style={{ border: "1px solid #1F3A2E" }}>
          {["egreso", "ingreso"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className="flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1"
              style={tipo === t
                ? { background: "#1F3A2E", color: "#EDE6D6" }
                : { background: "transparent", color: "#1F3A2E" }}
            >
              {t === "egreso" ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
              {t === "egreso" ? "Egreso" : "Ingreso"}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Categoría</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {catsFiltradas.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategoria(c.id)}
              className="px-3 py-1.5 rounded-full text-xs mono border"
              style={categoria === c.id
                ? { background: "#C89B3C", borderColor: "#C89B3C", color: "#1F3A2E" }
                : { background: "transparent", borderColor: "#c9bfa4", color: "#4a4436" }}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Valor (COP)</label>
        <input
          type="number"
          inputMode="numeric"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0"
          required
          className="w-full mb-4 px-3 py-2 rounded-lg mono text-lg outline-none"
          style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
        />

        <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Detalle</label>
        <input
          type="text"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Ej. Gasolina moto, mercado…"
          className="w-full mb-4 px-3 py-2 rounded-lg outline-none text-sm"
          style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
        />

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm mono"
              style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Recurrencia</label>
            <select
              value={recurrencia}
              onChange={(e) => setRecurrencia(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm"
              style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
            >
              {RECURRENCIAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          style={{ background: "#1F3A2E", color: "#EDE6D6" }}
        >
          <Plus size={18} /> Registrar movimiento
        </button>
      </form>

      <div className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: "#6b6252" }}>
        <Receipt size={14} /> Últimos movimientos
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        {recentTxs.length === 0 && (
          <div className="p-4 text-sm text-center" style={{ color: "#8a8064" }}>Aún no hay movimientos registrados.</div>
        )}
        {recentTxs.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: i === 0 ? "none" : "1px dashed #d8cfb8" }}
          >
            <div className="min-w-0">
              <div className="text-sm truncate" style={{ color: "#2b2818" }}>{t.detalle}</div>
              <div className="text-xs mono" style={{ color: "#8a8064" }}>
                {t.fecha} · {cats.find((c) => c.id === t.categoria)?.nombre || t.categoria}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="mono text-sm" style={{ color: t.tipo === "ingreso" ? "#1F3A2E" : "#B0492E" }}>
                {t.tipo === "ingreso" ? "+" : "−"}{money(t.valor)}
              </span>
              <button onClick={() => onDelete(t.id)} aria-label="Eliminar" className="opacity-40 hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tab: Resumen ------------------------------------------------------------

function ResumenTab({ monthTxs, cats }) {
  const egresos = monthTxs.filter((t) => t.tipo === "egreso");
  const ingresos = monthTxs.filter((t) => t.tipo === "ingreso");
  const totalEgr = egresos.reduce((s, t) => s + Number(t.valor), 0);
  const totalIng = ingresos.reduce((s, t) => s + Number(t.valor), 0);

  const porCategoria = useMemo(() => {
    const map = {};
    egresos.forEach((t) => {
      map[t.categoria] = (map[t.categoria] || 0) + Number(t.valor);
    });
    return Object.entries(map)
      .map(([id, valor]) => ({ id, nombre: cats.find((c) => c.id === id)?.nombre || id, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [egresos, cats]);

  const max = porCategoria[0]?.valor || 1;

  return (
    <div>
      <div className="rounded-xl p-4 mb-4" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        <div className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: "#6b6252" }}>
          <PieChart size={14} /> Ingresos vs. egresos
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "#e4dcc4" }}>
          <div style={{ width: `${totalIng + totalEgr ? (totalIng / (totalIng + totalEgr)) * 100 : 0}%`, background: "#1F3A2E" }} />
          <div style={{ width: `${totalIng + totalEgr ? (totalEgr / (totalIng + totalEgr)) * 100 : 0}%`, background: "#D97757" }} />
        </div>
        <div className="flex justify-between text-xs mono mt-2">
          <span style={{ color: "#1F3A2E" }}>● Ingresos {money(totalIng)}</span>
          <span style={{ color: "#D97757" }}>● Egresos {money(totalEgr)}</span>
        </div>
      </div>

      <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6b6252" }}>Gasto por categoría</div>
      <div className="rounded-xl p-4" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        {porCategoria.length === 0 && (
          <div className="text-sm text-center py-4" style={{ color: "#8a8064" }}>Sin egresos este mes todavía.</div>
        )}
        {porCategoria.map((c) => (
          <div key={c.id} className="mb-3 last:mb-0">
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: "#2b2818" }}>{c.nombre}</span>
              <span className="mono" style={{ color: "#4a4436" }}>{money(c.valor)}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "#e4dcc4" }}>
              <div className="h-2 rounded-full" style={{ width: `${(c.valor / max) * 100}%`, background: "#C89B3C" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tab: Categorías -----------------------------------------------------------

function CategoriasTab({ cats, monthTxs, onAddCat, onResetAll, totalTxCount }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("egreso");
  const [showForm, setShowForm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const totalPorCat = (id) =>
    monthTxs.filter((t) => t.categoria === id).reduce((s, t) => s + Number(t.valor), 0);

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAddCat(nombre, tipo);
    setNombre("");
    setShowForm(false);
  };

  return (
    <div>
      {["egreso", "ingreso"].map((grupo) => (
        <div key={grupo} className="mb-5">
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6b6252" }}>
            {grupo === "egreso" ? "Categorías de egreso" : "Categorías de ingreso"}
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
            {cats.filter((c) => c.tipo === grupo).map((c, i) => (
              <div key={c.id} className="flex justify-between items-center px-4 py-2.5"
                style={{ borderTop: i === 0 ? "none" : "1px dashed #d8cfb8" }}>
                <span className="text-sm" style={{ color: "#2b2818" }}>{c.nombre}</span>
                <span className="mono text-sm" style={{ color: "#8a8064" }}>{money(totalPorCat(c.id))}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={submit} className="rounded-xl p-4" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la categoría"
            className="w-full mb-3 px-3 py-2 rounded-lg outline-none text-sm"
            style={{ background: "#fff", border: "1px solid #d8cfb8" }}
          />
          <div className="flex rounded-lg overflow-hidden mb-3" style={{ border: "1px solid #1F3A2E" }}>
            {["egreso", "ingreso"].map((t) => (
              <button type="button" key={t} onClick={() => setTipo(t)} className="flex-1 py-1.5 text-sm"
                style={tipo === t ? { background: "#1F3A2E", color: "#EDE6D6" } : { color: "#1F3A2E" }}>
                {t === "egreso" ? "Egreso" : "Ingreso"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1"
              style={{ background: "#1F3A2E", color: "#EDE6D6" }}>
              <Check size={16} /> Guardar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg"
              style={{ border: "1px solid #d8cfb8", color: "#4a4436" }}>
              <X size={16} />
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-lg text-sm flex items-center justify-center gap-2"
          style={{ border: "1px dashed #a89f83", color: "#4a4436" }}
        >
          <Plus size={16} /> Nueva categoría
        </button>
      )}

      <div className="mt-8 pt-4" style={{ borderTop: "1px dashed #d8cfb8" }}>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6b6252" }}>Zona de reinicio</div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={totalTxCount === 0}
            className="w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ border: "1px solid #B0492E", color: "#B0492E" }}
          >
            <Trash2 size={16} /> Borrar todos los movimientos ({totalTxCount})
          </button>
        ) : (
          <div className="rounded-lg p-3" style={{ background: "#B0492E11", border: "1px solid #B0492E" }}>
            <p className="text-sm mb-3" style={{ color: "#7a2f1e" }}>
              Esto borra los {totalTxCount} movimientos guardados y deja el saldo en $0. No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { onResetAll(); setConfirming(false); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#B0492E", color: "#fff" }}
              >
                Sí, borrar todo
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ border: "1px solid #d8cfb8", color: "#4a4436" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Barra inferior ----------------------------------------------------------

function TabBar({ tab, setTab }) {
  const items = [
    { id: "registrar", label: "Registrar", icon: Plus },
    { id: "resumen", label: "Resumen", icon: Wallet },
    { id: "categorias", label: "Categorías", icon: Tags },
    { id: "metricas", label: "Métricas", icon: PieChart },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-around py-2 z-40"
      style={{ background: "#1F3A2E", borderTop: "1px solid #16281f" }}
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg"
          style={{ color: tab === id ? "#C89B3C" : "#EDE6D6", opacity: tab === id ? 1 : 0.65 }}
        >
          <Icon size={20} />
          <span className="text-[10px] mono">{label}</span>
        </button>
      ))}
    </div>
  );
}
