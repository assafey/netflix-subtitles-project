// routes
var argv = require('yargs').argv;
console.log("use secret file:", argv.secret_file);
require("./routes");
