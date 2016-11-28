var http = require('http');
var iconv = require('iconv-lite');

function DownloadManager() {}

DownloadManager.prototype.download = function(encoding, url) {
    console.log("Downloading [" + encoding + "]:", url);
    if (encoding.indexOf("1255") >= 0) {
        encoding = "Windows-1255";
    } else if (encoding.indexOf("utf-8") >= 0) {
        encoding = "utf-8";
    }

    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            var content = "";
            response
                .on("data", chunk => content += iconv.decode(new Buffer(chunk), encoding))
                .on("end", () => resolve(content))
                .on("error", err => reject(err));
        });
    });
};

module.exports = DownloadManager;