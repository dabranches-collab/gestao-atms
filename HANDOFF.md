# Handoff — Gestão de ATMs

Última actualização: 4 de Agosto de 2026

Branch principal: `main`

Repositório: https://github.com/dabranches-collab/gestao-atms

Produção: https://gestao-atms.dabranches.workers.dev

## Como continuar noutro computador

```bash
git clone https://github.com/dabranches-collab/gestao-atms.git
cd gestao-atms
corepack enable
pnpm install --frozen-lockfile
copy .env.example .env.local
pnpm dev
```

Preencher `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Os valores estão no painel Supabase/Cloudflare e nunca devem ser enviados para Git. Validar antes de publicar:

```bash
pnpm test
pnpm lint
pnpm build
```

Um `push` para `main` inicia automaticamente o build e deploy do Worker na Cloudflare.

## Serviços ligados

- GitHub: organização `dabranches-collab`, repositório `gestao-atms`.
- Supabase project ref: `nygeveyaprqbzlqrdgys`.
- Supabase dashboard: https://supabase.com/dashboard/project/nygeveyaprqbzlqrdgys
- Cloudflare account: `47157887c84f8b8bf7986404f4a1a0a8`.
- Worker: `gestao-atms`.
- Produção: https://gestao-atms.dabranches.workers.dev

## Estado funcional

- Login com nome de utilizador e PIN de quatro algarismos.
- Utilizador `dabranches` com perfil `admin` e acesso a BCI e BKEVE.
- O PIN não está documentado nem guardado no repositório. Se for necessário repor acesso, fazê-lo no Supabase sem introduzir segredos no código.
- Troca obrigatória do PIN inicial suportada por `change-pin`.
- Cinco falhas bloqueiam temporariamente a conta durante 15 minutos.
- Espaços separados por cliente: `/clientes/BCI/*` e `/clientes/BKEVE/*`.
- Lista de clientes e dashboard consolidado com navegação global e logout.
- Visão geral, Equipamentos, Rankings, Importações e Definições.
- Rankings redesenhados como infografia: 10 perspectivas com 10 ATMs cada, barras, áreas, donuts e blocos bento.
- Importador local de Excel com detecção de cliente/período, validação e pré-visualização.

## Dados e métricas

As colunas previstas são:

1. Número de transacções.
2. Montante de transacções.
3. Número de dias com transacções.
4. Número de abastecimentos.
5. Montante de abastecimentos.
6. Montante dispensado.
7. Montante recolhido.
8. Down-time por falta de notas.

Os ficheiros reais de origem não estão no Git. As folhas BCI e BKEVE foram fornecidas como anexos/ficheiros temporários na sessão original.

## Arquitectura relevante

- `src/App.tsx`: aplicação e protótipos visuais actuais.
- `src/config/metrics.ts`: catálogo e formatação de métricas.
- `src/lib/excel/importer.ts`: leitura e validação dos Excel.
- `src/lib/supabase/client.ts`: cliente público Supabase.
- `supabase/functions/pin-login/index.ts`: autenticação por utilizador/PIN.
- `supabase/functions/change-pin/index.ts`: alteração autenticada do PIN.
- `supabase/migrations/`: esquema, RLS, clientes e controlo de acessos.
- `tests/`: testes do importador e métricas.
- `wrangler.jsonc`: publicação Cloudflare Workers com assets Vite.

Stack: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Supabase e Cloudflare Workers.

## Supabase remoto

- Migrações iniciais, isolamento por cliente e índices já foram aplicados.
- Edge Functions `pin-login` e `change-pin` estão activas com `verify_jwt=false`; ambas fazem validação própria no corpo.
- `PIN_PEPPER` está configurado exclusivamente como segredo remoto das Edge Functions.
- Nunca criar uma variável `VITE_` com chave administrativa ou `PIN_PEPPER`.
- As políticas RLS usam `app_metadata.role` e `user_client_access`.

## Limitações conhecidas

- Os dashboards, rankings e comparações ainda usam dados demonstrativos dentro de `src/App.tsx`.
- A pré-visualização Excel ainda não grava importações na base de dados.
- Não existe ainda uma rota protegida global; algumas páginas podem ser abertas directamente sem sessão.
- O nome/avatar “Diogo Almeida / Analista” no cabeçalho ainda está fixo no frontend e deve vir do perfil autenticado.
- O catálogo visual de clientes está fixo em BCI/BKEVE; deve passar a ser lido de `clients` e `user_client_access`.
- O bundle principal ultrapassa 1 MB antes de gzip por causa da página única e Recharts. Convém dividir rotas com `lazy()`/`Suspense`.
- O dashboard consolidado ainda soma valores fictícios.

## Próximas prioridades recomendadas

1. Criar um `AuthGuard` e impedir acesso directo sem sessão.
2. Ler perfil e clientes autorizados do Supabase; remover nomes e clientes fixos.
3. Implementar importação transaccional: upload, validação no servidor, gravação e auditoria.
4. Substituir todos os arrays demonstrativos por consultas de métricas mensais.
5. Tornar rankings e dashboard consolidados configuráveis por métrica e período.
6. Criar gestão administrativa de utilizadores, PIN inicial e acesso por cliente.
7. Dividir o bundle por rotas e adicionar testes de autenticação/navegação.

## Regras para não quebrar o projecto

- Não guardar PINs, `PIN_PEPPER`, secret keys, service-role keys ou ficheiros Excel reais no Git.
- Preservar isolamento por `client_id` em todas as consultas e escritas.
- Antes de alterar Auth/RLS, consultar documentação Supabase actual e executar os advisors.
- Antes de alterar Worker/deploy, consultar documentação Cloudflare/Wrangler actual.
- Publicar apenas depois de `pnpm test`, `pnpm lint` e `pnpm build` passarem.
