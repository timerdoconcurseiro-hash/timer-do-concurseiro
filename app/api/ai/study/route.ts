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
      .select('ai_flashcard_count, plan')
      .eq('id', authData.user.id)
      .single();

    const maxFlashcards = 100; // Limite de 100 envios para gerar flashcards
    if (profile && profile.ai_flashcard_count >= maxFlashcards && profile.plan !== 'admin') {
      return NextResponse.json({ 
        error: `Limite atingido! Você já usou a Sala de Leitura ${maxFlashcards} vezes. Adquira mais créditos para continuar.` 
      }, { status: 403 });
    }

    const { textContext } = await request.json();

    if (!textContext || textContext.length < 50) {
      return NextResponse.json({ error: 'Texto muito curto para gerar flashcards.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API não configurada.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Você é um professor especialista em preparação para concursos públicos.
    O aluno enviou um trecho de material de estudo (lei seca, doutrina ou pdf).
    
    Faça duas coisas:
    1. Crie um resumo ultra-focado (bullet points) com os conceitos principais.
    2. Crie de 3 a 5 Flashcards (Pergunta e Resposta) cruciais sobre esse texto para que o aluno não esqueça.

    Retorne APENAS um objeto JSON válido, sem nenhum texto adicional, com este exato formato:
    {
      "summary": ["Ponto 1", "Ponto 2"],
      "flashcards": [
        { "question": "Qual é a regra geral de X?", "answer": "A regra geral é Y, conforme artigo Z." }
      ]
    }

    Texto do aluno:
    ${textContext}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Como usamos responseMimeType: "application/json", o texto retornado já é JSON puro.
    const parsedData = JSON.parse(responseText);

    // Incrementar contador de uso
    if (profile) {
      await supabase
        .from('profiles')
        .update({ ai_flashcard_count: (profile.ai_flashcard_count || 0) + 1 })
        .eq('id', authData.user.id);
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Erro na Sala de IA:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar.' }, { status: 500 });
  }
}
