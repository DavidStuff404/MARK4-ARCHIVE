import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
}

const statusText = document.getElementById('status');
const chatBox = document.getElementById('chat-box');
const imageInput = document.getElementById('image-input');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const resizeCanvas = document.getElementById('resize-canvas');

let engine;
// 2B Vision model. We keep it, but we force it into a smaller memory box.
const MODEL_ID = "Qwen2-VL-2B-Instruct-q4f16_1-MLC";

async function initLocalAI() {
    try {
        if (!navigator.gpu) {
            statusText.textContent = "Error: WebGPU is disabled on this device/browser.";
            return;
        }

        engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: (progress) => {
                statusText.textContent = `Caching Model: ${Math.round(progress.progress * 100)}% - ${progress.text}`;
            },
            // iOS RAM FIXES: These force WebGPU to use smaller memory buffers
            engineConfig: {
                max_new_tokens: 128,      // Keep replies short so generation doesn't crash
                context_window_size: 768, // Shrink the memory buffer for context
                prefill_chunk_size: 256   // CRITICAL FOR iOS: Prevents Safari WebGPU buffer overflow
            }
        });
        statusText.textContent = "✅ Local AI is ready! Hardware limits applied.";
        sendBtn.disabled = false;
    } catch (err) {
        statusText.textContent = "Fatal Memory Error: Safari blocked the AI. Please reboot phone.";
        console.error(err);
    }
}

// iOS RAM FIX: Downscale the image massively before giving it to the AI.
// High-res iPhone camera photos will crash the memory otherwise.
function getResizedBase64(file, maxSize = 420) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions keeping aspect ratio
                if (width > height && width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
                
                // Draw to canvas and compress as JPEG
                resizeCanvas.width = width;
                resizeCanvas.height = height;
                const ctx = resizeCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 0.7 quality JPEG saves huge amounts of memory over PNG
                resolve(resizeCanvas.toDataURL('image/jpeg', 0.7)); 
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
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
        statusText.textContent = "Compressing image for iOS...";
        // Compress image before processing
        b64Image = await getResizedBase64(file);
        messageContent.push({ type: "image_url", image_url: { url: b64Image } });
    }
    if (prompt) {
        messageContent.push({ type: "text", text: prompt });
    }

    appendMessage('user', prompt, b64Image);
    promptInput.value = '';
    statusText.textContent = "🧠 Thinking locally on GPU... (This may take a minute)";

    try {
        const reply = await engine.chat.completions.create({
            messages: [{ role: "user", content: messageContent }]
        });
        
        appendMessage('ai', reply.choices[0].message.content);
        statusText.textContent = "✅ Ready.";
    } catch (error) {
        appendMessage('ai', "Error: " + error.message);
        statusText.textContent = "Memory overflow during processing. Try a shorter prompt.";
        console.error(error);
    }
    
    imageInput.value = '';
    sendBtn.disabled = false;
});

// Start the app
initLocalAI();
