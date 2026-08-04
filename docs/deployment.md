# Publicação

Cloudflare Workers Static Assets: build `pnpm build`, deploy `pnpm wrangler deploy`, saída `dist`, Node 20+. O `wrangler.jsonc` activa fallback de SPA. Configure as duas variáveis `VITE_SUPABASE_*` como variáveis de build e mantenha Preview/Production separados. O Supabase deve ser ligado antes do acesso a dados reais; aplique migrações, confirme RLS e execute advisors. Não existe servidor Node permanente.

Antes da primeira publicação, adicione o fallback SPA suportado pela configuração actual do Pages e configure os URLs de redireccionamento do Supabase Auth para os domínios de preview e produção.
