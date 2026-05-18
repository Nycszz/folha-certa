## Plano de execução

Reset total da base + reformulação do sistema. Vou fazer em uma migração única + atualizações de código.

### 1. Banco de dados (migração)

**Reset:**
- `DELETE` em `ft_historico`, `ft`, `funcionarios`, `user_roles`, `profiles`
- Remover todos os usuários de `auth.users`

**Schema:**
- Novo enum `app_role`: `gestor`, `apontamento`, `supervisor` (substitui admin/gestor/rh)
- `profiles`: adicionar `username TEXT UNIQUE NOT NULL`, `ativo BOOLEAN DEFAULT true`
- `funcionarios`:
  - Substituir `status_ativo` booleano por `status TEXT` (`ativo` | `ferias`)
  - `cargo` passa a ser enum/check com 6 valores fixos
  - Adicionar coluna gerada `valor_folga NUMERIC` derivada do cargo
- `ft`:
  - Novo campo `posto_falta TEXT`
  - Novo campo `valor_pago NUMERIC` (snapshot do valor na hora do lançamento)

**Regras (triggers):**
- Trigger BEFORE INSERT em `ft` que conta movimentações do mês corrente para o `funcionario_id` (quem cobre) e bloqueia se >=4
- Trigger BEFORE INSERT em `ft` que verifica se `funcionario_id` (quem cobre) está `ferias` e exige role `gestor` do `lancado_por`
- Trigger que preenche `valor_pago` automaticamente a partir do cargo do funcionário que cobre
- Remover trigger `handle_new_user` (não há mais self-signup)

**Seed:**
- Criar usuário `admin` com email sintético `admin@interno.local` e senha `Ab783514`, role `gestor`

**RLS atualizada por role:**
- Gestor: tudo
- Apontamento: SELECT em tudo; nenhum INSERT em `ft`
- Supervisor: INSERT em `ft`; SELECT só em `funcionarios` (para escolher); nada em ft_historico/aprovações

### 2. Frontend

**Auth (`src/lib/auth.tsx`, `src/routes/login.tsx`):**
- Login só com `username` + senha → converte para `${username}@interno.local` antes de chamar Supabase
- Remover `signUp`, deletar `src/routes/cadastro.tsx`
- `useAuth` expõe `role: 'gestor' | 'apontamento' | 'supervisor'`

**Menu (`AppLayout.tsx`):**
- Filtra itens por role:
  - Gestor: todos
  - Apontamento: Movimentações, Relatórios, Histórico, Funcionários (read-only)
  - Supervisor: só "Nova Movimentação"

**Proteção de rotas:**
- Cada `_app.*.tsx` valida role no `beforeLoad` (redirect se não autorizado)

**Funcionário form (`FuncionarioForm.tsx`):**
- `posto_servico` → mantido como texto livre OU removido (não fica claro no spec — vou manter)
- `cargo` vira `<select>` com 6 opções fixas
- Mostrar o valor da folga ao lado do cargo selecionado
- Campo `status`: Ativo / De férias

**Nova movimentação (`_app.ft.novo.tsx`):**
- Adicionar campo `posto_falta` (texto livre)
- Exibir valor calculado automaticamente (read-only) baseado no cargo do funcionário cobrindo
- Tratar erros do trigger (limite mensal, férias) com toast claro

**Dashboard / Relatórios / Histórico:**
- Exibir `valor_pago` em cada linha
- Card "Total a pagar no mês" no dashboard
- Relatórios: filtros por nome e data; export CSV com coluna de valor + total

**Tela admin de usuários (`_app.usuarios.tsx`, só Gestor):**
- Lista de usuários (username, role, ativo)
- Criar (username, senha, role) → server function que usa `supabaseAdmin.auth.admin.createUser` + insere em `profiles` + `user_roles`
- Editar role / desativar (atualiza `profiles.ativo`; bloqueio de login lê esse flag)
- Reset de senha

**Importação CSV (`_app.funcionarios.import.tsx`):**
- Upload CSV (papaparse já fácil, ou parse manual)
- Colunas: `nome,re,cargo,posto_servico,supervisor,turno,usa_banco_horas,status`
- Validação por linha; preview antes de confirmar
- Insert em lote via server function (suporta 900+ sem problema)
- Relatório de sucessos/erros

### 3. Detalhes técnicos

- Server functions para operações admin (criar usuário, importar CSV) usando `requireSupabaseAuth` + checagem `has_role(uid, 'gestor')` + `supabaseAdmin`
- Excel "organizado": vou usar CSV (mais simples e o usuário escolheu CSV no input); se quiser .xlsx depois eu adiciono
- Manter logo, layout, design tokens existentes

### 4. Itens que NÃO vou mudar

- Lógica de aprovação/negação (mantida)
- Estrutura visual (só adiciona telas)
- Nome do sistema continua "Movimentação Operacional" (o "Folha Certa" no pedido parece referência genérica; me avise se quer renomear)

Posso seguir?