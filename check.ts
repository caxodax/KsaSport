import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: staff } = await supabase.from('staff').select('*').eq('cedula', '28466117');
  console.log("Staff record for 28466117:", staff);
  
  const { data: user } = await supabase.auth.admin.listUsers();
  const oscar = user.users.filter(u => u.email?.includes('oscar'));
  console.log("Oscar user records:", oscar.map(u => ({ id: u.id, email: u.email })));
}

main().catch(console.error);
