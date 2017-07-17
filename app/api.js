var express = require('express');
var router = express.Router();


//router.use(checkAuth);

router.get('/api/', function(req, res) {

});


function checkAuth (req, res, next) {
	var devMode = true
	if (!req.session || !req.session.authenticated) {
		res.status(401).send('Please log in to access this information');
		return;
	}
	next();
}

module.exports = router;