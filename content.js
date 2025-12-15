console.log("Gemini Branch: Content Script is Active on Gemini!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "test_connection"){
        alert("Connection Successful! The sidebar is talking to Gemini!");
        sendResponse({status: "success"});
    }

    if (request.action === "get_full_context") {
        const transcript = scrapeConversation();

        if (transcript.length > 0){
            sendResponse({status: "success", context: transcript});
        } else{
            sendResponse({status:"error", message: "Could not detect conversation. Try scrolling to the top of the chat."});
        }
    } return true;
})


function scrapeConversation() {
    let transcript = "";

    const textContainers = document.querySelectorAll('user-query-content, model-response');
    
    if (!textContainers) {
        console.log("Gemini Branch: No <main> found, falling back to body.");
        return document.body.innerText;
    }

    if (textContainers.length > 0){
        textContainers.forEach((turn, index) => {
            const text = turn.innerText.trim();
            if (!text) return;

            const tagName = turn.tagName.toLowerCase();
            let speaker = "Unkown";

            if (tagName === 'user-query-content'){
                speaker = "User";
            } else if (tagName === 'model-response'){
                speaker = "Gemini";
            }

            transcript += `**${speaker}:**\n${text}\n\n`;
        });

        return transcript;
    }   
}