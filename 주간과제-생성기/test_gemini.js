import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBeMmnapZ9ign6FWZ7FgZ-1pSSfWjq-8Go" });

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "hello",
        });
        console.log("Success:", response.text);
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
