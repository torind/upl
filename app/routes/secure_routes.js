var express = require('express');
var router = express.Router();

router.use(checkAuth);


router.get('/tpanel', function(req, res) {
	res.render(__dirname + "/../views/tpanel/tpanel.ejs");
});

router.get('/epanel', function(req, res) {
	if (!req.session.positions) {
		res.status(401).send("You need to be logged in to view this resource");
	}
	else if (req.session.positions.length < 1) {
		res.status(401).send("You a position to view this resource");
	}
	else {
		res.setHeader('Cache-Control', 'no-cache');
		var position = req.session.positions[0];
		if (req.session.positions && req.session.positions.length > 0) {
			res.render(__dirname + "/../views/epanel/epanel.ejs", {position : req.session.positions[0]});
		}
		else {
			res.status(401).send("Invalid position. Please log in to continue");
		}
	}
})

router.get('/', function(req, res) {
	if (req.session.authenticated) {
		if (req.session.positions && req.session.positions.length > 0) {
			res.render('homepage/homepage.ejs', {position : req.session.positions[0]});
		}
		else {
			res.render('homepage/homepage.ejs')
		}
	}
	else {
		if (typeof req.query.fcode != 'undefined') {
			var fcodeInt = parseInt(req.query.fcode);
			switch(fcodeInt) {
				case 1:
					res.render('login.ejs', {failMessage : "Incorrect Username or Password"});
					break;
				case 2:
					res.render('login.ejs', {failMessage : "Please log in to view this resource"});
					break;
				case 3:
					res.render('login.ejs', {failMessage: req.query.msg});
					break;
				case 4:
					res.render('login.ejs', {message: req.query.msg});
					break;
				default:
					res.render('login.ejs', {failMessage : "An error occured. Please log in to continue"});
					break;
			}
		}
		else {
			res.render('login.ejs');
		}
	}
});

function checkAuth (req, res, next) {
	if (req.path != "/") {
		if (!req.session || !req.session.authenticated) {
			res.redirect('/?fcode=2');
			return;
		}
	}
	next();
}




module.exports = router

