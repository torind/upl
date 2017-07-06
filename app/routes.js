var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	if (req.session.authenticated == true) {
		res.redirect("/secure/home");
	}
	else {
		res.render('login.ejs');
	}
});

router.get('/secure/home', function(req, res) {
	res.render('homepage.ejs');
});


router.post('/login', function (req, res, next) {
	// you might like to do a database look-up or something more scalable here
	if (req.body.username && req.body.username === 'user' && req.body.password && req.body.password === 'pass') {
		req.session.authenticated = true;
		res.redirect('/secure/home');
	} else {
		res.render('login.ejs', {failedAttempt : true})
	}
});

module.exports = router

