async function aiReview(diffText) {
  try {
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
Return ONLY valid JSON:
{
  "score": number,
  "decision": "APPROVED" | "REVIEW" | "BLOCK",
  "reasons": [string]
}
No markdown. No explanation. Only JSON.
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

    const text = await res.text();

    console.log("🧠 RAW GROQ RESPONSE:");
    console.log(text);

    const parsed = JSON.parse(text);

    const content = parsed.choices?.[0]?.message?.content;

    if (!content) throw new Error("No AI content returned");

    console.log("🧠 AI CONTENT:");
    console.log(content);

    return JSON.parse(content);

  } catch (e) {
    console.log("❌ AI ERROR:", e.message);
    return null;
  }
}
