import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertGestor, getActor, logAudit } from "./admin.server";

const RoleEnum = z.enum(["gestor", "apontamento", "supervisor"]);

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertGestor(context.supabase, context.userId);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, nome, email, ativo, created_at")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string>();
    (roles ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));
    return (profiles ?? []).map((p: any) => ({ ...p, role: roleMap.get(p.id) ?? null }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: z.string().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/),
      password: z.string().min(6).max(72),
      nome: z.string().min(1).max(120),
      role: RoleEnum,
    }).parse(input)
  )
  .handler(async ({ context, data }) => {
    await assertGestor(context.supabase, context.userId);
    const email = `${data.username.toLowerCase()}@interno.local`;

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username.toLowerCase(), nome: data.nome, role: data.role },
    });
    if (error) throw new Error(error.message);

    const uid = created.user!.id;
    await supabaseAdmin.from("profiles").upsert({ id: uid, nome: data.nome, email, username: data.username.toLowerCase(), ativo: true });
    await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: data.role }, { onConflict: "user_id,role" });

    const actor = await getActor(context.userId);
    await logAudit("CRIAR_USUARIO", "profiles", uid, `${actor.username ?? "?"} criou o usuário ${data.username} (${data.role})`, actor, {
      new_data: { username: data.username, nome: data.nome, role: data.role },
    });

    return { id: uid };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid(), ativo: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertGestor(context.supabase, context.userId);
    await supabaseAdmin.from("profiles").update({ ativo: data.ativo }).eq("id", data.userId);
    const actor = await getActor(context.userId);
    await logAudit(data.ativo ? "ATIVAR_USUARIO" : "DESATIVAR_USUARIO", "profiles", data.userId,
      `${actor.username ?? "?"} ${data.ativo ? "ativou" : "desativou"} o usuário ${data.userId}`, actor);
    return { ok: true };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid(), role: RoleEnum }).parse(input))
  .handler(async ({ context, data }) => {
    await assertGestor(context.supabase, context.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    const actor = await getActor(context.userId);
    await logAudit("ALTERAR_PERMISSAO", "user_roles", data.userId,
      `${actor.username ?? "?"} alterou a permissão do usuário ${data.userId} para ${data.role}`, actor, { new_data: { role: data.role } });
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid(), password: z.string().min(6).max(72) }).parse(input))
  .handler(async ({ context, data }) => {
    await assertGestor(context.supabase, context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    const actor = await getActor(context.userId);
    await logAudit("RESET_SENHA", "profiles", data.userId, `${actor.username ?? "?"} redefiniu a senha do usuário ${data.userId}`, actor);
    return { ok: true };
  });
