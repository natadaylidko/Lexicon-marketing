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

async function callGemini(model, key, dream, withThinking, ms) {
  const generationConfig = { temperature: 0.9, maxOutputTokens: 700 };
  if (withThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(ms || 10000),
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
  // Диагностика: GET /api/dream?diag=vm-check — какие модели доступны ключу и что отвечает Google (ключ не раскрывается)
  if (req.method === "GET" && req.query && req.query.diag === "vm-check") {
    const k = process.env.GEMINI_API_KEY;
    if (!k) { res.status(200).json({ key: "missing" }); return; }
    const out = { key: "present", keyLength: k.length, keyPrefix: k.slice(0, 4), envModel: process.env.GEMINI_MODEL || null, models: [], tests: [] };
    try {
      const lr = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", { headers: { "x-goog-api-key": k }, signal: AbortSignal.timeout(8000) });
      const lj = await lr.json().catch(() => ({}));
      out.listStatus = lr.status;
      out.listError = lj.error ? String(lj.error.message || "").slice(0, 300) : null;
      out.models = (lj.models || []).filter(m => (m.supportedGenerationMethods || []).includes("generateContent")).map(m => m.name.replace("models/", ""));
    } catch (e) { out.listStatus = "err:" + (e && e.name); }
    for (const m of ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-lite-latest", "gemini-flash-latest"]) {
      const t0 = Date.now();
      try {
        const r = await callGemini(m, k, "Мне приснилась кошка на крыше", m.includes("2.5") || m.includes("latest"), 15000);
        const j = await r.json().catch(() => ({}));
        out.tests.push({ model: m, status: r.status, ms: Date.now() - t0, error: j.error ? String(j.error.message || "").slice(0, 200) : null, ok: !!(j.candidates && j.candidates.length) });
      } catch (e) { out.tests.push({ model: m, status: "err:" + (e && e.name), ms: Date.now() - t0 }); }
    }
    res.status(200).json(out); return;
  }
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
    const models = [process.env.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-flash-latest"].filter(Boolean);
    const deadline = Date.now() + 22000;
    let r = null, lastStatus = 0, lastMsg = "";
    r = null;
    outer:
    for (const m of models) {
      for (const thinking of [true, false]) {
        if (Date.now() > deadline - 3000) break outer;
        try { r = await callGemini(m, key, dream, thinking, Math.min(10000, deadline - Date.now())); }
        catch (e) { lastStatus = "timeout"; console.error("gemini", m, "timeout"); break; }
        lastStatus = r.status;
        if (r.ok) break outer;
        try { const ej = await r.json(); lastMsg = String((ej.error && ej.error.message) || "").slice(0, 160); } catch (e) {}
        console.error("gemini", m, "thinking", thinking, "status", r.status);
        if (r.status === 400 && thinking) continue; // повтор без thinkingConfig
        if ([400, 404, 429, 500, 503].includes(r.status)) break; // перегружена/нет квоты/нет модели — пробуем следующую
        break outer; // 401/403 — проблема с ключом, дальше пробовать бессмысленно
      }
    }
    if (!r || !r.ok) { res.status(502).json({ error: "upstream", code: lastStatus, msg: lastMsg }); return; }
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
