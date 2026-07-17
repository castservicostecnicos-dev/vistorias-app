// get_token_env.js
// Lê valores de process.env para não deixar credenciais no arquivo

const SUPABASE_URL = process.env.SUPABASE_URL
const ANON_KEY = process.env.ANON_KEY
const EMAIL = process.env.EMAIL
const PASSWORD = process.env.PASSWORD

if (!SUPABASE_URL || !ANON_KEY || !EMAIL || !PASSWORD) {
  console.error('Faltando variáveis de ambiente. Defina SUPABASE_URL, ANON_KEY, EMAIL, PASSWORD.')
  process.exit(1)
}

async function run() {
  try {
    const params = new URLSearchParams()
    params.append('email', EMAIL)
    params.append('password', PASSWORD)

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const json = await res.json()
    if (!res.ok) {
      console.error('Erro da API:', json)
      process.exit(1)
    }

    console.log('access_token:', json.access_token)
    console.log('refresh_token:', json.refresh_token)
    console.log('user id:', json.user?.id)
  } catch (err) {
    console.error('Erro:', err)
  }
}

run()
