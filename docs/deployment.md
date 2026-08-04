# Publicação

Cloudflare Pages: build `pnpm build`, saída `dist`, Node 20+. Configure as duas variáveis `VITE_SUPABASE_*` no painel e mantenha ambientes Preview/Production separados. O Supabase deve ser criado e ligado antes do deploy funcional; aplique migrações, confirme RLS e execute advisors. Não existe servidor Node permanente.

Antes da primeira publicação, adicione o fallback SPA suportado pela configuração actual do Pages e configure os URLs de redireccionamento do Supabase Auth para os domínios de preview e produção.
