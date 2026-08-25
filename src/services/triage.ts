import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const triageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: 'The classified intent of the user.',
      enum: ['SALES', 'SUPPORT', 'OTHER']
    },
    reasoning: {
      type: Type.STRING,
      description: 'Brief explanation of why this intent was chosen.'
    }
  },
  required: ['intent', 'reasoning']
};

export const triageService = {
  async classifyMessage(text: string, history: any[] = []): Promise<'SALES' | 'SUPPORT' | 'OTHER'> {
    try {
      const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');
      const prompt = `
Você é o Gerente de Recepção de uma empresa.
Sua única função é ler a mensagem do cliente e classificar a intenção dele para direcionar ao departamento correto.

Categorias disponíveis:
- SALES: O cliente quer comprar algo, está perguntando sobre produtos, preços, orçamentos, ou mostrando interesse comercial.
- SUPPORT: O cliente já comprou ou está com problemas, dúvidas técnicas, reclamações, ou precisa de assistência com algo existente.
- OTHER: Assuntos não relacionados a vendas ou suporte (ex: spam, currículos, fornecedores oferecendo serviços).

Histórico recente da conversa:
${historyText || 'Nenhum histórico.'}

Mensagem atual do cliente:
"${text}"

Responda em formato JSON classificando a intenção.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: triageSchema,
          temperature: 0.1,
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        console.log(`[Gerente Triagem] Classificou como ${result.intent} | Motivo: ${result.reasoning}`);
        return result.intent as 'SALES' | 'SUPPORT' | 'OTHER';
      }
      
      return 'SALES';
    } catch (error) {
      console.error('❌ Erro na classificação de triagem:', error);
      return 'SALES'; // Fallback
    }
  }
};
