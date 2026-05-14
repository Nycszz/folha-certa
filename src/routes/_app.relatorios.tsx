import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ExcelJS from "exceljs";
import { FileSpreadsheet } from "lucide-react";

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
  const [exporting, setExporting] = useState(false);

  useEffect(() => { load(); }, [start, end]);
  async function load() {
    const { data } = await supabase
      .from("ft")
      .select("*, funcionario:funcionarios!ft_funcionario_id_fkey(nome, re, posto_servico, setor, cargo), funcionario_faltante:funcionarios!ft_funcionario_faltante_id_fkey(nome, re)")
      .gte("data_ft", start)
      .lte("data_ft", end)
      .order("data_ft");
    setItems(data ?? []);
  }

  const totals = items.reduce(
    (acc, i) => {
      acc.total++;
      acc.horas += Number(i.horas_trabalhadas);
      acc.compensadas += Number(i.horas_compensadas);
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    },
    { total: 0, horas: 0, compensadas: 0, PENDENTE: 0, APROVADA: 0, NEGADA: 0, CANCELADA: 0 } as any
  );

  async function exportExcel() {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "Movimentação Operacional";
      wb.created = new Date();
      const ws = wb.addWorksheet("Relatório", { views: [{ state: "frozen", ySplit: 6 }] });

      const periodLabel = `${format(new Date(start + "T00:00:00"), "dd/MM/yyyy")} a ${format(new Date(end + "T00:00:00"), "dd/MM/yyyy")}`;

      // Title row
      ws.mergeCells("A1:I1");
      const title = ws.getCell("A1");
      title.value = "MOVIMENTAÇÃO OPERACIONAL";
      title.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
      title.alignment = { horizontal: "center", vertical: "middle" };
      title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3D3022" } };
      ws.getRow(1).height = 36;

      // Subtitle
      ws.mergeCells("A2:I2");
      const sub = ws.getCell("A2");
      sub.value = `Relatório Gerencial — Período: ${periodLabel}`;
      sub.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF6B5B45" } };
      sub.alignment = { horizontal: "center" };
      sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE6D6" } };
      ws.getRow(2).height = 22;

      // Generated date
      ws.mergeCells("A3:I3");
      const gen = ws.getCell("A3");
      gen.value = `Emitido em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`;
      gen.font = { name: "Calibri", size: 9, color: { argb: "FF999999" } };
      gen.alignment = { horizontal: "right" };

      // Summary block
      ws.mergeCells("A5:I5");
      const sumTitle = ws.getCell("A5");
      sumTitle.value = `Total: ${totals.total}   |   Aprovadas: ${totals.APROVADA}   |   Pendentes: ${totals.PENDENTE}   |   Negadas/Canceladas: ${totals.NEGADA + totals.CANCELADA}   |   Horas trabalhadas: ${totals.horas}h   |   Horas compensadas: ${totals.compensadas}h`;
      sumTitle.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF3D3022" } };
      sumTitle.alignment = { horizontal: "center", vertical: "middle" };
      sumTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F1E5" } };
      ws.getRow(5).height = 24;

      // Header row (row 6)
      const headers = ["Data", "Colaborador", "RE", "Posto/Setor", "Escala", "Horas Trab.", "Horas Comp.", "Funcionário Faltante", "Status"];
      const headerRow = ws.getRow(6);
      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6B5B45" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FF3D3022" } },
          bottom: { style: "thin", color: { argb: "FF3D3022" } },
          left: { style: "thin", color: { argb: "FF3D3022" } },
          right: { style: "thin", color: { argb: "FF3D3022" } },
        };
      });
      headerRow.height = 28;

      // Data rows
      items.forEach((i, idx) => {
        const row = ws.addRow([
          format(new Date(i.data_ft + "T00:00:00"), "dd/MM/yyyy"),
          i.funcionario?.nome ?? "—",
          i.funcionario?.re ?? "—",
          i.funcionario?.posto_servico ?? i.funcionario?.setor ?? "—",
          i.escala_servico ?? i.tipo_folga ?? "—",
          Number(i.horas_trabalhadas),
          Number(i.horas_compensadas),
          i.funcionario_faltante ? `${i.funcionario_faltante.nome} (RE ${i.funcionario_faltante.re})` : "—",
          i.status,
        ]);
        const isOdd = idx % 2 === 1;
        row.eachCell((cell, col) => {
          cell.font = { name: "Calibri", size: 10 };
          cell.alignment = { vertical: "middle", horizontal: col === 2 || col === 4 || col === 8 ? "left" : "center", wrapText: true };
          cell.border = {
            top: { style: "hair", color: { argb: "FFE5DDC9" } },
            bottom: { style: "hair", color: { argb: "FFE5DDC9" } },
            left: { style: "hair", color: { argb: "FFE5DDC9" } },
            right: { style: "hair", color: { argb: "FFE5DDC9" } },
          };
          if (isOdd) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF6EE" } };
          if (col === 6 || col === 7) cell.numFmt = '0.0" h"';
        });

        // Status badge color
        const statusColors: Record<string, string> = {
          APROVADA: "FF1B7A4D",
          PENDENTE: "FFB07A1A",
          NEGADA: "FFB23A48",
          CANCELADA: "FF6B5B45",
        };
        const statusBg: Record<string, string> = {
          APROVADA: "FFD9F0E3",
          PENDENTE: "FFFCEFD0",
          NEGADA: "FFF7DAD9",
          CANCELADA: "FFE8E2D5",
        };
        const statusCell = row.getCell(9);
        statusCell.font = { name: "Calibri", size: 9, bold: true, color: { argb: statusColors[i.status] ?? "FF333333" } };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusBg[i.status] ?? "FFEEEEEE" } };
        statusCell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Totals row
      if (items.length) {
        const totRow = ws.addRow(["", "", "", "", "TOTAIS", totals.horas, totals.compensadas, "", `${totals.total} reg.`]);
        totRow.eachCell((cell) => {
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3D3022" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = { top: { style: "medium", color: { argb: "FF3D3022" } } };
        });
        totRow.getCell(6).numFmt = '0.0" h"';
        totRow.getCell(7).numFmt = '0.0" h"';
        totRow.height = 24;
      }

      // Column widths
      const widths = [12, 32, 10, 22, 12, 13, 13, 28, 14];
      widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

      // Footer
      ws.addRow([]);
      const footRow = ws.addRow([`Documento gerado automaticamente pelo sistema Movimentação Operacional`]);
      ws.mergeCells(`A${footRow.number}:I${footRow.number}`);
      footRow.getCell(1).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF999999" } };
      footRow.getCell(1).alignment = { horizontal: "center" };

      // Page setup
      ws.pageSetup = {
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
      };
      ws.headerFooter.oddFooter = "&CMovimentação Operacional — Página &P de &N";

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `movimentacao_operacional_${start}_${end}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Consolidado de Movimentações Operacionais por período.</p>
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
        <button onClick={exportExcel} disabled={exporting || items.length === 0} className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-oak-dark text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
          <FileSpreadsheet className="size-4" />
          {exporting ? "Gerando..." : "Exportar Excel"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Total" value={totals.total} />
        <Stat label="Horas trab." value={`${totals.horas}h`} />
        <Stat label="Aprovadas" value={totals.APROVADA} />
        <Stat label="Pendentes" value={totals.PENDENTE} />
        <Stat label="Negadas/Canc." value={totals.NEGADA + totals.CANCELADA} />
      </div>

      <div className="bg-card border border-oak-light rounded-3xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhuma movimentação no período.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-sand/30">
                <Th>Data</Th><Th>Colaborador</Th><Th>Posto</Th><Th>Escala</Th><Th>Horas</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oak-light">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="px-8 py-4 text-sm tabular-nums">{format(new Date(i.data_ft + "T00:00:00"), "dd/MM/yy")}</td>
                  <td className="px-8 py-4 text-sm font-medium">{i.funcionario?.nome}</td>
                  <td className="px-8 py-4 text-sm">{i.funcionario?.posto_servico ?? i.funcionario?.setor ?? "—"}</td>
                  <td className="px-8 py-4 text-sm">{i.escala_servico ?? i.tipo_folga ?? "—"}</td>
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
