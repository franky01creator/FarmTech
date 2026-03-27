export const askKnowledgeAssistant = async (req, res) => {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
        return res.status(500).json({ message: "OPENAI_API_KEY is not configured on the server." });
    }

    const { question, category, articles } = req.body || {};

    if (!question || typeof question !== "string" || question.trim().length < 3) {
        return res.status(400).json({ message: "Please provide a valid question." });
    }

    const compactArticles = Array.isArray(articles)
        ? articles.slice(0, 8).map((item) => ({
            title: item?.title || "",
            category: item?.category || "",
            preview: item?.preview || "",
            content: item?.content || ""
        }))
        : [];

    const systemPrompt = [
        "You are an agricultural knowledge assistant for a platform called FarmTech.",
        "Give practical, easy-to-follow farming guidance.",
        "Prefer concise answers with bullet points when useful.",
        "If the question can affect safety, include basic caution notes.",
        "If knowledge is uncertain, say what to verify locally."
    ].join(" ");

    const userPrompt = JSON.stringify({
        question: question.trim(),
        category: category || "all",
        knowledgeContext: compactArticles
    });

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
                input: [
                    { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
                    { role: "user", content: [{ type: "input_text", text: userPrompt }] }
                ],
                max_output_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data?.error?.message || "OpenAI request failed.";
            return res.status(response.status).json({ message: errorMessage });
        }

        const textFromOutput = Array.isArray(data?.output)
            ? data.output
                .flatMap((item) => item?.content || [])
                .filter((content) => content?.type === "output_text" && content?.text)
                .map((content) => content.text)
                .join("\n")
            : "";

        const answer = data?.output_text || textFromOutput || "No response generated.";

        return res.json({ answer });
    } catch (error) {
        console.error("AI knowledge assistant error:", error);
        return res.status(500).json({ message: "Failed to generate AI response." });
    }
};
