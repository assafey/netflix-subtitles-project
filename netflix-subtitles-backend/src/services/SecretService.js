var fs = require('fs');

function SecretService() {}

SecretService.prototype.secret = function(filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
};

module.exports = SecretService;