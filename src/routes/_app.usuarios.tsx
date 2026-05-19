import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { listUsers, createUser, setUserActive, updateUserRole, resetUserPassword } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Plus, Power, Key, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_app/usuarios")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: UsuariosPage,
});

type Row = { id: string; username: string | null; nome: string; email: string; ativo: boolean; role: string | null };

function UsuariosPage() {
  const { isGestor } = useAuth();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const setActive = useServerFn(setUserActive);
  const updateRole = useServerFn(updateUserRole);
  const resetPwd = useServerFn(resetUserPassword);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: "", nome: "", password: "", role: "apontamento" as "gestor" | "apontamento" | "supervisor" });

  async function reload() {
    setLoading(true);
    try {
      const data = await list();
      setRows(data as any);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isGestor) reload(); }, [isGestor]);

  if (!isGestor) {
    return <div className="text-sm text-muted-foreground">Acesso restrito ao Gestor.</div>;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await create({ data: form });
      toast.success(`Usuário ${form.username} criado`);
      setForm({ username: "", nome: "", password: "", role: "apontamento" });
      reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(r: Row) {
    try {
      await setActive({ data: { userId: r.id, ativo: !r.ativo } });
      toast.success(r.ativo ? "Desativado" : "Ativado");
      reload();
    } catch (e: any) { toast.error(e.message); }
  }

  async function changeRole(r: Row, role: string) {
    try {
      await updateRole({ data: { userId: r.id, role: role as any } });
      toast.success("Permissão alterada");
      reload();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleReset(r: Row) {
    const pwd = window.prompt(`Nova senha para ${r.username}:`);
    if (!pwd) return;
    try {
      await resetPwd({ data: { userId: r.id, password: pwd } });
      toast.success("Senha redefinida");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Usuários</h1>
        <p className="text-muted-foreground mt-1">Criação e gestão de acessos. Apenas o Gestor pode operar esta tela.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-card border border-oak-light rounded-3xl p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <Field label="Usuário"><input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inp} placeholder="ex: joao.silva" /></Field>
        <Field label="Nome"><input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inp} /></Field>
        <Field label="Senha"><input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inp} /></Field>
        <Field label="Permissão">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className={inp}>
            <option value="gestor">Gestor</option>
            <option value="apontamento">Apontamento</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </Field>
        <div className="flex items-end">
          <button disabled={creating} type="submit" className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-oak-dark text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Plus className="size-4" /> {creating ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </form>

      <div className="bg-card border border-oak-light rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhum usuário cadastrado.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-sand/30">
                <Th>Usuário</Th><Th>Nome</Th><Th>Permissão</Th><Th>Status</Th><Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oak-light">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 text-sm font-medium">{r.username ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">{r.nome}</td>
                  <td className="px-6 py-4 text-sm">
                    <select value={r.role ?? ""} onChange={(e) => changeRole(r, e.target.value)} className="px-3 py-1.5 bg-sand rounded-lg text-xs">
                      <option value="gestor">Gestor</option>
                      <option value="apontamento">Apontamento</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`px-2 py-1 rounded-full ${r.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {r.ativo ? "Ativo" : "Desativado"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button onClick={() => toggleActive(r)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sand rounded-lg text-xs hover:bg-oak-medium"><Power className="size-3" />{r.ativo ? "Desativar" : "Ativar"}</button>
                    <button onClick={() => handleReset(r)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sand rounded-lg text-xs hover:bg-oak-medium"><Key className="size-3" />Senha</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inp = "w-full px-4 py-2.5 bg-sand rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-oak-dark/20";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">{label}</label><div className="mt-2">{children}</div></div>;
}
function Th({ children }: { children: React.ReactNode }) { return <th className="px-6 py-4 text-[10px] font-bold text-oak-dark/50 uppercase tracking-widest">{children}</th>; }
