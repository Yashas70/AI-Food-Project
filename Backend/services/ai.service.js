const axios = require("axios");

exports.generateDishDescription = async ({
  name,
  category,
  spiceLevel,
  price,
}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const prompt = `
You are a professional food classification assistant.

Generate ONLY a valid JSON object. Do not include markdown or text outside JSON.

IMPORTANT RULES:
- Tags must be accurate restaurant-style tags
- Do NOT misclassify dishes
- Do NOT label main courses as desserts
- Allergens must be realistic
- Serves must be realistic (1 or 2)
- bestFor must be meal timings only

Dish Name: ${name}
Category: ${category}
Spice Level: ${spiceLevel}
Base Price: ${price}

Return JSON in this EXACT format:
{
  "description": "string",
  "tags": ["string"],
  "allergens": ["string"],
  "serves": "string",
  "bestFor": ["string"]
}
`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
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

  // Strip markdown code fences if present
  rawContent = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // If content is empty but reasoning has a JSON block, extract it
  if (!rawContent && messageObj?.reasoning) {
    const match = messageObj.reasoning.match(/\{[\s\S]*\}/);
    if (match) {
      rawContent = match[0];
    }
  }

  if (!rawContent) {
    throw new Error("AI provider returned an empty response");
  }

  try {
    return JSON.parse(rawContent);
  } catch (error) {
    console.error("AI JSON Parse Error. Raw output was:", rawContent);
    throw new Error("AI provider returned invalid JSON response");
  }
};