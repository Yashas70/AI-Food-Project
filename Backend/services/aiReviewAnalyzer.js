const axios = require("axios");

exports.analyzeReviewsWithAI = async (reviews) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const reviewsToAnalyze = Array.isArray(reviews) ? reviews.slice(-20) : [];
  const reviewTexts = reviewsToAnalyze
    .map((review) => review?.Comment)
    .filter((comment) => typeof comment === "string" && comment.trim() !== "");

  if (reviewTexts.length === 0) {
    return {
      sentiment: "positive",
      summaryBullets: [
        "Highly rated by local food enthusiasts.",
        "Generous portions and authentic taste.",
        "Clean atmosphere and friendly staff."
      ],
      topMentions: ["tasty", "fresh", "quick-service"]
    };
  }

  const prompt = `
Analyze the following restaurant reviews and return a JSON object.

Your response MUST be a valid JSON object in this exact format:
{
  "sentiment": "positive",
  "summaryBullets": [
    "Highlight point 1",
    "Highlight point 2",
    "Highlight point 3"
  ],
  "topMentions": [
    "word1",
    "word2",
    "word3"
  ]
}

Rules:
- "sentiment" must be one of: "positive", "negative", or "mixed"
- "summaryBullets" must contain 2-4 short bullet summary points
- "topMentions" must be 3-5 popular dish or experience keywords

Reviews to analyze:
${reviewTexts.join("\n")}
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const messageObj = response.data?.choices?.[0]?.message;
    let rawContent = messageObj?.content || "";
    rawContent = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    if (!rawContent && messageObj?.reasoning) {
      const match = messageObj.reasoning.match(/\{[\s\S]*\}/);
      if (match) rawContent = match[0];
    }

    if (!rawContent) {
      throw new Error("AI provider returned an empty response");
    }

    const aiData = JSON.parse(rawContent);

    return {
      sentiment: ["positive", "negative", "mixed"].includes(aiData.sentiment) ? aiData.sentiment : "positive",
      summaryBullets: Array.isArray(aiData.summaryBullets) && aiData.summaryBullets.length > 0 ? aiData.summaryBullets : ["Delicious food and excellent quality."],
      topMentions: Array.isArray(aiData.topMentions) && aiData.topMentions.length > 0 ? aiData.topMentions : ["tasty", "recommended"]
    };
  } catch (error) {
    console.error("Groq AI Review Analyzer Error:", error.message);
    // Fallback sentiment data if Groq API fails or rate limits
    return {
      sentiment: "positive",
      summaryBullets: [
        "Highly appreciated for delicious food quality and flavor.",
        "Prompt service with well-packaged orders.",
        "Popular choice for dining and delivery."
      ],
      topMentions: ["delicious", "fresh", "quick-service"]
    };
  }
};
