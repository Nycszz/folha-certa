import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  initial?: any;
  onDone: () => void;
}

export function FuncionarioForm({ initial, onDone }: Props) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    re: initial?.re ?? "",
    cargo: initial?.cargo ?? "",
    posto_servico: initial?.posto_servico ?? "",
    supervisor: initial?.supervisor ?? "",
    turno: initial?.turno ?? "Manhã",
    usa_banco_horas: initial?.usa_banco_horas ?? false,
    status_ativo: initial?.status_ativo ?? true,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = initial
      ? await supabase.from("funcionarios").update(form).eq("id", initial.id)
      : await supabase.from("funcionarios").insert(form as any);
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success(initial ? "Funcionário atualizado" : "Funcionário cadastrado");
      onDone();
    }
  }

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-oak-light rounded-3xl p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Nome completo" value={form.nome} onChange={set("nome")} required />
        <Field label="RE" value={form.re} onChange={set("re")} required />
        <Field label="Cargo" value={form.cargo} onChange={set("cargo")} required />
        <Field label="Posto de serviço" value={form.posto_servico} onChange={set("posto_servico")} required />
        <Field label="Supervisor" value={form.supervisor} onChange={set("supervisor")} />
        <SelectField label="Turno" value={form.turno} onChange={set("turno")} options={["Manhã", "Tarde", "Noite", "Integral"]} />
        <SelectField
          label="Banco de horas"
          value={form.usa_banco_horas ? "true" : "false"}
          onChange={(e: any) => setForm({ ...form, usa_banco_horas: e.target.value === "true" })}
          options={[{ value: "true", label: "Sim" }, { value: "false", label: "Não" }]}
        />
        <SelectField
          label="Status"
          value={String(form.status_ativo)}
          onChange={(e: any) => setForm({ ...form, status_ativo: e.target.value === "true" })}
          options={[{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }]}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-oak-light">
        <button type="button" onClick={onDone} className="px-5 py-2.5 text-sm font-medium text-oak-dark hover:bg-oak-medium/20 rounded-xl">Cancelar</button>
        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-oak-dark text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50">
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required, step }: any) {
  return (
    <div>
      <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        step={step}
        required={required}
        value={value ?? ""}
        onChange={onChange}
        className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-oak-dark/20"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  const opts = (options as any[]).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div>
      <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">{label}</label>
      <select value={value} onChange={onChange} className="mt-2 w-full px-4 py-2.5 bg-sand rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-oak-dark/20">
        {opts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
