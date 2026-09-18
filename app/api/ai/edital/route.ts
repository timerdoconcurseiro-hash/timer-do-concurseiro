import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { syllabusText, pdfBase64 } = await request.json();

    if (!syllabusText && !pdfBase64) {
      return NextResponse.json({ error: 'Nenhum texto ou PDF enviado.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    Retorne EXATAMENTE um objeto JSON com o seguinte formato, sem formatação markdown em volta:
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

    // Para o Gemini, o primeiro argumento pode ser um array combinando texto e dados inline
    const result = await model.generateContent([prompt, ...parts]);
    const responseText = result.response.text();
    
    // Limpar markdown code blocks se o modelo retornar
    let cleanJson = responseText.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Erro ao gerar edital:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar com IA.' }, { status: 500 });
  }
}
