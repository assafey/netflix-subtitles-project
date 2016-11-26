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
            .then(res => resolve())
            .catch(err => reject(err));
    });
};

OpenSubtitlesService.prototype.getSerieSubtitles = function(subtitleInfo) {
    return new Promise((resolve, reject) => {
            this.imdbService.getInfo(subtitleInfo.serie)
                .then(imdbInfo => {
                    this.openSubsApi.search({
                        sublanguageid: subtitleInfo.language,
                        imdbid: imdbInfo.imdbid,
                        season: subtitleInfo.season,
                        episode: subtitleInfo.episode,
                        extensions: SUBTITLE_EXTENSIONS,
                        limit: LIMIT,
                        query: subtitleInfo.serie
                    })
                    .then(subtitles => resolve(subtitles))
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
    });
};

OpenSubtitlesService.prototype.getMovieSubtitles = function(subtitleInfo) {
    return new Promise((resolve, reject) => {
        this.imdbService.getInfo(subtitleInfo.serie)
            .then(imdbInfo => {
                this.openSubsApi.search({
                    sublanguageid: subtitleInfo.language,
                    imdbid: imdbInfo.imdbid,
                    extensions: SUBTITLE_EXTENSIONS,
                    limit: LIMIT,
                    query: subtitleInfo.movie
                })
                .then(subtitles => resolve(subtitles))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
    });
};

module.exports = OpenSubtitlesService;