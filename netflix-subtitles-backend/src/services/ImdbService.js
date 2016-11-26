var imdb = require('imdb-api');

function ImdbService() {}

ImdbService.prototype.getInfo = function(name) {
    return imdb.get(name);
};

module.exports = ImdbService;