console.log("Gemini Branch: Content Script is Active on Gemini!");

let lastScrapedtranscript = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "test_connection"){
        alert("Connection Successful! The sidebar is talking to Gemini!");
        sendResponse({status: "success"});
    }
})

setInterval(() =>{
    const data = scrapeConversation();

    if (data.fullTranscript !== lastScrapedtranscript && data.fullTranscript.length > 0){
        console.log("Transcript Updated");
        lastScrapedtranscript = data.fullTranscript;

        chrome.runtime.sendMessage({
            action: "context_auto_update",
            context: data.fullTranscript,
            lastModelResponse: data.lastReply
        }).catch(err => {

        })
    }
}, 2000);

function scrapeConversation() {
    let transcript = "";

    const textContainers = document.querySelectorAll('user-query-content, model-response');
    let lastModelResponse = "";
    
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
                lastModelResponse = text;
            }

            transcript += `**${speaker}:**\n${text}\n\n`;
        });

        return {
            fullTranscript: transcript,
            lastReply: lastModelResponse
        };
    }   
}