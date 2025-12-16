const GEMINI_API_KEY = "API_KEY";

let currentContext = "";

chrome.storage.local.get(['geminiChatContext'], (result) => {
    if (result.geminiChatContext){
        currentContext = result.geminiChatContext;
        dispResp = result.geminiChatDisplay;
        updateUI(currentContext, dispResp, "storage");
    }
})

chrome.runtime.onMessage.addListener((message) => {
    if(message.action === "context_auto_update"){
        currentContext = message.context;
        updateUI(currentContext, message.lastModelResponse, "auto");

        chrome.storage.local.set({
            'geminiChatContext': message.context,
            'geminiChatDisplay': message.lastModelResponse
        });
    }
});


document.getElementById("askBtn").addEventListener('click', async() => {
    const askBtn = document.getElementById('askBtn');
    const question = document.getElementById('user-input').value.trim();
    const responseBox = document.getElementById('ai-response');

    if (!currentContext) {
        responseBox.innerText = "Please Update the Context First!";
        return;
    }
    if (!question){
        responseBox.innerText = "Please type a question";
        return;
    }

    askBtn.disabled = true;
    askBtn.innerText = "Thinking...";
    responseBox.innerText = "Analyzing context...";

    try {
        const prompt =  `
        You are a knowledgeable AI chatbot. I am having a conversation (transcript provided below) and I have a few follow-up questions.
        
        Use the transcript to understand the context of the topic, but **do not** limit your answer to just the text below. Use your general knowledge to explain concepts and solve doubts.

        --- CONVERSATION CONTEXT ---
        ${currentContext}
        --- END CONTEXT ---

        My Question: ${question}
        
        Answer Guidelines:
        1. **Strict Length Limit:** Keep your answer under 5 lines.
        2. Be informative and direct.
        3. You may use outside knowledge to explain better, but keep it brief.
        `;

        const answer = await callGeminiAPI(prompt);
        
        if (typeof marked !== 'undefined'){
            responseBox.innerHTML = marked.parse(answer);
        } else{
            responseBox.innerText = answer;
        }


    } catch (error) {
        responseBox.innerText = "API Error: " + error.message;
        console.error("API Error:", error);
    } finally {
        askBtn.disabled = false;
        askBtn.innerText = "Ask Gemini";
    }
});

function updateUI(text, displayResponse, status) {
    const outputBox = document.getElementById('debug-output');

    if (typeof marked !== 'undefined') {
        if (status === "storage"){
            outputBox.innerHTML = "Fetched from Storage \n" + marked.parse(displayResponse);
        }
        else if (status === "updated"){
            outputBox.innerHTML = "Context Freshly Updated \n" + marked.parse(displayResponse);
        } else if (status === "auto"){
            outputBox.innerHTML = "Context Updated \n" + marked.parse(displayResponse);
        }  else {
            outputBox.innerHTML = "Status Unknown \n" + marked.parse(displayResponse);
        }
        
    } else {
        outputBox.innerText = text;
    }

    outputBox.scrollTop = outputBox.scrollHeight;
}

async function callGeminiAPI(prompt) {
    const model = "gemini-2.5-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });

    if(!response.ok){
        throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}