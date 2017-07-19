var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var partials = require('express-partials');

var secure_router = require('./routes/secure_routes.js');
var auth_router = require('./routes/auth_routes.js');
var api_router = require('./routes/api.js');

var devMode = true;

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
initializeStaticRoutes()

if (devMode) {
	app.use(initializeDevMode);
}

app.use('/api', api_router)
app.use('/auth', auth_router);
app.use(secure_router);




app.listen(8080);

function initializeStaticRoutes() {
	for (var i = 0; i < resources.length; i++) {
		app.use(express.static(__dirname + resources[i]));
	}
}

function initializeDevMode (req, res, next) {
		req.session.uID = 12;
		req.session.authenticated = true;
		next()
}