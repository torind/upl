var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var partials = require('express-partials');
var http = require('http');
var fs = require('fs');
var forceSSL = require('express-force-ssl');
var helmet = require('helmet');

var secure_router = require('./routes/secure_routes.js');
var auth_router = require('./routes/auth_routes.js');
var api_router = require('./routes/api.js');

var httpsEnabled = true;
var bypass = false;

var devMode = false;

var app = express();
var resources = ['/public', '/js'];

// App configuration
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views/');

if (httpsEnabled) {
	app.use(enforceHttps);
}

app.use(cookieParser());
app.use(session({
	secret: '4001P!nE',
	resave: false,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use(initializeDevMode);
app.use(helmet());
initializeStaticRoutes()

app.use('/api', api_router)
app.use('/auth', auth_router);
app.use(secure_router);

var port = 3000;
app.listen(port);
console.log("App is listening on port: " + port);

function initializeStaticRoutes() {
	for (var i = 0; i < resources.length; i++) {
		app.use(express.static(__dirname + resources[i]));
	}
}

function initializeDevMode (req, res, next) {

	if (bypass) {
	    req.session.uID = 12;
		req.session.authenticated = true;
	}

	next()
}

function enforceHttps(req, res, next) {
	if((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
        res.redirect('https://' + req.get('Host') + req.url);
    }
    else {
        next();
    }
}