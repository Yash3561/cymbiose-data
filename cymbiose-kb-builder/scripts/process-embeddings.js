
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load env if not loaded automatically (node doesn't load .env by default)
// But we can assume user runs with correct env or we pass it? 
// We'll trust process.env if running via 'dotenv' or manually. 
// For now, I'll rely on the fact that we added it to .env and often I run 'node --env-file=.env' or similar in modern Node.
// Or just hardcode the logic to check.
// I'll grab the key explicitly if needed.

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyAytuLz2ZSb-1q5d0Wg3DRzzSkr1JnmEAY');

async function main() {
    try {
        console.log("🔍 Checking for chunks without embeddings...");

        // Find chunks where embedding is null
        // Since 'embedding' is raw column, we can't use findMany filtering easily if not in schema?
        // Wait, I removed 'embeddingVector' from schema. The 'embedding' column is invisible to Prisma.
        // So I must use queryRaw.

        const chunks = await prisma.$queryRaw`
            SELECT id, content FROM "KBChunk" WHERE "embedding" IS NULL
        `;

        console.log(`Found ${chunks.length} chunks to embed.`);

        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        for (const chunk of chunks) {
            console.log(`Processing chunk ${chunk.id.substring(0, 8)}...`);

            try {
                const result = await model.embedContent(chunk.content);
                const vector = result.embedding.values; // number[]

                // Update using executeRaw
                // We need to format vector as string for SQL: '[0.1, 0.2, ...]'
                const vectorStr = `[${vector.join(',')}]`;

                await prisma.$executeRawUnsafe(
                    `UPDATE "KBChunk" SET embedding = $1::vector WHERE id = $2`,
                    vectorStr,
                    chunk.id
                );

                // Also update 'embedded' flag if it exists in schema
                // (It does exist in schema!)
                await prisma.kBChunk.update({
                    where: { id: chunk.id },
                    data: { embedded: true }
                });

            } catch (err) {
                console.error(`Failed to embed chunk ${chunk.id}:`, err.message);
            }

            // Rate limit pause?
            await new Promise(r => setTimeout(r, 200));
        }

        console.log("✅ Processing complete.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
