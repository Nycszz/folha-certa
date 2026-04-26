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
    cpf: initial?.cpf ?? "",
    re: initial?.re ?? "",
    cargo: initial?.cargo ?? "",
    setor: initial?.setor ?? "",
    data_admissao: initial?.data_admissao ?? "",
    turno: initial?.turno ?? "Manhã",
    status_ativo: initial?.status_ativo ?? true,
    supervisor: initial?.supervisor ?? "",
    banco_horas: initial?.banco_horas ?? 0,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, banco_horas: Number(form.banco_horas) };
    const { error } = initial
      ? await supabase.from("funcionarios").update(payload).eq("id", initial.id)
      : await supabase.from("funcionarios").insert(payload);
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
        <Field label="CPF" value={form.cpf} onChange={set("cpf")} required />
        <Field label="RE" value={form.re} onChange={set("re")} required />
        <Field label="Cargo" value={form.cargo} onChange={set("cargo")} required />
        <Field label="Setor" value={form.setor} onChange={set("setor")} required />
        <Field label="Data de admissão" type="date" value={form.data_admissao} onChange={set("data_admissao")} required />
        <SelectField label="Turno" value={form.turno} onChange={set("turno")} options={["Manhã", "Tarde", "Noite", "Integral"]} />
        <Field label="Supervisor" value={form.supervisor} onChange={set("supervisor")} />
        <Field label="Banco de horas (h)" type="number" step="0.5" value={form.banco_horas} onChange={set("banco_horas")} />
        <SelectField label="Status" value={String(form.status_ativo)} onChange={(e) => setForm({ ...form, status_ativo: e.target.value === "true" })} options={[{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }]} />
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
