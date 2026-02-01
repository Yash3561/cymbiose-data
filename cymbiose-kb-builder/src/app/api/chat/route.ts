
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const query = lastMessage.content;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        // 1. Generate Embedding for the query
        // Use text-embedding-004 as planned
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(query);
        const vector = embeddingResult.embedding.values; // Array of numbers (768)

        // 2. Search for similar chunks using pgvector
        // We utilize Prisma's raw query features to access the vector index
        // Note: The schema defines 'embeddingVector' as Unsupported("vector(768)")
        // We cast it to vector for similarity calculation

        // We perform a cosine distance sort ( <=> operator )
        // LIMIT 5 chunks
        const chunks = await prisma.$queryRaw`
      SELECT 
        id, 
        content, 
        "kbEntryId", 
        1 - (("embedding"::vector) <=> ${vector}::vector) as similarity
      FROM "KBChunk"
      WHERE "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${vector}::vector
      LIMIT 5;
    ` as any[];

        // 3. Construct Context
        const contextText = chunks
            .map((chunk) => {
                return `[Chunk from Entry ${chunk.kbEntryId}]:\n${chunk.content}`;
            })
            .join("\n\n");

        const systemPrompt = `
      You are an expert clinical AI assistant for "Cymbiose".
      You have access to a knowledge base of clinical documents, research, and guidelines.
      
      Use the provided Context to answer the user's question.
      If the answer is not in the context, say "I don't have enough information in my knowledge base to answer that confidentially," unless it is a general question where your training is sufficient (but prioritize the context).
      
      Context:
      ${contextText}
    `;

        // 4. Generate Response
        // Using gemini-2.5-flash as confirmed by check-models script
        const chatModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt
        });

        // Gemini requires the first message in the history to be from the user.
        // We filter out any initial assistant messages (like the greeting).
        const rawHistory = messages.slice(0, -1);
        let history = rawHistory;

        if (history.length > 0 && history[0].role === 'assistant') {
            history = history.slice(1);
        }

        const chat = chatModel.startChat({
            history: history.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            })),
        });

        const result = await chat.sendMessage(query);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            role: "assistant",
            content: text,
            api_log: { // return citations/chunks for debugging UI
                chunks_used: chunks.map(c => c.id),
                model_used: "gemini-2.5-flash"
            }
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
