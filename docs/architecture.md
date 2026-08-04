# Arquitectura

SPA React/Vite no Cloudflare Pages, Supabase Auth e PostgreSQL como backend gerido. TanStack Query será a fronteira de acesso remoto. O módulo Excel é puro TypeScript: transforma ficheiros em pré-visualizações tipadas sem persistir dados. A confirmação futura chama uma operação transaccional no backend; nunca fará múltiplos inserts independentes pelo browser.

As funcionalidades estão separadas em `features`; utilitários reutilizáveis em `lib`; contratos em `types`; limites configuráveis em `config`. Componentes visuais são equivalentes ao padrão shadcn/ui, construídos com Tailwind e composição simples para evitar dependência de um gerador.
