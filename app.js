import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";

const statusText = document.getElementById("status");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const loadBtn = document.getElementById("load-btn");

let engine;
let messages = [];

loadBtn.addEventListener("click", async () => {
    loadBtn.disabled = true;
    
    const initProgressCallback = (initProgress) => {
        statusText.textContent = `Status: ${initProgress.text}`;
    };

    try {
        engine = await CreateMLCEngine(MODEL_ID, { initProgressCallback });
        
        statusText.textContent = "Status: Model loaded! Ready to chat.";
        userInput.disabled = false;
        sendBtn.disabled = false;
        loadBtn.style.display = "none";
        userInput.focus();
    } catch (error) {
        statusText.textContent = `Error loading model: ${error.message}`;
        console.error(error);
    }
});

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const userMessage = userInput.value.trim();
    userInput.value = "";
    
    appendMessage("You", userMessage, "user");
    messages.push({ role: "user", content: userMessage });

    userInput.disabled = true;
    sendBtn.disabled = true;
    statusText.textContent = "Status: AI is thinking...";

    try {
        const reply = await engine.chat.completions.create({ messages });
        const botMessage = reply.choices[0].message.content;
        
        appendMessage("SmolLM2", botMessage, "bot");
        messages.push({ role: "assistant", content: botMessage });
    } catch (error) {
        appendMessage("System", `Error generating response: ${error.message}`, "bot");
    }

    statusText.textContent = "Status: Ready.";
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
});

function appendMessage(sender, text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${className}`;
    msgDiv.innerHTML = `<div class="sender-name">${sender}</div><div>${text}</div>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
