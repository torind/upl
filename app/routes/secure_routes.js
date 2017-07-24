var express = require('express');
var router = express.Router();

router.use(checkAuth);

router.get('/', function(req, res) {
	if (req.session.authenticated) {
		res.render('homepage/homepage.ejs');
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
			//console.log("Authentification failed!");
			return;
		}
	}
	next();
}




module.exports = router
