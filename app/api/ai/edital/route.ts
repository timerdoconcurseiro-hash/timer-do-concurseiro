import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData.user) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
    }

    // Verificar limites do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_edital_count, plan')
      .eq('id', authData.user.id)
      .single();

    const maxEditais = 5; // Limite de 5 editais gerados por IA
    if (profile && profile.ai_edital_count >= maxEditais && profile.plan !== 'admin') {
      return NextResponse.json({ 
        error: `Limite atingido! Você já gerou ${maxEditais} editais com a Inteligência Artificial. Adquira mais créditos para continuar.` 
      }, { status: 403 });
    }

    const { syllabusText, pdfBase64 } = await request.json();

    if (!syllabusText && !pdfBase64) {
      return NextResponse.json({ error: 'Nenhum texto ou PDF enviado.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: { responseMimeType: "application/json" }
    });

    let parts: any[] = [];

    if (pdfBase64) {
      parts.push({
        inlineData: {
          data: pdfBase64,
          mimeType: "application/pdf"
        }
      });
      parts.push({
        text: "Extraia o conteúdo programático do edital contido neste PDF."
      });
    } else {
      parts.push({
        text: `Texto do edital:\n${syllabusText}`
      });
    }

    const prompt = `
    Você é um especialista em concursos públicos. O usuário enviou o "Conteúdo Programático" de um edital em anexo ou texto.
    Sua tarefa é fatiar esse conteúdo em Disciplinas (Subjects) e seus respectivos Tópicos (Topics).
    Além disso, faça uma estimativa de quantas horas líquidas um aluno médio precisaria para estudar cada Disciplina inteira.

    Importante: Utilize "Prática Intercalada" (Interleaving). Nunca sugira blocos repetidos da mesma disciplina em sequência no mesmo dia. Force a aplicação da regra 80/20 e intercalação de matérias para maximizar a retenção. Na estrutura de Tópicos gerada, caso necessário, distribua de forma que a IA ou o sistema possam intercalá-los adequadamente.

    Retorne APENAS um objeto JSON válido, sem texto adicional, no seguinte formato:
    {
      "subjects": [
        {
          "name": "Língua Portuguesa",
          "target_hours": 40,
          "topics": [
            "Compreensão e interpretação de textos",
            "Tipologia textual",
            "Ortografia oficial"
          ]
        }
      ]
    }
    `;

    const result = await model.generateContent([prompt, ...parts]);
    const responseText = result.response.text();
    
    // JSON puro graças ao responseMimeType
    const parsedData = JSON.parse(responseText);

    // Incrementar o contador de uso
    if (profile) {
      await supabase
        .from('profiles')
        .update({ ai_edital_count: (profile.ai_edital_count || 0) + 1 })
        .eq('id', authData.user.id);
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Erro ao gerar edital:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar com IA.' }, { status: 500 });
  }
}
