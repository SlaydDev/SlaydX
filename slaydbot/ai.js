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
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Return ONLY JSON: {score, decision, reasons}"
          },
          {
            role: "user",
            content: diffText
          }
        ],
        temperature: 0.2
      })
    });

    console.log("📡 Response status:", res.status);

    const text = await res.text();

    console.log("📦 RAW RESPONSE:");
    console.log(text);

    const json = JSON.parse(text);

    const content = json?.choices?.[0]?.message?.content;

    console.log("🧠 AI CONTENT:");
    console.log(content);

    if (!content) {
      throw new Error("No AI content returned");
    }

    return JSON.parse(content);

  } catch (err) {
    console.log("❌ GROQ ERROR:", err.message);
    return null;
  }
}
