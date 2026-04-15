const fetch = require("node-fetch");

async function aiReview(diffText) {
  try {
    console.log("🧠 Sending request to Groq...");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
You are a strict but fair code reviewer.

Return ONLY valid JSON:
{
  "score": number (0-100),
  "decision": "APPROVED" | "REVIEW" | "BLOCK",
  "reasons": [string]
}

Rules:
- NEVER output explanations outside JSON
- NEVER include logs or meta text
- Be fair: small README edits should NOT be BLOCKED
- Only BLOCK for dangerous, broken, or harmful changes
`
          },
          {
            role: "user",
            content: diffText
          }
        ],
        temperature: 0.2
      })
    });

    console.log("📡 Status:", res.status);

    const text = await res.text();

    const json = JSON.parse(text);
    const content = json?.choices?.[0]?.message?.content;

    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      score: typeof parsed.score === "number" ? parsed.score : 60,
      decision: parsed.decision || "REVIEW",
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : []
    };

  } catch (err) {
    console.log("❌ AI ERROR:", err.message);
    return null;
  }
}

module.exports = { aiReview };
