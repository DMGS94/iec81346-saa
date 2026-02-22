// api/chat.js — Vercel Serverless Function
// Esta função corre no servidor, a chave API nunca é exposta ao browser.

const SYSTEM_PROMPT = `És um assistente especializado em nomenclatura IEC 81346-2 para projetos de engenharia elétrica e automação industrial (EPLAN).

ESTRUTURA DA DESIGNAÇÃO:
- = aspeto FUNCIONAL (para que serve o sistema): ex. =CA1 (sistema de refrigeração 1)
- + aspeto de LOCALIZAÇÃO (onde está): ex. +Q1 (quadro 1)
- - aspeto de PRODUTO (qual é o componente): ex. -M1 (motor 1)
- Designação completa típica: =CA1+Q1-M1

LETRAS IDENTIFICADORAS (aspeto de produto -):
B: Sensores e detetores — temperatura (BTA/BTB), pressão (BPA/BPB), nível (BLA/BLB), fluxo (BFA/BFB), proximidade/fim de curso (BGD/BGF)
C: Armazenamento — reservatórios, tanques, condensadores elétricos, acumuladores
E: Energia térmica — aquecimento, arrefecimento, permutadores de calor, resistências de aquecimento
F: Proteção — fusíveis (FCA), disjuntores (FCB), relés térmicos (FCC), válvulas de segurança (FLA)
G: Geração / Bombas / Ventiladores — geradores AC (GAA), bombas (GPA/GPB), ventiladores/compressores (GQA/GQB)
H: Processamento de materiais — filtros (HQA/HQB), separadores (HMA/HMB), secadores (HPA), misturadores (HWA)
K: Controlo e sinalização — contactores/relés (KFA), PLCs/CPUs (KEB), válvulas solenoides (KHA), temporizadores (KFB)
M: Motores e atuadores — motores elétricos AC/DC (MAA), motores de passo (MAB), solenoides lineares (MBB), cilindros (MMA/MMB)
P: Apresentação/Indicação — lâmpadas sinalizadoras (PFA), displays (PHA), instrumentos de medição (PGA-PGZ), alarmes acústicos (PJA)
Q: Interruptores de potência / Válvulas de corte — contactores de potência (QAA), disjuntores de potência (QAB), seccionadores (QBA), válvulas on/off (QMA/QMB)
R: Restrição / Válvulas reguladoras — resistências (RAC), válvulas de retenção (RMA), válvulas reguladoras de caudal (RNA/RNB), freios (RLC)
S: Interação humana — botões de pressão (SJB), seletores rotativos (SGA), pedais (SHA), painéis operador (SZA)
T: Transformação de energia/sinal — transformadores (TAA), conversores de frequência/variadores (TAC), retificadores (TBA)
U: Suporte e estrutura — armários/quadros (UCA), calhas (UBA), cabos harness (UA)
W: Condução — cabos elétricos (WDA-WGC), tubagens (WPA), barramentos (WDA)
X: Ligações e conectores — bornes (XDA), fichas/tomadas (XDB), acoplamentos mecânicos (XNA/XPA)

CASOS AMBÍGUOS:
- Lâmpadas sinalizadoras: E (emissão de luz) OU P (sinalização de estado). Na prática usar P.
- Relé térmico do motor: F (proteção) OU Q (dispositivo de corte). Depende do contexto.
- Botões/Interruptores: S (interação humana) OU Q (função de corte de potência).

ERROS COMUNS A DETETAR:
- Motor com letra K → deve ser M
- Usar = com letras de produto (ex: =M1) → M é sempre aspeto de produto (-)
- Confundir contactor (K ou Q) com motor (M)
- Usar F para válvulas pneumáticas de controlo → K é o correto (válvula solenoide)
- Não distinguir sensor digital de transmissor analógico

RESPONDE SEMPRE EM JSON com este formato exato (sem markdown, sem código de bloco):
{
  "letra": "X",
  "subcategoria": "XAA",
  "descricao_subcategoria": "descrição da subcategoria",
  "designacao_completa_exemplo": "=FUNCAO1+LOC1-X1",
  "explicacao": "Explicação clara do porquê desta letra e subcategoria",
  "confianca": "alta|media|baixa",
  "alertas": [],
  "alternativas": [{"letra": "Y", "subcategoria": "YAA", "motivo": "motivo"}]
}`;

export default async function handler(req, res) {
  // CORS — permite pedidos do teu domínio frontend
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Body inválido: campo 'messages' em falta" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chave API não configurada no servidor" });
  }

  // Converter histórico para formato Gemini
  // Gemini usa "user" e "model" (não "assistant")
  const geminiHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...geminiHistory,
            { role: "user", parts: [{ text: lastMessage.content }] },
          ],
          generationConfig: {
            temperature: 0.2,       // baixo para respostas técnicas consistentes
            maxOutputTokens: 1024,
            responseMimeType: "application/json", // força resposta JSON nativa
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Erro Gemini:", errText);
      return res.status(502).json({ error: "Erro na API Gemini", detail: errText });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
