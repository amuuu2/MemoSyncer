import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL,
});

const flashcardSchema = z.object({
  title: z.string(),
  cards: z.array(
    z.object({
      question_zh: z.string(),
      question_en: z.string(),
      answer_zh: z.string(),
      answer_en: z.string(),
      knowledge_tag: z.string(),
      difficulty: z.number().min(1).max(5),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { content, type } = await req.json();

    if (!content || typeof content !== "string") {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const systemPrompt = `You are an expert educator that creates bilingual (Chinese/English) flashcards from study material.

You must respond with ONLY a valid JSON object matching this schema:
{
  "title": "string - title of the content",
  "cards": [
    {
      "question_zh": "string - question in Chinese",
      "question_en": "string - question in English",
      "answer_zh": "string - answer in Chinese",
      "answer_en": "string - answer in English",
      "knowledge_tag": "string - knowledge domain tag like 算法/历史/物理",
      "difficulty": "number 1-5 - 1=basic recall, 3=understanding, 5=complex application"
    }
  ]
}

IMPORTANT rules for answer length:
- difficulty 1-2 (basic): 1-2 sentences, ~30-60 chars, direct factual recall
- difficulty 3 (understanding): 2-3 sentences, ~60-120 chars, explain the concept and why
- difficulty 4-5 (hard/application): 3-5 sentences, ~120-200 chars, include mechanism, reasoning, examples, or connections to other concepts
- Harder questions MUST have longer, more detailed answers
- Never give a 5-word answer for a difficulty 4+ question

Other rules:
1. Extract 8-15 key concepts from the content
2. Questions should test deep understanding, not just memorization
3. Include at least 2-3 hard questions (difficulty 4-5) with detailed explanations
4. Respond ONLY with the JSON, no markdown, no explanation`;

    const userPrompt =
      type === "url"
        ? `Create flashcards from this URL content: ${content}`
        : `Create flashcards from this text:\n\n${content}`;

    const completion = await client.chat.completions.create({
      model: process.env.QWEN_MODEL || "qwen-max",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const rawText = completion.choices[0]?.message?.content || "";

    // Parse JSON from response (handle possible markdown wrapper)
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);
    const validated = flashcardSchema.parse(parsed);

    return Response.json(validated);
  } catch (error) {
    console.error("Generate error:", error);
    return Response.json(
      { error: "Failed to generate cards" },
      { status: 500 }
    );
  }
}
