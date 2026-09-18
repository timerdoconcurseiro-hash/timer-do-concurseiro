import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { subject, topic } = await request.json();

    if (!subject) {
      return NextResponse.json({ error: "Matéria não informada." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Gemini não configurada." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Você é um professor especialista em concursos públicos.
O aluno acabou de estudar a matéria: "${subject}" e o tópico: "${topic || 'Geral'}".
Sua tarefa é gerar exatamente 3 flashcards rápidos, curtos e diretos sobre esse assunto para testar a memória imediata dele.
Retorne APENAS um array JSON válido, sem crases de markdown, no seguinte formato:
[
  { "front": "Pergunta do flashcard", "back": "Resposta curta e direta" },
  { "front": "Pergunta do flashcard", "back": "Resposta curta e direta" },
  { "front": "Pergunta do flashcard", "back": "Resposta curta e direta" }
]
Não inclua nenhuma outra palavra ou explicação. Apenas o JSON puro.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Remove as crases do markdown que o Gemini às vezes retorna mesmo pedindo pra não retornar
    const cleanedText = responseText.replace(/^```json\n?/, '').replace(/```$/, '').trim();

    const flashcards = JSON.parse(cleanedText);

    return NextResponse.json({ flashcards });

  } catch (error) {
    console.error("Erro ao gerar flashcards:", error);
    return NextResponse.json({ error: "Erro interno ao gerar flashcards." }, { status: 500 });
  }
}
