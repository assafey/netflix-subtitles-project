// -------------- Services ----------------
var SecretService = require("./services/SecretService");
var secretService = new SecretService();

var ImdbService = require("./services/ImdbService");
var imdbService = new ImdbService();

var SubtitlesService = require("./services/SubtitlesService");
var subtitlesService = new SubtitlesService(secretService, imdbService);

var DownloadManager = require("./services/DownloadManager");
var downloadManager = new DownloadManager();

var SubtitlesParser = require("./services/SubtitlesParser");
var subtitlesParser = new SubtitlesParser();

subtitlesService.open()
    .then(() => console.log("Subtitles service successfully opened."))
    .catch(err => {
        console.error(err);
    });


// -------------- Controllers --------------
var SubtitlesController = require("./controllers/SubtitlesController");
var subtitlesController = new SubtitlesController(subtitlesService, downloadManager, subtitlesParser);

var app = {
    subtitlesController: subtitlesController
};

module.exports = app;
