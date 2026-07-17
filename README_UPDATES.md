Atualizações realizadas no scaffold:

- Implementado endpoint /api/upload para receber arquivos (base64) do cliente durante a sincronização e enviar ao Supabase Storage utilizando a service_role key no servidor.
- Atualizado lib/db.ts para armazenar blobs localmente em IndexedDB (fileBlobs) e processar uploads ao sincronizar; adicionada função addFileToOutbox(file, entityType, entityId).
- Adicionado lib/auth.ts e página de login (pages/login.tsx) para autenticação via Supabase no cliente.
- Adicionado componente RoleGate para renderização condicional por função (client-side; RLS/server checks ainda necessários).

Instruções rápidas:
- Para que upload e sincronização funcionem, defina SUPABASE_SERVICE_ROLE_KEY e SUPABASE_URL no .env.local (server) e NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY para o cliente.
- Em offline, adicione um arquivo com addFileToOutbox(file, entityType, entityId). O outbox process irá enviar o base64 para /api/upload ao sincronizar.

