var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var partials = require('express-partials');
var router = require('./routes.js')


var app = express();

var resources = ['/public', '/js'];

// App configuration
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views/');


app.use(cookieParser());
app.use(session({
	secret: '4001P!nE',
	resave: false,
	saveUninitialized: true}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(checkAuth);
app.use(router);
initializeStaticRoutes()


app.listen(8080);

// Helper Methods
function checkAuth (req, res, next) {
	var devMode = true
	if (!devMode && req.url.startsWith("/secure") && (!req.session || !req.session.authenticated)) {
		res.render('login.ejs', {failedLogin : true, redirect : req.url})
		return;
	}
	next();
}

function initializeStaticRoutes() {
	for (var i = 0; i < resources.length; i++) {
		app.use(express.static(__dirname + resources[i]));
	}
}