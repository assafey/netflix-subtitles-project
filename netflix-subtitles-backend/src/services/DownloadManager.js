var http = require('http');
var iconv = require('iconv-lite');

function DownloadManager() {}

DownloadManager.prototype.download = function(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            var content = "";
            response
                .on("data", chunk => content += iconv.decode(new Buffer(chunk), "Windows-1255"))
                .on("end", () => resolve(content))
                .on("error", err => reject(err));
        });
    });
};

module.exports = DownloadManager;