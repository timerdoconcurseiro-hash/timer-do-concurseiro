import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { textContext } = await request.json();

    if (!textContext || textContext.length < 50) {
      return NextResponse.json({ error: 'Texto muito curto para gerar flashcards.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API não configurada.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
    Você é um professor especialista em preparação para concursos públicos.
    O aluno enviou um trecho de material de estudo (lei seca, doutrina ou pdf).
    
    Faça duas coisas:
    1. Crie um resumo ultra-focado (bullet points) com os conceitos principais.
    2. Crie de 3 a 5 Flashcards (Pergunta e Resposta) cruciais sobre esse texto para que o aluno não esqueça.

    Retorne EXATAMENTE um objeto JSON com este formato (sem blocos markdown \`\`\`json):
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
    
    let cleanJson = responseText.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Erro na Sala de IA:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar.' }, { status: 500 });
  }
}
