var textSize = "24px";
var textColor = "white";
var language = "heb";
var timeOffset = 0;
var disable = false;
var started = false;

var filterTexts = [
    "opensubtitles",
    "qsubs",
    "torec"
];

console.log("Netflix subtitles extension loaded.")

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {    
    language = request.language;
    textSize = request.textSize;
    textColor = request.textColor;
    timeOffset = request.timeOffset;
    disable = request.disable;
    sendResponse({});    
});

chrome.runtime.sendMessage({
        type: "getSetting"        
    }, 
    function(response) {
        
        if (typeof response === "undefined") {
            console.log("no response from server.");
        } else if (response.hasOwnProperty("error")){     
            console.log(response.error);
        } else if (response.hasOwnProperty("result")) {
            var setting = response.result;
            textSize = setting.textSize;
            textColor = setting.textColor;
            language = setting.language;
            timeOffset = setting.timeOffset;
            disable = setting.disable;
        }

        if (!disable) {
            console.log("Searching subtitles for language:", language);
            setTimeout(start, 0);
        } else {
            console.log("Netflix subtitles extension is disabled.");
        }
    }
);

function start() {
    document.addEventListener("title:ready", function(data) {
        var title = data.detail.title;
        console.log("Serie:", getSerieName(), "Season:", getSeason(title), "Episode:", getEpisode(title));
        fetchSubtitles(getSerieName(), getSeason(title), getEpisode(title), function(subtitles) {
            waitForVideoElement(subtitles);
        });
    });

    document.addEventListener("title:timeout", function(data) {
        console.log("Timeout after", data.detail.timeoutInSeconds, "seconds");
    });

    waitForSeasonAndEpisodeTitle(new Date().getTime());
}

function getSerieName() {
    return getElementTextByClass("name");
}

function createCustomEvent(type, data) {
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(type, true, true, data);
    return evt;
}

function waitForSeasonAndEpisodeTitle(startingTimestamp) {
    var timeoutInSeconds = 10;
    var seasonAndEpisodeTitle = getSeasonAndEpisodeTitle();

    if (seasonAndEpisodeTitle === null) {
        
        var currentTimestamp = new Date().getTime();
        if (startingTimestamp + (timeoutInSeconds * 1000) <= currentTimestamp) {
            startingTimestamp = new Date().getTime();            
            console.log("Waiting for serie..."); // never timeout
            //document.dispatchEvent(createCustomEvent("title:timeout", {timeoutInSeconds: timeoutInSeconds}));
        }

        setTimeout(waitForSeasonAndEpisodeTitle.bind(this, startingTimestamp), 500);

    } else {
        document.dispatchEvent(createCustomEvent("title:ready", {title: seasonAndEpisodeTitle}));
    }
}

function getSeasonAndEpisodeTitle() {
    return getElementTextByClass("playable-title");
}

function getElementTextByClass(className) {
    var titles = document.getElementsByClassName(className);
    return titles.length > 0 ? titles[0].innerText : null;
}

function getSeason(title) {
    var splitTitle = title.split(" ");
    var seasonAndEpisode = splitTitle[0].split(":");
    var seasonTitle = seasonAndEpisode[0].substring(1);
    return seasonTitle;
}

function getEpisode(title) {
    var splitTitle = title.split(" ");
    var seasonAndEpisode = splitTitle[0].split(":");
    var episodeTitle = seasonAndEpisode[1].substring(1);
    return episodeTitle;
}

function fetchSubtitles(serie, season, episode, callback) {
    chrome.runtime.sendMessage({
        type: "sendRequest",
        url: "http://localhost:3000/sub/serie/" + language,
        method: "POST",
        body: {
            serie: serie,
            season: season,
            episode: episode
        }
    }, function(response) {
        if (typeof response === "undefined") {
            console.log("no response from server.");
            setTimeout(start, 0);
        } else if (response.hasOwnProperty("error")){     
            console.log(response.error);
            setTimeout(start, 0);
        } else if (response.hasOwnProperty("result")) {
            console.log("Subtitles fetched sucessfully!");
            callback(JSON.parse(response.result));
        } else {
            console.log("no result in response from server.");
            setTimeout(start, 0);
        }
    });
}

function waitForVideoElement(subtitles) {
    var videos = document.getElementsByTagName("video");
    if (videos.length > 0) {
        var video = videos[0];
        
        appendSubtitlesContainer(video);                
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("abort", function() {
            console.log("Player closed");
            video.removeEventListener("timeupdate", onTimeUpdate);
            setTimeout(start, 0);
        });
        
        function onTimeUpdate() {        
            if (!disable) {
                var subsConainter = document.getElementById("netflix-subs-container");                    
                renderSubtitles(subsConainter, video.currentTime, subtitles);
            }
        }

    } else {
        setTimeout(function() {
            waitForVideoElement(subtitles);
        }, 100);
    }
}

function appendSubtitlesContainer(video) {
    if (typeof video !== "undefined") {
        var videoContainer = video.parentNode;
        var subsConatiner = document.createElement("DIV");
        subsConatiner.id = "netflix-subs-container";
        subsConatiner.style.width = "80%";
        subsConatiner.style.height = "20%";
        subsConatiner.style.top = "75%";
        subsConatiner.style.left = "10%";
        subsConatiner.style.position = "inherit";    
        subsConatiner.style.textAlign = "center";
        videoContainer.appendChild(subsConatiner);
        
        alwaysCheckThatSubtitlesContainerIsAppended();
    }
}

function alwaysCheckThatSubtitlesContainerIsAppended() {    
    if (document.getElementById("netflix-subs-container") === null) {        
        appendSubtitlesContainer();
    }

    setTimeout(alwaysCheckThatSubtitlesContainerIsAppended, 100);
}

function renderSubtitles(subsConatiner, currentTime, subtitles) {  
    subsConatiner.style.fontSize = textSize;
    subsConatiner.style.color = textColor;    
    var subtitle = findSubtitleNaively(currentTime, subtitles);
    if (subtitle !== null) {        
        subsConatiner.innerHTML = "<b>" + subtitle.text + "<b>";
        clearSubtitle(subsConatiner, subtitle.end - subtitle.start, subtitle.text);
    }
}

function clearSubtitle(subsConatiner, seconds, text) {
    if (typeof seconds === "undefined" && typeof text === "undefined") {
        subsConatiner.innerHTML = "";
    }

    setTimeout(function() {
        if (subsConatiner.innerHTML.indexOf(text) >= 0) {
            subsConatiner.innerHTML = "";
        }
    }, seconds * 1000);
}

function findSubtitleNaively(currentTime, subtitles) {
    for (var idx = 0; idx < subtitles.length; idx++) {
        var text = subtitles[idx].text;
        var start = subtitles[idx].start + parseInt(timeOffset, 10);
        var end = subtitles[idx].end + parseInt(timeOffset, 10);
        if (currentTime >= start && currentTime <= end && !shouldFilterSubtitle(subtitles[idx])) {
            return subtitles[idx];
        }
    }

    return null;
}

function shouldFilterSubtitle(subtitle) {
    return filterTexts.some(function(text) {
        return subtitle.text.toLowerCase().indexOf(text) >= 0;
    });
}
