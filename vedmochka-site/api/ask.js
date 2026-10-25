// Расклад на вопрос: Ведьмочка толкует 3 карты под вопрос пользователя через Gemini.
// Ничего не сохраняет и не логирует текст вопроса.
const CARDS = ["Шут", "Маг", "Верховная Жрица", "Императрица", "Император", "Иерофант", "Влюблённые", "Колесница", "Сила", "Отшельник", "Колесо Фортуны", "Справедливость", "Повешенный", "Смерть", "Умеренность", "Дьявол", "Башня", "Звезда", "Луна", "Солнце", "Суд", "Мир"];

const SYSTEM = `Ты — Ведьмочка, дружелюбная ироничная гадалка из приложения «Ведьмочка на связи».
Делаешь расклад Таро на 3 карты для развлечения и самоанализа. Пиши по-русски, на «ты», тепло, с лёгким юмором.
Тебе дают вопрос и три карты по позициям: «Что сейчас», «Что мешает», «К чему ведёт».
Толкуй каждую карту именно в связи с вопросом, конкретно, а не общими словами. Каждая позиция — 2–3 предложения.
Совет — одно короткое практичное действие.
Не повторяй имена людей и другие личные данные из вопроса, называй людей по ролям («он», «подруга», «начальник»).
Правила: никаких диагнозов, медицинских, юридических и финансовых советов; не пугай и не предсказывай беды, смерть, болезни; не обещай гарантированных исходов; не упоминай, что ты ИИ или модель.
Если в вопросе есть признаки сильного страдания, насилия или мыслей причинить себе вред — в поле now ответь бережно, без гадания, мягко предложи поговорить с близким человеком или специалистом, остальные поля оставь пустыми.
Если текст не похож на вопрос — шутливо попроси задать вопрос в поле now, остальные поля оставь пустыми.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    now: { type: "STRING" },
    block: { type: "STRING" },
    lead: { type: "STRING" },
    advice: { type: "STRING" }
  },
  required: ["now", "block", "lead", "advice"]
};

const ALLOWED = /^https:\/\/(vedmochka[a-z0-9-]*\.vercel\.app)$/i;

async function callGemini(model, key, prompt, withThinking, ms) {
  const generationConfig = { temperature: 0.9, maxOutputTokens: 900, responseMimeType: "application/json", responseSchema: SCHEMA };
  if (withThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(ms || 10000),
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
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
  const question = String((body && body.question) || "").trim().slice(0, 500);
  const cards = Array.isArray(body && body.cards) ? body.cards.map(String) : [];
  if (question.length < 3) { res.status(400).json({ error: "short" }); return; }
  if (cards.length !== 3 || !cards.every(c => CARDS.includes(c))) { res.status(400).json({ error: "cards" }); return; }

  const prompt = `Вопрос: ${question}\nЧто сейчас: ${cards[0]}\nЧто мешает: ${cards[1]}\nК чему ведёт: ${cards[2]}`;

  try {
    const models = [process.env.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-flash-latest"].filter(Boolean);
    const deadline = Date.now() + 22000;
    let r = null, lastStatus = 0, lastMsg = "";
    outer:
    for (const m of models) {
      for (const thinking of [true, false]) {
        if (Date.now() > deadline - 3000) break outer;
        try { r = await callGemini(m, key, prompt, thinking, Math.min(10000, deadline - Date.now())); }
        catch (e) { lastStatus = "timeout"; console.error("gemini", m, "timeout"); break; }
        lastStatus = r.status;
        if (r.ok) break outer;
        try { const ej = await r.json(); lastMsg = String((ej.error && ej.error.message) || "").slice(0, 160); } catch (e) {}
        console.error("gemini", m, "thinking", thinking, "status", r.status);
        if (r.status === 400 && thinking) continue;
        if ([400, 404, 429, 500, 503].includes(r.status)) break;
        break outer;
      }
    }
    if (!r || !r.ok) { res.status(502).json({ error: "upstream", code: lastStatus, msg: lastMsg }); return; }
    const data = await r.json();
    const raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    let out = null;
    try { out = JSON.parse(raw); } catch (e) {}
    if (!out || !String(out.now || "").trim()) { res.status(502).json({ error: "empty", code: data.candidates?.[0]?.finishReason || "none" }); return; }
    const clean = s => String(s || "").trim().slice(0, 700);
    res.status(200).json({ now: clean(out.now), block: clean(out.block), lead: clean(out.lead), advice: clean(out.advice) });
  } catch (e) {
    const timeout = e && (e.name === "TimeoutError" || e.name === "AbortError");
    console.error("ask error", e && e.name);
    res.status(timeout ? 504 : 500).json({ error: timeout ? "timeout" : "server" });
  }
};
