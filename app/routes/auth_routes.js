var express = require('express');
var AWS = require("aws-sdk");
var passwordHash = require('password-hash');
var config = require(__dirname + "/../../config.js");
var snsHandler = require('../../SNS/sns-handler.js');

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
							console.log("authenticated")
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

router.post('/forgotpassword', function(req, res) {
	var username = req.body.username;

	var params = {
	    TableName: config.userTable,
	    FilterExpression: "username = :u",
	   	ExpressionAttributeValues: {
        	":u": username
    	},
    	ProjectionExpression: "uID, username, phone_number"
	};

	docClient.scan(params, function(err, data) {
		if (err) {
			console.log(err);
			var msg = "A text message has been sent to you with instructions on how" + 
				    " to reset your account";
			var uri = '/?fcode=4&msg=' + encodeURI(msg);
			res.redirect(uri);
		}
		else {
			if (data.Count == 1) {
				var uID = data.Items[0].uID;
				var number = data.Items[0].phone_number;

				if (typeof number == 'undefined') {
					var msg = "There is no phone number assosciated with your account. Please contact" +
						"Torin to reset your password manually";
					var uri = '/?fcode=4&msg=' + encodeURI(msg);
					res.redirect(uri);
				}
				else {
					var reset_request = {
						date: new Date(),
						token: randomString(32)
					}

					var params = {
				      TableName: config.userTable,
				      Key: { uID : uID },
				      UpdateExpression: 'SET #rr = :rr',
				      ExpressionAttributeNames: {'#rr' : 'reset_request'},
				      ExpressionAttributeValues: {
				        ':rr' : reset_request
				      }
				    }

				    docClient.update(params, function(err, data) {
				    	if (err) {
				    		var msg = "An error occured. Please try again";
							var uri = '/?fcode=3&msg=' + encodeURI(msg);
							res.redirect(uri);
				    	}
				    	else {
				    		var link = config.domain + "/auth/resetpassword?uID=" + uID + "&" + 
				    			"key=" + reset_request.token;
				    		snsHandler.sendPasswordReset(number, link, function(err, data) {
				    			if (err) {
				    				var msg = "An error occured. Please try again";
									var uri = '/?fcode=3&msg=' + encodeURI(msg);
									res.redirect(uri);
				    			}
				    			else {
				    				var msg = "A text message has been sent to you with instructions on how" + 
					    			" to reset your account";
									var uri = '/?fcode=4&msg=' + encodeURI(msg);
									res.redirect(uri);
				    			}
				    		});
				    		
				    	}
				    })
				}
			}
			else {
				res.redirect('/?fcode=1')
			}
		}
	});
})

router.get('/resetpassword', function(req, res) {
	var uID = req.query.uID;
	if (isNaN(uID)) {
		res.redirect('/fcode=-1');
		return;
	}
	uID = parseInt(uID);
	var client_token = req.query.key;

	if (typeof uID == 'undefined' || typeof client_token == 'undefined') {
		res.redirect('/?fcode=-1');
		return;
	}
	var params = {
		TableName: config.userTable,
		Key : { uID : uID },
		ProjectionExpression : "reset_request"
	}

	docClient.get(params, function(err, data) {
		if (err) {
			console.log(err);
			res.redirect('/?fcode=-1');
		}
		else {
			var request = data.Item.reset_request;
			var date = new Date(request.date);
			var token = request.token;
			var hours_since = Math.abs(new Date() - date) / 36e5;
			if (hours_since > 6 || client_token != token) {
				var msg = "That reset link is expired. Please submit another reset request.";
				var uri = '/?fcode=3&msg=' + encodeURI(msg);
				res.redirect(uri);
			}
			else {
				var params;
				if (typeof req.query.msg != 'undefined') {
					params = {uID : uID, token : client_token, failMessage : req.query.msg};
				}
				else {
					params = {uID : uID, token : client_token}
				}
				res.render(__dirname + "/../views/reset_password/reset_password.ejs", params);
			}
		}
	});
})

router.post('/resetpassword', function(req, res) {
	var uID = req.body.uID;
	if (isNaN(uID)) {
		res.redirect('/?fcode=-1');
	}
	uID = parseInt(uID);
	var client_token = req.body.token;
	var password = req.body.password;
	var confirm = req.body.confirm;

	if (typeof uID == 'undefined' || typeof client_token == 'undefined' || typeof password == 'undefined') {
		res.redirect('/?fcode=-1');
	}

	if (password != confirm) {
		var msg = "Passwords do not match. Please try again.";
		res.redirect('/auth/resetpassword?uID=' + uID  + "&key=" + client_token + "&msg=" + msg);
		return;
	}

	if (password.length < 6) {
		var msg = "Password must be longer than 5 characters. Please try again.";
		res.redirect('/auth/resetpassword?uID=' + uID  + "&key=" + client_token + "&msg=" + msg);
		return;
	}

	var hashedPassword = passwordHash.generate(password);

	var params = {
		TableName: config.userTable,
		Key : { uID : uID },
		ProjectionExpression : "reset_request"
	}

	docClient.get(params, function(err, data) {
		if (err) {
			res.redirect('/?fcode=-1');
		}
		else {
			var request = data.Item.reset_request;
			var date = new Date(request.date);
			var token = request.token;
			var hours_since = Math.abs(new Date() - date) / 36e5;
			if (hours_since > 6 || client_token != token) {
				res.redirect('/?fcode=-1');
			}
			else {
				var params = {
					TableName: config.userTable,
					Key: { uID : uID },
					UpdateExpression : "set #p = :p",
					ExpressionAttributeNames : {"#p" : "password"},
					ExpressionAttributeValues : {":p" : hashedPassword}
				}

				docClient.update(params, function(err, data) {
					if (err) {
						res.redirect('/?fcode=-1');
					}
					else {
						var params = {
							TableName: config.userTable,
							Key: { uID : uID },
							UpdateExpression : "set reset_request = :e",
							ExpressionAttributeValues : {":e" : {}}
						}
						docClient.update(params, function(err, data) {
							if (err) {
								console.log(err);
								var msg = "Your password has been reset, but a small error occured. Please let Torin know.";
								var uri = '/?fcode=3&msg=' + encodeURI(msg);
								res.redirect(uri);
							}
							else {
								var msg = "Your password has been reset! Please log in.";
								var uri = '/?fcode=4&msg=' + encodeURI(msg);
								res.redirect(uri);
							}
						})
						
					};
				})
			}
		}
	})

})

function randomString(length) {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

module.exports = router;