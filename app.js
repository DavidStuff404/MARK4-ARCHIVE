import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// Register Service Worker for Offline PWA Support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.error('Service Worker Error:', err));
}

// UI Elements
const statusText = document.getElementById('status');
const chatBox = document.getElementById('chat-box');
const imageInput = document.getElementById('image-input');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');

let engine;
// 2B Vision model for 4GB RAM devices (iPhone 13, Redmi 13C)
const MODEL_ID = "Qwen2-VL-2B-Instruct-q4f16_1-MLC";

async function initLocalAI() {
    try {
        if (!navigator.gpu) {
            statusText.textContent = "Error: WebGPU is disabled. Use modern Chrome/Safari.";
            return;
        }

        // Initialize the engine locally. WebLLM caches the heavy files permanently behind the scenes.
        engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: (progress) => {
                statusText.textContent = `Offline Caching: ${progress.text}`;
            }
        });
        statusText.textContent = "✅ Local AI is ready and cached!";
        sendBtn.disabled = false;
    } catch (err) {
        statusText.textContent = "Memory Error: Close background apps and reload.";
        console.error(err);
    }
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function appendMessage(role, text, imageUrl = null) {
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'preview';
        div.appendChild(img);
        div.appendChild(document.createElement('br'));
    }
    if (text) {
        div.appendChild(document.createTextNode(text));
    }
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const file = imageInput.files[0];
    
    if (!prompt && !file) return;

    sendBtn.disabled = true;
    let messageContent = [];
    let b64Image = null;

    if (file) {
        b64Image = await getBase64(file);
        messageContent.push({ type: "image_url", image_url: { url: b64Image } });
    }
    if (prompt) {
        messageContent.push({ type: "text", text: prompt });
    }

    appendMessage('user', prompt, b64Image);
    promptInput.value = '';
    statusText.textContent = "🧠 Thinking locally on GPU...";

    try {
        const reply = await engine.chat.completions.create({
            messages: [{ role: "user", content: messageContent }]
        });
        
        appendMessage('ai', reply.choices[0].message.content);
        statusText.textContent = "✅ Ready.";
    } catch (error) {
        appendMessage('ai', "Error: " + error.message);
        statusText.textContent = "Error occurred.";
    }
    
    imageInput.value = '';
    sendBtn.disabled = false;
});

// Start the AI setup
initLocalAI();
