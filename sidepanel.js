const GEMINI_API_KEY = "AIzaSyA8sLCX-hlT6ci6sad_4NpuhOAvM3iB90k";

let currentContext = "";

chrome.storage.local.get(['geminiChatContext'], (result) => {
    if (result.geminiChatContext){
        currentContext = result.geminiChatContext;
        updateUI(result.geminiChatContext, "storage");
    }
})


document.getElementById("scrapeBtn").addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const outputBox = document.getElementById('debug-output');

    try {
        const response = await chrome.tabs.sendMessage(tab.id, {action: "get_full_context"});
        
        if(!response) {
            outputBox.innerText = "No response from the Content Script";
            return;
        }

        if (response.status === "success") {
            currentContext = response.context;
            chrome.storage.local.set({'geminiChatContext': response.context});
            updateUI(currentContext, "updated");
        } else if (response.status === "error") { 
            outputBox.innerText = "Error \n" + response.message;
            console.log(response.message);
        }
   

    } catch (error) { // Added required 'catch' block
        outputBox.innerText = "An error occurred during communication: \n" + error.message;
        console.error(error); // Log the error to the console
    }
});

document.getElementById("askBtn").addEventListener('click', async() => {
    console.log("Submit button clicked!");
    
    const question = document.getElementById('user-input').value;
    const responseBox = document.getElementById('ai-response');

    console.log("Question: ", question);


    if (!currentContext) {
        responseBox.innerText = "Please Update the Context First!";
        return;
    }
    if (!question){
        responseBox.innerText = "Please ask a question";
        return;
    }

    responseBox.innerText = "Thinking...";

    try {
        const prompt =  `
        I have a conversation transcript between the user and the AI below, please answer the user's query based on it:

        --- TRANSCRIPT START ---
        ${currentContext}
        --- TRANSCRIPT START ---

        User Question: ${question}
        Important Guideline: Make sure to answer the question in a maximum of 5 lines.
        `;

        const answer = await callGeminiAPI(prompt);
        
        if (typeof marked !== 'undefined'){
            responseBox.innerHTML = marked.parse(answer);
        } else{
            responseBox.innerText = answer;
        }


    } catch (error) {
        responseBox.innerText = "API Error: " + error.message;
    }
});

function updateUI(text, status) {
    const outputBox = document.getElementById('debug-output');

    if (typeof marked !== 'undefined') {
        if (status === "storage"){
            outputBox.innerHTML = "Fetched from Storage \n" + marked.parse(text);
        }
        else if (status === "updated"){
            outputBox.innerHTML = "Context Freshly Updated \n" + marked.parse(text);
        } else {
            outputBox.innerHTML = "Status Unknown \n" + marked.parse(text);
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