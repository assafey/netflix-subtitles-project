const MINIMUM_SUBTITLE_LANGUAGE_LENGTH = 3;

function SubtitlesController(subsService, downloadManager, subsParser) {
    this.subsService = subsService;
    this.downloadManager = downloadManager;
    this.subsParser = subsParser;
}

SubtitlesController.prototype.getSerieSubtitles = function(request, response) {    
    var subtitleInfo = {
        language: request.params.language,
        serie: request.body.serie,
        season: request.body.season,
        episode: request.body.episode
    };

    console.log("Searching subtitles for serie:", subtitleInfo.serie);

    this.subsService.getSerieSubtitles(subtitleInfo)
        .then(subtitlesResult => this._handleSubtitlesResponse(subtitleInfo.language, subtitlesResult, response))
        .catch(err => this._handleSubtitlesError(err, response));
};

SubtitlesController.prototype.getMovieSubtitles = function(request, response) {
    var subtitleInfo = {
        language: request.params.language,
        movie: request.body.movie,
        year: request.body.year
    }
    
    console.log("Searching subtitles for movie:", subtitleInfo.movie);

    this.subsService.getMovieSubtitles(subtitleInfo)
        .then(subtitlesResult => this._handleSubtitlesResponse(subtitleInfo.language, subtitlesResult, response))
        .catch(err => this._handleSubtitlesError(err, response));
};

SubtitlesController.prototype._handleSubtitlesResponse = function(language, subtitlesResult, response) {
    var subtitle = this._getRelevantSubtitle(language, subtitlesResult);
    
    if (subtitle !== null) {
        this._downloadSubtitle(subtitle)
            .then(content => response.json(this.subsParser.parse(content)))
            .catch(err => {
                console.log(err);
                response.json({ error: err })
            });
    } else {
        console.info("No subtitles for language: " + language);
        response.json({ error: "No subtitles for language: " + language });
    }
};

SubtitlesController.prototype._handleSubtitlesError = function(err, response) {
    console.log(err);
    response.json({ error: err });
};

SubtitlesController.prototype._getRelevantSubtitle = function(reqLangauge, subtitlesResult) {
    var languages = Object.keys(subtitlesResult);

    if (languages.length === 1) {
        var language = languages[0];
        var subtitles = subtitlesResult[language];
        if (subtitles.length > 0) {
            console.log("We got '" + reqLangauge + "' subtitles!");
            var subtitle = subtitles[0];
            return subtitle;
        } 
    }

    return null;
};

SubtitlesController.prototype._downloadSubtitle = function(subtitle) {
    return new Promise((resolve, reject) => {
            this.downloadManager.download(subtitle.encoding, subtitle.url)
                .then(resolve)
                .catch(err => reject(err));
    });
};

module.exports = SubtitlesController;