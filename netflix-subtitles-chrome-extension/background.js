var handlers = {
    "sendRequest": sendRequest,
    "getSetting": getSetting
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (handlers.hasOwnProperty(request.type)) {
        return handlers[request.type](request, sendResponse);
    } else {
        sendResponse({error: "The type of message [" + request.type + "] is not supported" });
    }
});

function sendRequest(request, sendResponse) {
    console.log("Sending", request.method, "request to:", request.url);
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {        
        if (this.readyState == 4 && this.status == 200) {
            sendResponse({result: this.responseText});
        }
    };

    xhttp.onerror = function() {        
        sendResponse({error: "error occured"});
    };

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
            sendResponse({});
        }
    });

    return true;
}