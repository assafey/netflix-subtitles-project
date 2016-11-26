var handlers = {
    "sendRequest": sendRequest,
    "getSetting": getSetting
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (handlers.hasOwnProperty(request.type)) {
        return handlers[request.type](request, sendResponse);
    } else {
        console.log("Error: The type of message [", request.type, "] is not supported")
        sendResponse({error: "The type of message [" + request.type + "] is not supported" });
    }
});

function sendRequest(request, sendResponse) {
    console.log("Sending", request.method, "request to:", request.url);
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {        
        if (this.readyState == 4) {
            if (this.status == 200) {
                console.log("Subtitles recieved.")
                if (this.responseText.hasOwnProperty("error")) {
                    sendResponse({error: this.responseText.error});
                } else {
                    sendResponse({result: this.responseText});
                }
            } else {
                console.log("Error:", this.statusText);
                sendResponse({error: this.statusText});
            }
        }
    };

    xhttp.onerror = function() { 
        console.log("Error occured!");       
        sendResponse({error: "error occured"});
    };

    console.log("Searching for:", request.body);

    xhttp.open(request.method, request.url, true);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(request.body));

    return true;
}

function getSetting(request, sendResponse) {
    chrome.storage.local.get("netflixSubtitlesSetting", function(items) {    
        if (typeof items.netflixSubtitlesSetting !== "undefined") {        
            sendResponse({ result: items.netflixSubtitlesSetting });
        } else {
            console.log("No setting yet.");
            sendResponse({});
        }
    });

    return true;
}