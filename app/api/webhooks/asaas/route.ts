import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializamos o Supabase com a chave ADMIN (Service Role) para podermos 
// alterar os dados de um usuário (o plano dele) pelo servidor, ignorando regras de segurança do cliente.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Responde a testes de ping/validação via GET
export async function GET() {
  return NextResponse.json({ status: "Webhook is alive" }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      // Se o Asaas mandar um payload vazio (apenas para testar a URL)
      return NextResponse.json({ status: "Webhook test received" }, { status: 200 });
    }

    // Se for só um teste de ping da interface do Asaas
    if (!body || !body.event) {
      return NextResponse.json({ status: "Webhook test received" }, { status: 200 });
    }

    // O Asaas manda o tipo de evento (ex: PAYMENT_RECEIVED ou PAYMENT_CONFIRMED)
    const { event, payment } = body;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      
      // Log massivo para depuração: ver o que o Asaas realmente mandou
      console.log("[Webhook Asaas Payload Completo]:", JSON.stringify(body, null, 2));

      // Tenta extrair o email de vários lugares possíveis do payload do Asaas
      const customerEmail = payment.customerEmail 
                         || payment.email 
                         || body.customer?.email 
                         || payment.customer?.email;

      if (!customerEmail || typeof customerEmail !== 'string' || customerEmail === "email-do-cliente-no-asaas@gmail.com") {
        console.error('[Erro Asaas Webhook] O Asaas não enviou o email do cliente no payload!', payment);
        return NextResponse.json({ error: 'Email missing from Asaas payload' }, { status: 400 });
      }

      console.log(`[Webhook Asaas] Pagamento confirmado para o email extraído: ${customerEmail}`);

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
