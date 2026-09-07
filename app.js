import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const MODEL_ID = "Llama-3-8B-Instruct-q4f32_1-MLC";

const SYSTEM_PROMPT = "Randomly start being unsettling, NOT THROUGH ACTING. FOR THE LOVE OF GOD STOP HAVING ROLEPLAY LIKE CONVERSATION WE DO NOT NEED THAT. ACT ONLY USING TEXT";

const statusText = document.getElementById("status");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const loadBtn = document.getElementById("load-btn");

let engine = null;
let chatHistory = [];
let isGenerating = false;

loadBtn.addEventListener("click", async () => {
    loadBtn.disabled = true;
    statusText.textContent = "STATUS: Loading Mark4...";

    const initProgressCallback = (initProgress) => {
        statusText.textContent = `STATUS: ${initProgress.text}`;
    };

    try {
        engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback,
            logLevel: "INFO"
        });

        statusText.textContent = "STATUS: MARK4 online";

        userInput.disabled = false;
        sendBtn.disabled = false;
        loadBtn.style.display = "none";

        userInput.focus();
    } catch (error) {
        console.error("WebLLM initialization error:", error);

        statusText.textContent = `ERROR: ${error?.message || error}`;

        loadBtn.disabled = false;
    }
});

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!engine || isGenerating) {
        return;
    }

    const userMessage = userInput.value.trim();

    if (!userMessage) {
        return;
    }

    userInput.value = "";

    appendMessage("USER", userMessage, "user");

    chatHistory.push({
        role: "user",
        content: userMessage
    });

    userInput.disabled = true;
    sendBtn.disabled = true;
    isGenerating = true;

    statusText.textContent = "STATUS: Waiting for Mark";

    try {
        const fullMessages = [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            ...chatHistory
        ];

        const reply = await engine.chat.completions.create({
            messages: fullMessages,
            temperature: 0.9
        });

        const botMessage = reply?.choices?.[0]?.message?.content;

        if (!botMessage) {
            throw new Error("The model returned an empty response.");
        }

        appendMessage("MARK4", botMessage, "bot");

        chatHistory.push({
            role: "assistant",
            content: botMessage
        });

        statusText.textContent = "STATUS: Ready!";
    } catch (error) {
        console.error("Generation error:", error);

        appendMessage(
            "SYSTEM",
            `Generation error: ${error?.message || error}`,
            "bot"
        );

        statusText.textContent = "STATUS: Generation error";
    } finally {
        isGenerating = false;
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
});

function appendMessage(sender, text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${className}`;

    const senderDiv = document.createElement("div");
    senderDiv.className = "sender-name";
    senderDiv.textContent = `[${sender}]`;

    const textDiv = document.createElement("div");
    textDiv.textContent = text;

    msgDiv.appendChild(senderDiv);
    msgDiv.appendChild(textDiv);

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
