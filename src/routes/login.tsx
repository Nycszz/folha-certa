import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoGrupoMc from "@/assets/logo-grupo-mc.png";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Bem-vindo!");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src={logoGrupoMc} alt="Grupo MC" className="mx-auto size-20 object-contain mb-4" />
          <h1 className="text-3xl font-light tracking-tight">Movimentação Operacional</h1>
          <p className="text-sm text-muted-foreground mt-2">Sistema de gestão operacional</p>
        </div>

        <div className="bg-card border border-oak-light rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full px-4 py-3 bg-sand rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-oak-dark/20"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full px-4 py-3 bg-sand rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-oak-dark/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-oak-dark text-primary-foreground py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-oak-dark font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
