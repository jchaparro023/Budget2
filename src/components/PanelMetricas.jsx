import { AlertTriangle, TrendingDown, TrendingUp, Wallet } from "lucide-react";

/**
 * Panel de métricas financieras: real vs. ideal, por rubro.
 *
 * Uso:
 * <PanelMetricas
 *   real={{ ingreso, egreso, fijos, variables, deuda, provisiones, ahorro }}
 *   proyectado={{ ingreso, egreso, fijos, variables, deuda, provisiones, ahorro }} // opcional
 *   deudaDetalle={[{ nombre: "Bancolombia Crédito", saldo: 53024343 }, ...]}
 * />
 *
 * Todos los montos en COP, como números planos (sin formatear).
 * Los % ideales están fijados como constantes (IDEALES) — ajústalos si cambian tus metas.
 */

const IDEALES = {
  ahorro: 0.10,
  deuda: 0.30,
  variables: 0.30,
  fijos: 0.20,
  provisiones: 0.075, // punto medio del rango 5-10%
};

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

const pct = (n) => `${(n * 100).toFixed(1)}%`;

function estadoColor(real, ideal, tipoMax = true) {
  // tipoMax=true: real por ENCIMA del ideal es malo (deuda, variables, fijos)
  // tipoMax=false: real por DEBAJO del ideal es malo (ahorro, provisiones)
  const ratio = ideal === 0 ? 0 : real / ideal;
  if (tipoMax) {
    if (ratio <= 1) return "ok";
    if (ratio <= 1.25) return "warn";
    return "bad";
  } else {
    if (ratio >= 1) return "ok";
    if (ratio >= 0.6) return "warn";
    return "bad";
  }
}

const COLORS = {
  ok: { bar: "bg-emerald-500", text: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700" },
  warn: { bar: "bg-amber-500", text: "text-amber-600", chip: "bg-amber-50 text-amber-700" },
  bad: { bar: "bg-rose-500", text: "text-rose-600", chip: "bg-rose-50 text-rose-700" },
};

function FilaRubro({ nombre, real, ideal, ingreso, invertido = false, nota }) {
  const realPct = ingreso ? real / ingreso : 0;
  const estado = estadoColor(realPct, ideal, !invertido);
  const c = COLORS[estado];
  const anchoReal = Math.min(realPct * 100, 100);
  const posIdeal = Math.min(ideal * 100, 100);

  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold text-slate-800">{nombre}</span>
        <span className="text-sm font-mono">
          <span className={c.text}>{pct(realPct)}</span>
          <span className="text-slate-400 ml-2">meta {invertido ? "≥" : "≤"} {pct(ideal)}</span>
        </span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full">
        <div className={`absolute inset-y-0 left-0 rounded-full ${c.bar}`} style={{ width: `${anchoReal}%` }} />
        <div className="absolute -top-0.5 w-0.5 h-3 bg-slate-700" style={{ left: `${posIdeal}%` }} />
      </div>
      {nota && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{nota}</p>}
    </div>
  );
}

function TarjetaKPI({ icon: Icon, label, valor, sub, tono = "default" }) {
  const tonos = {
    default: "text-slate-800",
    pos: "text-emerald-600",
    neg: "text-rose-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide mb-2">
        <Icon size={14} />
        {label}
      </div>
      <div className={`text-xl font-bold font-mono ${tonos[tono]}`}>{valor}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function PanelMetricas({ real, proyectado, deudaDetalle = [] }) {
  if (!real) return null;

  const flujo = real.ingreso - real.egreso;
  const flujoPct = real.ingreso ? flujo / real.ingreso : 0;
  const deudaTotal = deudaDetalle.reduce((a, d) => a + d.saldo, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TarjetaKPI icon={TrendingUp} label="Ingreso" valor={fmt(real.ingreso)} />
        <TarjetaKPI icon={TrendingDown} label="Egreso" valor={fmt(real.egreso)} />
        <TarjetaKPI
          icon={Wallet}
          label="Flujo de caja"
          valor={fmt(flujo)}
          sub={pct(flujoPct)}
          tono={flujo >= 0 ? "pos" : "neg"}
        />
        {deudaDetalle.length > 0 && (
          <TarjetaKPI icon={AlertTriangle} label="Deuda total" valor={fmt(deudaTotal)} tono="neg" />
        )}
      </div>

      {/* Real vs proyectado, si viene */}
      {proyectado && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>
            Estos números mezclan meses ejecutados con proyectados. Ejecutado real:{" "}
            <b className="font-mono">{pct(flujoPct)}</b> de margen — proyectado:{" "}
            <b className="font-mono">
              {pct(proyectado.ingreso ? (proyectado.ingreso - proyectado.egreso) / proyectado.ingreso : 0)}
            </b>
            . No confíes el margen total hasta que los meses futuros se vuelvan reales.
          </p>
        </div>
      )}

      {/* Rubros */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Distribución del ingreso — real vs. ideal</h3>
        <p className="text-xs text-slate-400 mb-2">La línea vertical marca la meta recomendada.</p>
        <FilaRubro nombre="Ahorro / inversión" real={real.ahorro} ideal={IDEALES.ahorro} ingreso={real.ingreso} invertido />
        <FilaRubro nombre="Servicio de deuda" real={real.deuda} ideal={IDEALES.deuda} ingreso={real.ingreso} />
        <FilaRubro nombre="Gastos variables" real={real.variables} ideal={IDEALES.variables} ingreso={real.ingreso} />
        <FilaRubro nombre="Gastos fijos" real={real.fijos} ideal={IDEALES.fijos} ingreso={real.ingreso} />
        <FilaRubro nombre="Provisiones" real={real.provisiones} ideal={IDEALES.provisiones} ingreso={real.ingreso} invertido />
      </div>

      {/* Deuda por acreedor */}
      {deudaDetalle.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Deuda por acreedor</h3>
          <div className="space-y-3">
            {deudaDetalle
              .slice()
              .sort((a, b) => b.saldo - a.saldo)
              .map((d) => (
                <div key={d.nombre} className="grid grid-cols-[1fr_auto] gap-3 items-center">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{d.nombre}</span>
                      <span className="font-mono text-slate-500">{fmt(d.saldo)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${deudaTotal ? (d.saldo / deudaTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
