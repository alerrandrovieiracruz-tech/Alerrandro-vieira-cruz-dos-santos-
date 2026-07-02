import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiEnabled: !!ai });
  });

  // API endpoint for financial advisor analysis & chat
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ 
          error: "API Gemini não configurada no servidor. Por favor, adicione GEMINI_API_KEY aos segredos do aplicativo." 
        });
      }

      const { 
        revenues = [], 
        expenses = [], 
        savingsHistory = [], 
        chatMessage = "", 
        chatHistory = [] 
      } = req.body;

      // Prepare rich profile content for the model prompt
      const totalRevenues = revenues.reduce((acc: number, item: any) => acc + (parseFloat(item.value) || 0), 0);
      const totalExpenses = expenses.reduce((acc: number, item: any) => acc + (parseFloat(item.value) || 0), 0);
      const netProfit = totalRevenues - totalExpenses;

      const revenuesStr = revenues.map((r: any) => `- [Receita] ${r.description}: R$ ${r.value} (${r.category})`).join("\n");
      const expensesStr = expenses.map((e: any) => `- [Despesa] ${e.description}: R$ ${e.value} (${e.category})`).join("\n");
      const savingsStr = savingsHistory.map((s: any) => `- [Economia/Desafio] ${s.challengeTitle}: R$ ${s.value} em ${new Date(s.date).toLocaleDateString('pt-BR')}`).join("\n");

      const systemPrompt = `Você é um Consultor Financeiro Inteligente de elite e especialista em administração de negócios.
Sua tarefa é analisar o perfil financeiro do usuário e retornar uma análise minuciosa estruturada estritamente em formato JSON de acordo com o esquema solicitado.

--- PERFIL FINANCEIRO DO USUÁRIO ---
- Receitas Totais: R$ ${totalRevenues}
- Despesas Totais: R$ ${totalExpenses}
- Lucro Líquido Atual: R$ ${netProfit}

Lançamentos de Receitas:
${revenuesStr || "Nenhuma receita registrada."}

Lançamentos de Despesas:
${expensesStr || "Nenhuma despesa registrada."}

Histórico de Poupança/Cofres:
${savingsStr || "Nenhuma poupança recente registrada no cofre."}
----------------------------------

Instruções Adicionais de IA:
1. Calcule uma pontuação de saúde financeira (score) de 0 a 100 baseado na proporção de lucros, quantidade de economias e controle de gastos.
2. Agrupe as despesas por categorias principais e retorne a porcentagem correspondente de cada uma.
3. Identifique pelo menos 1 ou 2 gastos supérfluos ou passíveis de corte (wasteIdentified) com dicas práticas de como economizar.
4. Crie metas financeiras inteligentes e realistas (Smart Goals) com plano de ação e cronograma.
5. Faça uma previsão realista do saldo para os próximos 3 meses (balanceForecast) baseando-se no comportamento atual.
6. Forneça alertas de riscos importantes (riskAlerts) se houver risco de prejuízo ou falta de fluxo de caixa (ex: se despesas > 80% das receitas).
7. Responda diretamente ao chatMessage enviado pelo usuário com empatia, clareza e autoridade profissional de consultoria. Se não houver mensagem no chatMessage, dê uma visão geral inicial acolhedora com insights valiosos.
`;

      const contents = [];
      
      // Inject previous chat history context if available to maintain conversation flow
      if (chatHistory && chatHistory.length > 0) {
        chatHistory.slice(-6).forEach((msg: any) => {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });
      }

      // Add current message / analysis request
      contents.push({
        role: 'user',
        parts: [{ text: chatMessage || "Por favor, realize a análise financeira completa do meu negócio baseado nos meus dados fornecidos." }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { 
                type: Type.INTEGER, 
                description: "Pontuação geral de saúde financeira do negócio ou pessoal, de 0 a 100." 
              },
              scoreExplanation: { 
                type: Type.STRING, 
                description: "Breve explicação personalizada sobre o porquê desta pontuação." 
              },
              profit: { 
                type: Type.NUMBER, 
                description: "Lucro ou saldo líquido atual calculado." 
              },
              expensesByCategory: {
                type: Type.ARRAY,
                description: "Lista de despesas agregadas por categorias.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: "Nome da categoria." },
                    amount: { type: Type.NUMBER, description: "Valor total nessa categoria." },
                    percentage: { type: Type.NUMBER, description: "Percentual do total de gastos (0-100)." }
                  },
                  required: ["category", "amount", "percentage"]
                }
              },
              wasteIdentified: {
                type: Type.ARRAY,
                description: "Identificação de gastos desnecessários e desperdícios.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING, description: "Nome ou tipo do item supérfluo." },
                    currentCost: { type: Type.NUMBER, description: "Custo atual estimado ou registrado." },
                    estimatedSaving: { type: Type.NUMBER, description: "Economia mensal potencial aproximada." },
                    reasoning: { type: Type.STRING, description: "Explicação lógica de por que reduzir e como fazer." }
                  },
                  required: ["item", "currentCost", "estimatedSaving", "reasoning"]
                }
              },
              savingsOpportunities: {
                type: Type.ARRAY,
                description: "Lista de áreas ou métodos onde o usuário pode poupar dinheiro.",
                items: { type: Type.STRING }
              },
              smartGoals: {
                type: Type.ARRAY,
                description: "Recomendações de metas inteligentes adicionais para o usuário.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    goal: { type: Type.STRING, description: "Título da meta sugerida." },
                    actionPlan: { type: Type.STRING, description: "Plano de ação passo-a-passo." },
                    timeline: { type: Type.STRING, description: "Prazo sugerido para execução (ex: 30 dias)." }
                  },
                  required: ["goal", "actionPlan", "timeline"]
                }
              },
              balanceForecast: {
                type: Type.ARRAY,
                description: "Previsão de saldo mensal para os próximos 3 meses.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    month: { type: Type.STRING, description: "Nome do mês (ex: Julho, Agosto, Setembro)." },
                    estimatedBalance: { type: Type.NUMBER, description: "Saldo final projetado acumulado." },
                    trend: { type: Type.STRING, description: "Direção do saldo: 'up', 'down' ou 'stable'." }
                  },
                  required: ["month", "estimatedBalance", "trend"]
                }
              },
              riskAlerts: {
                type: Type.ARRAY,
                description: "Alertas críticos de fluxo de caixa, prejuízo ou comportamento inadequado.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    severity: { type: Type.STRING, description: "Gravidade: 'high', 'medium' ou 'low'." },
                    title: { type: Type.STRING, description: "Título do alerta." },
                    description: { type: Type.STRING, description: "Explicação do risco e como se prevenir." }
                  },
                  required: ["severity", "title", "description"]
                }
              },
              businessTips: {
                type: Type.ARRAY,
                description: "Dicas de gestão personalizadas de alto nível para melhorar a administração do negócio.",
                items: { type: Type.STRING }
              },
              chatResponse: {
                type: Type.STRING,
                description: "Sua resposta direta, simpática e profissional em linguagem simples para o usuário. Deve responder à pergunta enviada em chatMessage de forma completa e explicativa."
              }
            },
            required: [
              "score", 
              "scoreExplanation", 
              "profit", 
              "expensesByCategory", 
              "wasteIdentified", 
              "savingsOpportunities", 
              "smartGoals", 
              "balanceForecast", 
              "riskAlerts", 
              "businessTips", 
              "chatResponse"
            ]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText);
      res.json(parsedData);

    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ 
        error: "Erro ao processar análise inteligente no servidor.", 
        details: error?.message || error 
      });
    }
  });

  // Vite middleware for development / SPA server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
