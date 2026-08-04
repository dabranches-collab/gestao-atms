# Gestão de ATMs

Aplicação React para importar relatórios Excel mensais, validar a estrutura e analisar o desempenho de equipamentos ATM por cliente e período. A interface está em português e os dados apresentados antes da ligação ao Supabase são identificados como demonstração.

## Requisitos e instalação

- Node.js 20 ou superior e pnpm 10.
- Clone o repositório, execute `pnpm install`, copie `.env.example` para `.env.local` e preencha apenas as variáveis públicas do Supabase.
- Use `pnpm dev` para desenvolvimento, `pnpm test` para testes, `pnpm lint` para lint e `pnpm build` para produção.

Para sincronizar noutro computador: clone o mesmo repositório GitHub, crie um novo `.env.local` local e execute `pnpm install`. Nunca copie credenciais através do Git.

## Estado da primeira fase

Inclui layout responsivo, Visão geral, Equipamentos, Rankings, Importações e Definições; importador `.xlsx` local; detecção de referência/período/cliente; leitura de `INFO_REPORT`; validação das dez colunas; pré-visualização; testes unitários e esquema Supabase inicial. Persistência, autenticação visual e rankings reais ficam para a fase seguinte.

## Segurança e dados reservados

- Todas as tabelas expostas têm RLS. Apenas utilizadores autenticados consultam dados; `admin` e `analyst` podem iniciar importações.
- A autorização usa `app_metadata.role`, mantido pelo servidor. Nunca use `user_metadata` para autorização.
- O frontend aceita apenas a chave pública/publishable. Uma chave `service_role` nunca deve usar prefixo `VITE_` nem entrar no browser.
- Ficheiros reais estão excluídos por Git. Quando Storage for activado, use um bucket privado e políticas específicas.
- A pré-visualização é processada no browser. A gravação transaccional será implementada numa função segura na próxima fase.

### Acesso por utilizador e PIN

A interface usa um nome de utilizador e PIN de quatro algarismos; emails técnicos nunca são apresentados. A Edge Function `pin-login` converte essas credenciais numa sessão Supabase Auth, limita a conta após cinco falhas e regista tentativas. Configure `PIN_PEPPER` exclusivamente nos segredos das Edge Functions. Os acessos a BCI e BKEVE são atribuídos separadamente em `user_client_access`, e as políticas RLS filtram todas as tabelas pelo cliente autorizado.

## Supabase

A migração em `supabase/migrations` cria clientes, equipamentos, importações, métricas mensais, erros por linha, auditoria, índices e políticas RLS. Depois de criar e ligar um projecto Supabase, aplique as migrações com a versão actual da CLI e execute os advisors de segurança. Nenhum projecto remoto é criado nesta fase.

## Cloudflare Pages

Configure o comando de build como `pnpm build` e o directório de saída como `dist`. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como variáveis do projecto. Para React Router, configure fallback de SPA na publicação antes do primeiro deploy.

Consulte `docs/` para arquitectura, modelo de dados, processo de importação e publicação.
