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

async function callGemini(model, key, dream, withThinking) {
  const generationConfig = { temperature: 0.9, maxOutputTokens: 700 };
  if (withThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: "Мой сон: " + dream }] }],
      generationConfig
    })
  });
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
    const models = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"].filter(Boolean);
    let r = null, lastStatus = 0;
    outer:
    for (const m of models) {
      for (const thinking of [true, false]) {
        r = await callGemini(m, key, dream, thinking);
        lastStatus = r.status;
        if (r.ok) break outer;
        console.error("gemini", m, "thinking", thinking, "status", r.status);
        if (r.status === 400 && thinking) continue; // повтор без thinkingConfig
        if ([400, 404, 429, 500, 503].includes(r.status)) break; // перегружена/нет квоты/нет модели — пробуем следующую
        break outer; // 401/403 — проблема с ключом, дальше пробовать бессмысленно
      }
    }
    if (!r || !r.ok) { res.status(502).json({ error: "upstream", code: lastStatus }); return; }
    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    if (!text) { res.status(502).json({ error: "empty", code: data.candidates?.[0]?.finishReason || "none" }); return; }
    res.status(200).json({ text });
  } catch (e) {
    const timeout = e && (e.name === "TimeoutError" || e.name === "AbortError");
    console.error("dream error", e && e.name, e && e.cause && e.cause.code);
    res.status(timeout ? 504 : 500).json({ error: timeout ? "timeout" : "server", code: (e && e.cause && e.cause.code) || (e && e.name) || "" });
  }
};
