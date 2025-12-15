document.getElementById("testBtn").addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
    try{
        const response = await chrome.tabs.sendMessage(tab.id, {action: "test_connection"});
        document.getElementById('status').innerText = response.status;
    } catch (error){
        document.getElementById('status').innerText = "Error "+ error.message;
        console.log(error);
    }
    
});