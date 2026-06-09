import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logoGrupoMc from "@/assets/logo-grupo-mc.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/");
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await signIn(username, password);
    if (signInError) {
      setLoading(false);
      setError("Usuário ou senha inválidos");
      toast.error("Usuário ou senha inválidos");
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setLoading(false);
      setError("Sessão não carregada. Tente novamente.");
      toast.error("Login validado, mas a sessão não foi carregada. Tente novamente.");
      return;
    }
    toast.success("Bem-vindo!");
    window.location.assign("/");
  };

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">

      {/* ── Painel de marca ──────────────────────────────────── */}
      <div className="relative md:w-[42%] bg-oak-dark flex flex-col items-center justify-center px-12 py-16 overflow-hidden shrink-0">

        {/* Elementos decorativos */}
        <div className="absolute -top-28 -left-28 size-96 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-36 -right-36 size-[28rem] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[520px] rounded-full border border-white/[0.07] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[320px] rounded-full border border-white/[0.06] pointer-events-none" />

        {/* Conteúdo */}
        <div className="relative z-10 text-center space-y-6">
          <img
            src={logoGrupoMc}
            alt="Grupo MC"
            className="mx-auto size-[72px] object-contain brightness-0 invert opacity-90"
          />
          <div>
            <h2 className="text-white/90 text-2xl font-light tracking-tight leading-snug">
              Gestão de
            </h2>
            <h2 className="text-white text-2xl font-semibold tracking-tight">
              Movimentações
            </h2>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-white/20" />
            <span className="text-white/40 text-[10px] tracking-widest uppercase">
              Acesso corporativo
            </span>
            <div className="h-px w-10 bg-white/20" />
          </div>
        </div>

        <p className="absolute bottom-6 left-0 right-0 text-center text-white/25 text-[10px] tracking-widest uppercase">
          Grupo MC © {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Painel do formulário ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-canvas px-6 py-16 md:px-16">
        <div className="w-full max-w-sm space-y-10">

          <div>
            <p className="text-[10px] font-bold text-oak-dark/40 uppercase tracking-widest mb-3">
              Bem-vindo
            </p>
            <h1 className="text-[2rem] font-light tracking-tight leading-none">
              Faça seu login
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Informe suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">
                Usuário
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full px-4 py-3.5 bg-sand rounded-2xl text-sm border border-transparent focus:outline-none focus:border-oak-medium focus:ring-2 focus:ring-oak-dark/10 transition-all placeholder:text-oak-dark/30"
                placeholder="seu usuário"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-oak-dark/60 uppercase tracking-widest">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full px-4 py-3.5 pr-12 bg-sand rounded-2xl text-sm border border-transparent focus:outline-none focus:border-oak-medium focus:ring-2 focus:ring-oak-dark/10 transition-all placeholder:text-oak-dark/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-oak-dark/35 hover:text-oak-dark/65 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl leading-relaxed">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 bg-oak-dark text-primary-foreground py-3.5 rounded-2xl text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Entrar"
              )}
            </button>

          </form>

        </div>
      </div>

    </div>
  );
}
