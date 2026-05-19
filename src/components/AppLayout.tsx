import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/auth";
import { LayoutDashboard, Users, ClipboardList, CheckCircle2, FileBarChart, History, LogOut, ShieldCheck, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import logoGrupoMc from "@/assets/logo-grupo-mc.png";

type NavItem = { to: string; label: string; icon: any; roles: Role[] };

const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["gestor"] },
  { to: "/funcionarios", label: "Funcionários", icon: Users, roles: ["gestor", "apontamento"] },
  { to: "/ft", label: "Movimentações", icon: ClipboardList, roles: ["gestor", "apontamento"] },
  { to: "/ft/novo", label: "Nova movimentação", icon: ClipboardList, roles: ["supervisor"] },
  { to: "/aprovacoes", label: "Aprovações", icon: CheckCircle2, roles: ["gestor"] },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart, roles: ["gestor", "apontamento"] },
  { to: "/historico", label: "Histórico", icon: History, roles: ["gestor", "apontamento"] },
  { to: "/usuarios", label: "Usuários", icon: ShieldCheck, roles: ["gestor"] },
  { to: "/auditoria", label: "Auditoria", icon: ScrollText, roles: ["gestor"] },
];

const roleLabel: Record<Role, string> = {
  gestor: "Gestor",
  apontamento: "Apontamento",
  supervisor: "Supervisor",
};

export function AppLayout() {
  const { user, signOut, role, username } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const allowed = nav.filter((n) => !role || n.roles.includes(role));

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="w-72 bg-oak-light border-r border-oak-medium flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <img src={logoGrupoMc} alt="Grupo MC" className="size-12 object-contain shrink-0" />
            <div>
              <div className="text-lg font-medium tracking-tight">Movimentação</div>
              <div className="text-[10px] text-oak-dark/60 uppercase tracking-widest">Operacional</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="pb-3 px-4 text-[10px] font-bold text-oak-dark/60 uppercase tracking-[0.2em]">Menu</div>
          {allowed.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors",
                  active ? "bg-card text-oak-dark shadow-sm" : "text-oak-dark/70 hover:bg-card/50"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 space-y-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-oak-dark/70 hover:text-oak-dark transition-colors"
          >
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-oak-light flex items-center justify-between px-10 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{username ?? user?.email}</p>
              <p className="text-xs text-oak-dark/60 uppercase tracking-wider">
                {role ? roleLabel[role] : ""}
              </p>
            </div>
            <div className="size-10 rounded-full bg-oak-medium flex items-center justify-center text-oak-dark font-semibold">
              {(username ?? user?.email ?? "U")[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
