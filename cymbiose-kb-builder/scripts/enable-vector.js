const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔌 Connecting to database...');
        await prisma.$connect();
        console.log('📦 Enabling vector extension...');
        await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;');
        console.log("📦 Enabling vector extension...");
        await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;');
        console.log("✅ Vector extension enabled.");

        console.log("📦 Adding embedding column...");
        await prisma.$executeRawUnsafe('ALTER TABLE "KBChunk" ADD COLUMN IF NOT EXISTS embedding vector(768);');
        console.log("✅ Column added.");

        console.log("📦 Adding HNSW index...");
        // Index creation might fail if not enough data, but usually fine. Use IF NOT EXISTS equivalent logic? 
        // Postgres CREATE INDEX IF NOT EXISTS is valid.
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS kb_chunk_embedding_idx ON "KBChunk" USING hnsw (embedding vector_cosine_ops);');
        console.log("✅ Index created.");
    } catch (e) {
        console.error('❌ Error enabling extension:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
