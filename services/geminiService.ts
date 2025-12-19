
import { GoogleGenAI } from "@google/genai";

// Guideline: Always use a named parameter for apiKey and obtain exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCommunication = async (
  topic: string,
  tone: 'formal' | 'urgent' | 'informative',
  details: string
): Promise<string> => {
  try {
    const prompt = `
      Você é um assistente virtual de um escritório de contabilidade.
      Escreva um comunicado para o cliente sobre o seguinte tópico: "${topic}".
      Tom de voz: ${tone}.
      Detalhes adicionais para incluir: ${details}.
      O texto deve ser profissional, claro e direto. Não inclua saudações genéricas como "Olá [Nome do Cliente]", comece o corpo do texto.
    `;

    // Guideline: Use 'gemini-3-flash-preview' for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || 'Não foi possível gerar o comunicado.';
  } catch (error) {
    console.error('Error generating communication:', error);
    return 'Erro ao gerar comunicado. Verifique sua chave de API.';
  }
};

export const analyzePendingIssues = async (clientData: string): Promise<string> => {
    try {
        const prompt = `
          Analise os seguintes dados fiscais resumidos e gere um breve insight sobre a saúde fiscal da empresa e possíveis pendências impeditivas de CND (Certidão Negativa de Débitos).
          Dados: ${clientData}
          Seja breve e técnico.
        `;
        // Guideline: Use 'gemini-3-flash-preview' for basic text tasks.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || 'Análise indisponível.';
    } catch (error) {
        return 'Erro na análise de pendências.';
    }
}
