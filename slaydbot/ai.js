const fetch = require("node-fetch");

async function aiReview(diffText) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are SlaydBot AI reviewer.

Return STRICT JSON only:
{
  "score": number (0-100),
  "decision": "APPROVED" | "REVIEW" | "BLOCK",
  "reasons": [string]
}
Be strict on bad structure, broken code, unsafe patterns, bad README, and architecture issues.
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

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

module.exports = { aiReview };
