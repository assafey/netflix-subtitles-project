var app = require("../app");
var subtitlesController = app.subtitlesController;
var express = require("express");
var router = express();
var bodyParser = require("body-parser");

// -------------- Setup --------------------
router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// -------------- Routes -------------------
router.post('/sub/serie/:language', (req, res) => subtitlesController.getSerieSubtitles(req, res));
router.post('/sub/movie/:language', (req, res) => subtitlesController.getMovieSubtitles(req, res));

// --------------- Server ------------------
router.listen(3000);