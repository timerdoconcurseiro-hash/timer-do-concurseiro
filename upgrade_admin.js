const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
  const email = 'portela.alb@gmail.com';
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ plan: 'premium' })
    .eq('email', email);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success: Updated', email, 'to premium.');
  }
}

makeAdmin();
