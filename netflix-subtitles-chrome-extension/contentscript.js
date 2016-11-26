var textSize = "24px";
var textColor = "white";
var language = "heb";
var timeOffset = 0;
var started = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {    
    language = request.language;
    textSize = request.textSize;
    textColor = request.textColor;
    timeOffset = request.timeOffset;
    sendResponse({});    
});

chrome.runtime.sendMessage({
        type: "getSetting"        
    }, 
    function(response) {
        
        if (typeof response === "undefined") {
            throw Error("no response from server.");
        } else if (response.hasOwnProperty("error")){     
            throw Error(response.error);
        } else if (response.hasOwnProperty("result")) {
            var setting = response.result;
            textSize = setting.textSize;
            textColor = setting.textColor;
            language = setting.language;
            timeOffset = setting.timeOffset;
        }

        setTimeout(start, 0);
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
        if (startingTimestamp + (timeoutInSeconds * 1000) > currentTimestamp) {
            setTimeout(waitForSeasonAndEpisodeTitle.bind(this, startingTimestamp), 1000);
        } else {
            document.dispatchEvent(createCustomEvent("title:timeout", {timeoutInSeconds: timeoutInSeconds}));
        }

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
            throw Error("no response from server.");
        } else if (response.hasOwnProperty("error")){     
            throw Error(response.error);
        } else if (response.hasOwnProperty("result")) {
            console.log(language + " subtitles fetch sucessfully!");
            callback(JSON.parse(response.result));
        } else {
            throw Error("no result in response from server.");
        }
    });
}

function waitForVideoElement(subtitles) {
    var videos = document.getElementsByTagName("video");
    if (videos.length > 0) {
        var video = videos[0];
        appendSubtitlesContainer(video);                
        video.addEventListener("timeupdate", function() {        
            var subsConainter = document.getElementById("netflix-subs-container");                    
            renderSubtitles(subsConainter, video.currentTime, subtitles);
        });
    } else {
        setTimeout(function() {
            waitForVideoElement(subtitles);
        }, 100);
    }
}

function appendSubtitlesContainer(video) {
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

function alwaysCheckThatSubtitlesContainerIsAppended() {    
    if (document.getElementById("netflix-subs-container") === null) {        
        appendSubtitlesContainer();
    }

    setTimeout(alwaysCheckThatSubtitlesContainerIsAppended, 100);
}

function renderSubtitles(subsConatiner, currentTime, subtitles) {  
    subsConatiner.style.fontSize = textSize;
    subsConatiner.style.color = textColor;    
    var text = findSubtitleNaively(currentTime, subtitles);
    if (text !== null) {  
        subsConatiner.innerHTML = "<b>" + text + "<b>";
    }
}

function findSubtitleNaively(currentTime, subtitles) {
    for (var idx = 0; idx < subtitles.length; idx++) {
        var text = subtitles[idx].text;
        var start = subtitles[idx].start + parseInt(timeOffset, 10);
        var end = subtitles[idx].end + parseInt(timeOffset, 10);
        if (currentTime >= start && currentTime <= end) {
            return text;
        }
    }

    return null;
}

