import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ft/novo")({
  component: NovaFT,
});

function NovaFT() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [form, setForm] = useState({
    funcionario_id: "",
    data_ft: new Date().toISOString().split("T")[0],
    tipo_folga: "Feriado",
    motivo: "",
    horas_trabalhadas: 8,
    horas_compensadas: 0,
    observacao: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("funcionarios").select("id, nome, re").eq("status_ativo", true).order("nome").then(({ data }) => setFuncionarios(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.funcionario_id) {
      toast.error("Selecione um funcionário");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("ft").insert({
      ...form,
      horas_trabalhadas: Number(form.horas_trabalhadas),
      horas_compensadas: Number(form.horas_compensadas),
      lancado_por: user?.id,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("Já existe uma FT para este funcionário nesta data.");
      else toast.error(error.message);
    } else {
      toast.success("FT registrada");
      navigate({ to: "/ft" });
    }
  }

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Nova FT</h1>
        <p className="text-muted-foreground mt-1">Registrar uma folga trabalhada.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-oak-light rounded-3xl p-8 space-y-6">
        <div>
          <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Funcionário</label>
          <select required value={form.funcionario_id} onChange={set("funcionario_id")} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20">
            <option value="">Selecione...</option>
            {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome} (RE {f.re})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Data da FT</label>
            <input type="date" required value={form.data_ft} onChange={set("data_ft")} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Tipo de folga</label>
            <select value={form.tipo_folga} onChange={set("tipo_folga")} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20">
              <option>Feriado</option><option>Folga compensatória</option><option>Domingo</option><option>Sábado</option><option>Banco de horas</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Horas trabalhadas</label>
            <input type="number" step="0.5" min="0" required value={form.horas_trabalhadas} onChange={set("horas_trabalhadas")} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Horas compensadas</label>
            <input type="number" step="0.5" min="0" value={form.horas_compensadas} onChange={set("horas_compensadas")} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Motivo</label>
          <input required value={form.motivo} onChange={set("motivo")} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20" placeholder="Ex.: cobertura de plantão" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Observação</label>
          <textarea value={form.observacao} onChange={set("observacao")} rows={3} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-oak-dark/20" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-oak-light">
          <button type="button" onClick={() => navigate({ to: "/ft" })} className="px-5 py-2.5 text-sm font-medium text-oak-dark hover:bg-oak-medium/20 rounded-xl">Cancelar</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-oak-dark text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50">
            {loading ? "Salvando..." : "Registrar FT"}
          </button>
        </div>
      </form>
    </div>
  );
}
