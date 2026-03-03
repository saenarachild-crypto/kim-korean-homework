import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function run() {
    try {
        const response = await ai.models.list();
        console.log("Available models:");
        for (const model of response) {
            if (model.name.includes("gemini")) {
                console.log(`- ${model.name.replace('models/', '')}`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

run();
