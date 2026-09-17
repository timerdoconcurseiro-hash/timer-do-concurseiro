import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializamos o Supabase com a chave ADMIN (Service Role) para podermos 
// alterar os dados de um usuário (o plano dele) pelo servidor, ignorando regras de segurança do cliente.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // O Asaas manda o tipo de evento (ex: PAYMENT_RECEIVED ou PAYMENT_CONFIRMED)
    const { event, payment } = body;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      
      // O Asaas possui um campo "externalReference" ou podemos buscar o email pelo ID do cliente no Asaas.
      // Supondo que no link de pagamento do Asaas, o "email" seja exigido e venha atrelado ao cliente.
      // (Em produção, o ideal é passar o ID do usuário (Supabase) no "externalReference" do Asaas).
      const customerEmail = payment.customerEmail || body.customer?.email || "email-do-cliente-no-asaas@gmail.com"; 

      console.log(`[Webhook Asaas] Pagamento confirmado para o email: ${customerEmail}`);

      // 1. Procurar o usuário pelo email na nossa tabela 'profiles'
      const { data: profile, error: searchError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (searchError || !profile) {
        console.error('Usuário não encontrado no banco de dados:', customerEmail);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 2. Mudar o plano dele para 'premium' (Liberação Imediata)
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ plan: 'premium' })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Erro ao atualizar plano para premium:', updateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`[Sucesso] Plano Premium liberado para ${customerEmail}!`);
      return NextResponse.json({ received: true, success: true });
    }

    // Se for outro tipo de evento (boleto gerado, vencido, etc), apenas ignoramos e damos 200 OK.
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Erro no processamento do Webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
