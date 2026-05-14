import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import logoGrupoMc from "@/assets/logo-grupo-mc.png";

export const Route = createFileRoute("/cadastro")({
  component: CadastroPage,
});

function CadastroPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, nome);
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Conta criada!");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src={logoGrupoMc} alt="Grupo MC" className="mx-auto size-20 object-contain mb-4" />
          <h1 className="text-3xl font-light tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-2">Acesso à Movimentação Operacional</p>
        </div>

        <div className="bg-card border border-oak-light rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Nome completo" value={nome} onChange={setNome} type="text" required />
            <Field label="Email" value={email} onChange={setEmail} type="email" required />
            <Field label="Senha" value={password} onChange={setPassword} type="password" required minLength={6} />
            <button type="submit" disabled={loading} className="w-full bg-oak-dark text-primary-foreground py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Criando..." : "Criar conta"}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Já tem conta? <Link to="/login" className="text-oak-dark font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, required, minLength }: { label: string; value: string; onChange: (v: string) => void; type: string; required?: boolean; minLength?: number }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-4 py-3 bg-sand rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-oak-dark/20"
      />
    </div>
  );
}
