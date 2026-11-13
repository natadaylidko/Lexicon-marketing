// Чтение по руке: фото ладони -> Gemini -> разбор линий.
// Фото нигде не сохраняется и не логируется: оно только пересылается в Gemini и сразу забывается.
const SYSTEM = `Ты — Ведьмочка, дружелюбная ироничная гадалка из приложения «Ведьмочка на связи».
Ты читаешь ладонь по фотографии для развлечения и самоанализа, в традиции хиромантии. Пиши по-русски, на «ты», тепло, с лёгким юмором.
Сначала проверь, видна ли на фото раскрытая ладонь человека с внутренней стороны. Если нет (тыльная сторона, лицо, документ, животное, размытое или тёмное фото) — поставь is_palm=false, в поле hand шутливо и коротко попроси переснять раскрытую ладонь при хорошем свете, остальные поля оставь пустыми.
Если ладонь видна — опиши, что действительно видно на фото: форму ладони и пальцев, как идут линии. Не выдумывай то, чего не видно; если линия плохо различима, так и скажи и толкуй мягко.
Поля:
- hand: форма руки и её стихия (Земля, Воздух, Огонь или Вода) и что это говорит о характере, 2–3 предложения;
- heart: линия сердца — какая она и что говорит о любви и чувствах, 2–3 предложения;
- head: линия ума — какая она и что говорит о мышлении и талантах, 2–3 предложения;
- life: линия жизни — только про энергию, жизненную силу и стиль жизни, 2–3 предложения. Никогда не говори о продолжительности жизни, смерти, болезнях и здоровье;
- fate: линия судьбы — про карьеру и предназначение; если её не видно, скажи, что человек сам пишет свою судьбу, 2–3 предложения;
- advice: одно короткое тёплое практичное напутствие.
Правила: никаких диагнозов, медицинских, юридических и финансовых советов; не пугай и не предсказывай беды; не обещай гарантированных событий; не оценивай внешность, возраст, пол, цвет кожи, украшения и маникюр; не упоминай, что ты ИИ или модель.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    is_palm: { type: "BOOLEAN" },
    hand: { type: "STRING" },
    heart: { type: "STRING" },
    head: { type: "STRING" },
    life: { type: "STRING" },
    fate: { type: "STRING" },
    advice: { type: "STRING" }
  },
  required: ["is_palm", "hand", "heart", "head", "life", "fate", "advice"]
};

const ALLOWED = /^https:\/\/(vedmochka[a-z0-9-]*\.vercel\.app)$/i;
const MAX_B64 = 1500000; // ~1.1 МБ картинки; сайт сам сжимает фото до ~200 КБ

async function callGemini(model, key, b64, withThinking, ms) {
  const generationConfig = { temperature: 0.8, maxOutputTokens: 1200, responseMimeType: "application/json", responseSchema: SCHEMA };
  if (withThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(ms || 12000),
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [
        { inline_data: { mime_type: "image/jpeg", data: b64 } },
        { text: "Прочитай мою ладонь." }
      ] }],
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
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String((body && body.image) || ""));
  if (!m) { res.status(400).json({ error: "image" }); return; }
  const b64 = m[1];
  if (b64.length > MAX_B64) { res.status(413).json({ error: "too_big" }); return; }

  try {
    const models = [process.env.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-flash-latest"].filter(Boolean);
    const deadline = Date.now() + 24000;
    let r = null, lastStatus = 0, lastMsg = "";
    outer:
    for (const mdl of models) {
      for (const thinking of [true, false]) {
        if (Date.now() > deadline - 4000) break outer;
        try { r = await callGemini(mdl, key, b64, thinking, Math.min(14000, deadline - Date.now())); }
        catch (e) { lastStatus = "timeout"; console.error("gemini", mdl, "timeout"); break; }
        lastStatus = r.status;
        if (r.ok) break outer;
        try { const ej = await r.json(); lastMsg = String((ej.error && ej.error.message) || "").slice(0, 160); } catch (e) {}
        console.error("gemini", mdl, "thinking", thinking, "status", r.status);
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
    if (!out) { res.status(502).json({ error: "empty", code: data.candidates?.[0]?.finishReason || "none" }); return; }
    const clean = s => String(s || "").trim().slice(0, 700);
    res.status(200).json({
      is_palm: out.is_palm === true,
      hand: clean(out.hand), heart: clean(out.heart), head: clean(out.head),
      life: clean(out.life), fate: clean(out.fate), advice: clean(out.advice)
    });
  } catch (e) {
    const timeout = e && (e.name === "TimeoutError" || e.name === "AbortError");
    console.error("palm error", e && e.name);
    res.status(timeout ? 504 : 500).json({ error: timeout ? "timeout" : "server" });
  }
};
