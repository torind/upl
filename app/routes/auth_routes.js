var express = require('express');
var AWS = require("aws-sdk");
var passwordHash = require('password-hash');
var config = require(__dirname + "/../../config.js");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var router = express.Router();
var docClient = new AWS.DynamoDB.DocumentClient();

router.post('/login', function (req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	var params = {
	    TableName: config.userTable,
	    IndexName: "usernameIndex",
	    FilterExpression: "username = :u",
	   	ExpressionAttributeValues: {
        	":u": username
    	},
    	ProjectionExpression: "uID, username, password"
	};

	docClient.scan(params, function(err, data) {
		if (err) {
			console.log(err);
			res.redirect('/?fcode=3');
		}
		else {
			if (data.Count == 1) {
				if(passwordHash.verify(password, data.Items[0].password)) {
					var uID = data.Items[0].uID;
					var getParams = {
						TableName : config.userTable,
						Key : {uID : uID},
						ProjectionExpression : "positions"
					}
					docClient.get(getParams, function(err, data) {
						if (err) { res.redirect('/?fcode=3'); }
						else {
							req.session.uID = uID;
							req.session.positions = data.Item.positions;
							req.session.authenticated = true;
							res.redirect('/');
						}
					})
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