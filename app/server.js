var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var partials = require('express-partials');
var https = require('https');
var http = require('http');
var fs = require('fs');
var forceSSL = require('express-force-ssl');
var helmet = require('helmet');

var secure_router = require('./routes/secure_routes.js');
var auth_router = require('./routes/auth_routes.js');
var api_router = require('./routes/api.js');

var httpsEnabled = false;
var bypass = true;

// SSL
var sslkey = fs.readFileSync('../SSL/ssl-key.pem');
var sslcert = fs.readFileSync('../SSL/ssl-cert.pem');

var ssl_options = {
    key: sslkey,
    cert: sslcert
};

var app = express();
var resources = ['/public', '/js'];

// App configuration
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views/');


app.use(cookieParser());
app.use(session({
	secret: '4001P!nE',
	resave: false,
	saveUninitialized: true,
	cookie: {
	    secure: httpsEnabled,
	    httpOnly: httpsEnabled
	 }}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

if (httpsEnabled) {
	app.use(forceSSL);
}

app.use(initializeDevMode);
app.use(helmet());
initializeStaticRoutes()

app.use('/api', api_router)
app.use('/auth', auth_router);
app.use(secure_router);

var port = 8080;
var server = http.createServer(app);
var secureServer = https.createServer(app);

server.listen(8000);
secureServer.listen(8080);

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