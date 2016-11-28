var http = require('http');

const API_HOST = 'www.omdbapi.com';

function ImdbService() {}

ImdbService.prototype.getSerieInfo = function(name) {    
    var options = {
        host: API_HOST,
        port: '80',
        path: '/?t=' + encodeURIComponent(name) + '&type=series&plot=short&r=json',
        method: 'GET',
    };

    return this._getInfo(options);
};

ImdbService.prototype.getMovieInfo = function(name, year) {    
    var options = {
        host: API_HOST,
        port: '80',
        path: '/?t=' + encodeURIComponent(name) + '&y=' + year + '&type=movie&plot=short&r=json',
        method: 'GET',
    };

    return this._getInfo(options);
};

ImdbService.prototype._getInfo = function(options) {
    return new Promise((resolve, reject) => {
        var req = http.request(options, function(response) {
            var data = "";
            
            response.on('data', function (chunk) {
                data += chunk;
            });
            
            response.on('end', function () {
                var result = JSON.parse(data);
                console.log("IMDB ID:", result.imdbID);
                resolve(result);
            });
        });

        req.on('error', (err) => {
            console.log(err);
            reject(err);
        });

        req.end();
    });
};

module.exports = ImdbService;