// Conector mínimo a Gemini (Google Generative Language API) usando fetch.
// Sin SDK para no agregar dependencias.
//
// Si no hay GEMINI_API_KEY, askGemini() devuelve null y el que llama
// usa su lógica de respaldo (fallback) basada en los datos reales.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const hasGemini = () => !!process.env.GEMINI_API_KEY;

// Pide a Gemini una respuesta. Si expectJson=true intenta parsear JSON.
async function askGemini(prompt, { expectJson = false } = {}) {
  if (!hasGemini()) return null;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
    `?key=${process.env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: expectJson
          ? { responseMimeType: "application/json", temperature: 0.6 }
          : { temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      console.error("Gemini error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) return null;
    if (!expectJson) return text;

    try {
      return JSON.parse(text);
    } catch {
      // Por si viene envuelto en ```json ... ```
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    }
  } catch (err) {
    console.error("Gemini fetch falló:", err.message);
    return null;
  }
}

module.exports = { askGemini, hasGemini, MODEL };
