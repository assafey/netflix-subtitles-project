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

    this.subsService.getSerieSubtitles(subtitleInfo)
        .then(subtitlesResult => this._handleSubtitlesResponse(subtitlesResult, response))
        .catch(err => this._handleSubtitlesError(err, response));
};

SubtitlesController.prototype.getMovieSubtitles = function(request, response) {
    var subtitleInfo = {
        language: request.params.language,
        movie: request.body.movie
    }
    
    this.subsService.getMovieSubtitles(subtitleInfo)
        .then(subtitlesResult => this._handleSubtitlesResponse(subtitlesResult, response))
        .catch(err => this._handleSubtitlesError(err, response));
};

SubtitlesController.prototype._handleSubtitlesResponse = function(subtitlesResult, response) {
    var subtitle = this._getRelevantSubtitle(subtitlesResult);
    
    if (subtitle !== null) {
        this._downloadSubtitle(subtitle)
            .then(content => response.json(this.subsParser.parse(content)))
            .catch(err => response.status(500).json({ error: err }));
    } else {
        response.status(404).json({ error: "No subtitles for language: " + language });
    }
};

SubtitlesController.prototype._handleSubtitlesError = function(err, response) {
    response.status(500).json({ error: err });
};

SubtitlesController.prototype._getRelevantSubtitle = function(subtitlesResult) {
    var languages = Object.keys(subtitlesResult);

    if (languages.length === 1) {
        var language = languages[0];
        var subtitles = subtitlesResult[language];
        if (subtitles.length > 0) {
            var subtitle = subtitles[subtitles.length - 1];
            return subtitle;
        } 
    }

    return null;
};

SubtitlesController.prototype._downloadSubtitle = function(subtitle) {
    return new Promise((resolve, reject) => {
            this.downloadManager.download(subtitle.url)
                .then(content => resolve(content))
                .catch(err => reject(err));
    });
};

module.exports = SubtitlesController;