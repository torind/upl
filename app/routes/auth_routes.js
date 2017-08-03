var express = require('express');
var AWS = require("aws-sdk");
var passwordHash = require('password-hash');

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var router = express.Router();
var dynamodb = new AWS.DynamoDB();

router.post('/login', function (req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	var params = {
	    TableName: "upl_users",
	    IndexName: "usernameIndex",
	    FilterExpression: "username = :u",
	   	ExpressionAttributeValues: {
        	":u": {S: username}
    	},
    	ProjectionExpression: "uID, username, password"
	};

	dynamodb.scan(params, function(err, data) {
		if (err) {
			res.redirect('/?fcode=3');
		}
		else {
			if (data.Count == 1) {
				if(passwordHash.verify(password, data.Items[0].password.S)) {
					req.session.uID = data.Items[0].uID.N
					req.session.authenticated = true;
					res.redirect('/');
				}
				else {
					res.redirect('/?fcode=1')
				}
				
			}
			else {
				res.redirect('/?fcode=1')
			}
		}
	});
});

router.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/');
});

module.exports = router;