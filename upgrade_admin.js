const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://orinexzkgxdgpknzgzxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaW5leHprZ3hkZ3BrbnpnenhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY3NDIyMCwiZXhwIjoyMTA1MjUwMjIwfQ.Wn6VBGfOF1dwp7w4MzuxbnBjm1JgO2EIkdsOV0Zl9_E';

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
