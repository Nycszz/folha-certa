import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/relatorios")({
  component: Relatorios,
});

function Relatorios() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [start, setStart] = useState(first.toISOString().split("T")[0]);
  const [end, setEnd] = useState(last.toISOString().split("T")[0]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => { load(); }, [start, end]);
  async function load() {
    const { data } = await supabase
      .from("ft")
      .select("*, funcionario:funcionarios(nome, re, setor)")
      .gte("data_ft", start)
      .lte("data_ft", end)
      .order("data_ft");
    setItems(data ?? []);
  }

  const totals = items.reduce(
    (acc, i) => {
      acc.total++;
      acc.horas += Number(i.horas_trabalhadas);
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    },
    { total: 0, horas: 0, PENDENTE: 0, APROVADA: 0, NEGADA: 0, CANCELADA: 0 } as any
  );

  function exportCSV() {
    const rows = [
      ["Data", "Funcionário", "RE", "Setor", "Tipo", "Horas", "Status", "Motivo"],
      ...items.map((i) => [i.data_ft, i.funcionario?.nome, i.funcionario?.re, i.funcionario?.setor, i.tipo_folga, i.horas_trabalhadas, i.status, i.motivo]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_ft_${start}_${end}.csv`;
    a.click();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Consolidado de FT por período.</p>
      </div>

      <div className="bg-card border border-oak-light rounded-3xl p-6 flex flex-wrap items-end gap-5">
        <div>
          <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Início</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-2 px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Fim</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-2 px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20" />
        </div>
        <button onClick={exportCSV} className="ml-auto px-5 py-2.5 bg-oak-dark text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Exportar CSV</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Total FT" value={totals.total} />
        <Stat label="Horas" value={`${totals.horas}h`} />
        <Stat label="Aprovadas" value={totals.APROVADA} />
        <Stat label="Pendentes" value={totals.PENDENTE} />
        <Stat label="Negadas/Canc." value={totals.NEGADA + totals.CANCELADA} />
      </div>

      <div className="bg-card border border-oak-light rounded-3xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhuma FT no período.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-sand/30">
                <Th>Data</Th><Th>Colaborador</Th><Th>Setor</Th><Th>Tipo</Th><Th>Horas</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oak-light">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="px-8 py-4 text-sm tabular-nums">{format(new Date(i.data_ft + "T00:00:00"), "dd/MM/yy")}</td>
                  <td className="px-8 py-4 text-sm font-medium">{i.funcionario?.nome}</td>
                  <td className="px-8 py-4 text-sm">{i.funcionario?.setor}</td>
                  <td className="px-8 py-4 text-sm">{i.tipo_folga}</td>
                  <td className="px-8 py-4 text-sm tabular-nums">{i.horas_trabalhadas}h</td>
                  <td className="px-8 py-4"><StatusBadge status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-oak-light p-5 rounded-2xl">
      <p className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-light tabular-nums mt-2">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-8 py-4 text-[10px] font-bold text-oak-dark/50 uppercase tracking-widest">{children}</th>;
}
