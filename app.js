import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// Qwen2-VL is small enough (2 Billion parameters) to run on 4GB RAM phones
const MODEL_ID = "Qwen2-VL-2B-Instruct-q4f16_1-MLC"; 

export async function initializeLocalAI(progressCallback) {
    if (!navigator.gpu) {
        throw new Error("WebGPU is not supported on this browser.");
    }

    // This creates the engine locally on your device
    const engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: progressCallback
    });
    
    return engine;
}

export async function askLocalAI(engine, textPrompt, imageBase64) {
    let messageContent = [];
    
    if (imageBase64) {
        messageContent.push({ type: "image_url", image_url: { url: imageBase64 } });
    }
    if (textPrompt) {
        messageContent.push({ type: "text", text: textPrompt });
    }

    // The chat function looks like an API call, but it processes locally!
    const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: messageContent }]
    });

    return reply.choices[0].message.content;
}
