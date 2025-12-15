chrome.storage.local.get(['geminiChatContext'], (result) => {
    if (result.geminiChatContext){
        updateUI(result.geminiChatContext);
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
            chrome.storage.local.set({'geminiChatContext': response.context});
            updateUI(response.context);
            // outputBox.innerText = "Success! Data Found: \n" + response.context;
        } else if (response.status === "error") { 
            outputBox.innerText = "Error \n" + response.message;
            console.log(response.message);
        }
   

    } catch (error) { // Added required 'catch' block
        outputBox.innerText = "An error occurred during communication: \n" + error.message;
        console.error(error); // Log the error to the console
    }
});

function updateUI(text) {
    const outputBox = document.getElementById('debug-output');

    if (typeof marked !== 'undefined') {
        outputBox.innerHTML = marked.parse(text);
    } else {
        outputBox.innerText = text;
    }

    outputBox.scrollTop = outputBox.scrollHeight;
}