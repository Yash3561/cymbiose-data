
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Hack to fetch without SDK wrapper just in case, or use SDK if possible?
// The SDK doesn't expose listModels easily in the main class in some versions.
// We'll use fetch.

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No GEMINI_API_KEY found.");
        return;
    }

    try {
        console.log("Fetching available models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Models available:");
            const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            chatModels.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
        } else {
            console.error("Failed to list models:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
