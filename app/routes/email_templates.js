var express = require('express');
var router = express.Router();
var sesHandler = require('../../SES/ses-handler.js');

var template_dir = __dirname + "/../../SES/email_templates/";

router.use(checkAuth);

router.get('/form_confirmation', function(req, res) {
	var params = {
		payments : [
			{
				date: "Aug 3, 2018",
				amount : 100
			},
			{
				date: "Aug 3, 2018",
				amount : 200
			},
			{
				date: "Aug 3, 2018",
				amount : 300
			}
		], 
		total: 700,
		path : ""
	};
	res.render(template_dir + "dues_form_confirmation/confirmation-template.ejs", params);
});

router.get('/payment_confirmation', function(req, res) {
	var params = {
		date: "Aug 21, 2018",
		amount: 700
	};
	res.render(template_dir + "payment_confirmation/payment_confirmation_template.ejs", params);
});

router.get('/send/form_confirmation', function(req, res) {
	var params = [
		{
			date: "Aug 3, 2018",
			amount : 100
		},
		{
			date: "Aug 3, 2018",
			amount : 200
		},
		{
			date: "Aug 3, 2018",
			amount : 300
		}
	];
	sesHandler.sendDuesFormConfirmation("torindisalvo@gmail.com", params);
	res.send("Success!");
});

function checkAuth (req, res, next) {
	if (!req.session || !req.session.authenticated || req.session.uID != 12) {
		res.redirect('/?fcode=2');
		return;
	}
	next();
}

module.exports = router;