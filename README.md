# Vistorias PWA

Scaffold inicial (MVP) do app de vistorias — PWA offline-first com sincronização via outbox.

Como usar localmente:

1. Instalar dependências:

   npm install

2. Defina variáveis de ambiente em `.env.local` (opcional para dev):

   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

3. Rodar em modo desenvolvimento:

   npm run dev

O app usa IndexedDB (via Dexie) para armazenar dados localmente e uma tabela `outbox` para filas de sincronização.

Próximos passos após este scaffold:
- Provisionar um projeto Supabase e configurar Storage + Auth + Postgres
- Implementar endpoints de API que processem a fila (outbox)
- Adicionar autenticação, fluxos de roles e políticas RLS

