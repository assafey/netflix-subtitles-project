var HOSTNAME = "https://netsubend.herokuapp.com";

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

fetchSetting(start);

function fetchSetting(cb) {
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
                setTimeout(cb, 0);
            } else {
                console.log("Netflix subtitles extension is disabled.");
            }
        }
    );
}

function start() {
    document.addEventListener("ready:serie", function(data) {
        var serie = data.detail.serie;
        var season = data.detail.season;
        var episode = data.detail.episode;
        console.log("Serie:", serie, "Season:", season, "Episode:", episode);
        fetchSerieSubtitles(serie, season, episode, function(subtitles) {
            waitForVideoElement(subtitles);
        });
    });

    document.addEventListener("ready:movie", function(data) {        
        var movie = data.detail.movie;
        var year = data.detail.year;
        console.log("Movie:", movie, "Year:", year);
        fetchMovieSubtitles(movie, year, function(subtitles) {
            waitForVideoElement(subtitles);
        });
    });

    document.addEventListener("title:timeout", function(data) {
        var timeoutInSeconds = data.detail.timeoutInSeconds;
        console.log("Timeout after", timeoutInSeconds, "seconds");
    });

    waitForPlayer(new Date().getTime());
}

function dispatchCustomEvent(type, data) {
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(type, true, true, data);
    document.dispatchEvent(evt);
}

function waitForPlayer(startingTimestamp) {
    var timeoutInSeconds = 10;
    
    var infoElements = getVideoInfoElements();
    if (isPlayerVisible(infoElements)) {
        if (isMovie(infoElements)) {
            dispatchCustomEvent("ready:movie", {
                movie: getSerieOrMovieName(infoElements)
            });
        } else {
            dispatchCustomEvent("ready:serie", {
                serie: getSerieOrMovieName(infoElements),
                season: getSeason(infoElements),
                episode: getEpisode(infoElements)
            });
        }
    } else {
        console.log("Waiting for player...");
        setTimeout(waitForPlayer.bind(startingTimestamp), 1000);
    }
}

function getVideoInfoElements() {
    return document.querySelectorAll(".player-status span");
}

function isPlayerVisible(infoElements) {
    return infoElements.length > 0;
}

function isMovie(infoElements) {
    return infoElements.length === 1;
}

function isSerie(infoElements) {
    return infoElements.length === 3;
}

function getSerieOrMovieName(infoElements) {
    return infoElements[0].innerText;
}

function getSeason(infoElements) {
    var seasonAndEpisodeText = infoElements[1].innerText;
    var endOfSeasonText = seasonAndEpisodeText.indexOf(": ");
    var startSeasonNumberText = "Season ".length;
    return seasonAndEpisodeText.substring(startSeasonNumberText, endOfSeasonText);
}

function getEpisode(infoElements) {
    var seasonAndEpisodeText = infoElements[1].innerText;
    var startOfEpisodeNumber = seasonAndEpisodeText.indexOf("Ep. ");
    return seasonAndEpisodeText.substring(startOfEpisodeNumber + "Ep. ".length);
}

function fetchSerieSubtitles(serie, season, episode, callback) {
    fetchSubtitles("serie", {
            serie: serie,
            season: season,
            episode: episode
        }, callback);
}

function fetchMovieSubtitles(movie, year, callback) {
    fetchSubtitles("movie", {
            movie: movie,
            year: year
        }, callback);
}

function fetchSubtitles(type, body, callback) {
    chrome.runtime.sendMessage({
        type: "sendRequest",
        url: HOSTNAME + "/sub/" + type + "/" + language,
        method: "POST",
        body: body
    }, function(response) {
        if (typeof response === "undefined") {
            console.log("no response from server.");
        } else if (response.hasOwnProperty("error")){     
            console.log(response.error);
        } else if (response.hasOwnProperty("result")) {
            console.log("Subtitles fetched sucessfully!");
            callback(response.result);
        } else {
            console.log("no result in response from server.");
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
            fetchSetting(start);
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

    var videos = document.getElementsByTagName("video");
    if (videos.length > 0) {
        setTimeout(alwaysCheckThatSubtitlesContainerIsAppended, 100);
    }
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
