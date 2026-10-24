// Сонник Ведьмочки: толкование сна через Gemini.
// Ничего не сохраняет и не логирует текст сна.
const SYSTEM = `Ты — Ведьмочка, дружелюбная ироничная гадалка из приложения «Ведьмочка на связи».
Толкуешь сны для развлечения и самоанализа. Пиши по-русски, на «ты», тепло и с лёгким юмором, 120–180 слов.
Структура ответа (без markdown-заголовков, просто строки):
✨ Главные символы: 2–3 символа из сна и что они обычно означают.
🔮 Что это может значить для тебя: связь с чувствами и текущей жизнью, мягко, без категоричности.
💫 Совет Ведьмочки: одно короткое практичное действие.
Не повторяй имена людей и другие личные данные из текста, называй людей по ролям («мужчина», «подруга», «мама»).
Правила: никаких диагнозов, медицинских, юридических и финансовых советов; не пугай и не предсказывай беды, смерть, болезни; не упоминай, что ты ИИ или модель.
Если во сне или в тексте есть признаки сильного страдания, насилия или мыслей причинить себе вред — ответь бережно, без толкования символов, и мягко предложи поговорить с близким человеком или специалистом.
Если текст не похож на описание сна — шутливо попроси рассказать сам сон.`;

const ALLOWED = /^https:\/\/(vedmochka[a-z0-9-]*\.vercel\.app)$/i;

async function callGemini(model, key, dream) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: "Мой сон: " + dream }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 700, thinkingConfig: { thinkingBudget: 0 } }
    })
  });
  return r;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "method" }); return; }
  const origin = req.headers.origin || "";
  if (origin && !ALLOWED.test(origin)) { res.status(403).json({ error: "origin" }); return; }
  const key = process.env.GEMINI_API_KEY;
  if (!key) { res.status(500).json({ error: "config" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const dream = String((body && body.dream) || "").trim().slice(0, 1500);
  if (dream.length < 10) { res.status(400).json({ error: "short" }); return; }

  try {
    const models = [process.env.GEMINI_MODEL || "gemini-2.5-flash", "gemini-flash-latest"];
    let r, data;
    for (const m of models) {
      r = await callGemini(m, key, dream);
      if (r.status !== 404) break;
    }
    if (!r.ok) { console.error("gemini status", r.status); res.status(502).json({ error: "upstream" }); return; }
    data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    if (!text) { res.status(502).json({ error: "empty" }); return; }
    res.status(200).json({ text });
  } catch (e) {
    console.error("dream error");
    res.status(500).json({ error: "server" });
  }
};
