const OS = require('opensubtitles-api');

const LIMIT = 3;
const SUBTITLE_EXTENSIONS = ['srt'];
const SECRET_FILENAME = require.resolve("../../.secret");

function OpenSubtitlesService(secretService, imdbService) {    
    this.secretService = secretService;
    this.imdbService = imdbService;
}

OpenSubtitlesService.prototype.open = function() {
    var secret = this.secretService.secret(SECRET_FILENAME);
    
    this.openSubsApi = new OS({
        useragent: secret.useragent,
        username: secret.username,
        password: secret.password,
        ssl: true
    });

    return new Promise((resolve, reject) => {
        this.openSubsApi.login()
            .then(resolve)
            .catch(err => reject("OpenSubs Connection ERROR: " + err));
    });
};

OpenSubtitlesService.prototype.getSerieSubtitles = function(subtitleInfo) {
    return new Promise((resolve, reject) => {
            this.imdbService.getSerieInfo(subtitleInfo.serie)
                .then(imdbInfo => {
                    this.openSubsApi.search({
                        sublanguageid: subtitleInfo.language,
                        imdbid: imdbInfo.imdbID,
                        season: subtitleInfo.season,
                        episode: subtitleInfo.episode,
                        extensions: SUBTITLE_EXTENSIONS,
                        limit: LIMIT,
                        query: subtitleInfo.serie
                    })
                    .then(resolve)
                    .catch(err => reject("OpenSubs ERROR: " + err));
                })
                .catch(err => reject("IMDB ERROR: " + JSON.stringify(err)));
    });
};

OpenSubtitlesService.prototype.getMovieSubtitles = function(subtitleInfo) {
    return new Promise((resolve, reject) => {
        this.imdbService.getMovieInfo(subtitleInfo.movie, subtitleInfo.year)
            .then(imdbInfo => {
                this.openSubsApi.search({
                    sublanguageid: subtitleInfo.language,
                    imdbid: imdbInfo.imdbID,
                    extensions: SUBTITLE_EXTENSIONS,
                    limit: LIMIT,
                    query: subtitleInfo.movie
                })
                .then(resolve)
                .catch(err => reject("OpenSubs ERROR: " + err));
            })
            .catch(err => reject("IMDB ERROR: " + JSON.stringify(err)));
    });
};

module.exports = OpenSubtitlesService;