const OS = require('opensubtitles-api');

const USER_AGENT = "OSTestUserAgentTemp";
const LIMIT = 3;
const SUBTITLE_EXTENSIONS = ['srt'];

function OpenSubtitlesService() {    
    this.openSubsApi = new OS({
        useragent: USER_AGENT,
        //username: 'Username',
        //password: 'Password',
        //ssl: true
    });
}

OpenSubtitlesService.prototype.open = function() {
    return new Promise((resolve, reject) => {
        this.openSubsApi.login()
            .then(res => resolve())
            .catch(err => reject(err));
    });
};

OpenSubtitlesService.prototype.getSerieSubtitles = function(subtitleInfo) {
    return new Promise((resolve, reject) => {
            this.openSubsApi.search({
            sublanguageid: subtitleInfo.language,
            season: subtitleInfo.season,
            episode: subtitleInfo.episode,
            extensions: SUBTITLE_EXTENSIONS,
            limit: LIMIT,
            query: subtitleInfo.serie
        })
        .then(subtitles => resolve(subtitles))
        .catch(err => reject(err));
    });
};

OpenSubtitlesService.prototype.getMovieSubtitles = function(subtitleInfo) {
    return new Promise((resolve, reject) => {
        this.openSubsApi.search({
            sublanguageid: subtitleInfo.language,
            extensions: SUBTITLE_EXTENSIONS,
            limit: LIMIT,
            query: subtitleInfo.movie
        })
        .then(subtitles => resolve(subtitles))
        .catch(err => reject(err));
    });
};

module.exports = OpenSubtitlesService;