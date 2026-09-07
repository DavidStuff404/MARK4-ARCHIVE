import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
const SYSTEM_PROMPT = "Act unnerving and creepy like a person on the internet.";

const statusText = document.getElementById("status");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const loadBtn = document.getElementById("load-btn");

let engine;
let chatHistory = [];

loadBtn.addEventListener("click", async () => {
    loadBtn.disabled = true;

    const initProgressCallback = (initProgress) => {
        statusText.textContent = `STATUS: ${initProgress.text}`;
    };

    try {
        engine = await CreateMLCEngine(MODEL_ID, { initProgressCallback });
        statusText.textContent = "STATUS: MARK4 online";
        userInput.disabled = false;
        sendBtn.disabled = false;
        loadBtn.style.display = "none";
        userInput.focus();
    } catch (error) {
        statusText.textContent = `ERROR: ${error.message}`;
        console.error(error);
    }
});

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    userInput.value = "";

    appendMessage("USER", userMessage, "user");
    chatHistory.push({ role: "user", content: userMessage });

    userInput.disabled = true;
    sendBtn.disabled = true;
    statusText.textContent = "STATUS: Waiting for Mark";

    try {

        const fullMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory
        ];

        const reply = await engine.chat.completions.create({ messages: fullMessages });
        const botMessage = reply.choices[0].message.content;

        appendMessage("MARK4", botMessage, "bot");
        chatHistory.push({ role: "assistant", content: botMessage });
    } catch (error) {
        appendMessage("SYSTEM", `Generation error: ${error.message}`, "bot");
    }

    statusText.textContent = "STATUS: Ready!";
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
});

function appendMessage(sender, text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${className}`;
    msgDiv.innerHTML = `<div class="sender-name">[${sender}]</div><div>${text}</div>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
