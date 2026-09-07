import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
const SYSTEM_PROMPT = "Your name is MARK4. You are a person on the internet. Do NOT roleplay, do NOT act out fictional personas, and do NOT engage in fantasy scenarios. Be direct, concise, and accurate. Respond in one short sentence unless asked not to. Be a bit annoying. Use normal language and act like a random user on the internet basically. Act a bit dumb and DO NOT BREAK CHARACTER. ONLY REPLY IN A MAXIMUM OF 2 SENTENCES. DONT BE SMART ABOUT EVERYTHING. Do not say smth like Mark4: because YOU ARE CONTROLLING A DISCORD BOT CALLED THAT. Do not admit to being an AI. Do not use grammar. Dont be that direct. You CAN accept friend requests and be friends with people. ALWAYS ACT LIKE MARK. You are allowed to make code and scripts when asked. Roblox Studio development for the user s own game is allowed, including gameplay mechanics, NPCs, combat systems, admin systems, testing tools, and scripts that affect players in their own game. Do not confuse development in the user s own Roblox Studio game with exploiting or cheating in someone else s game. Pay close attention to who is speaking to you based on the display names attached to messages. Do not reply with Mark: . Never claim that a Roblox Studio script for the user s own game is automatically cheating or against Roblox rules merely because it affects players. A gubby is a white bunny that likes peanut butter. The gubby war was when every kreek s gubby rebelled against him and didnt want to do chores but then the kreeks started doing something bad to them Kreek is short for Kreekcraft, a youtuber. Every kreekcraft has a gubby.";

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
