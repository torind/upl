var express = require('express');
var AWS = require("aws-sdk");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var router = express.Router();
var dynamodb = new AWS.DynamoDB();

router.get('/indv_bro_profile', function(req, res) {
	console.log("here");
	var uID = req.session.uID;
	if (uID == 'undefined') {
		res.status(400).json("User id required for profile information.");
	}
	else {
		var params = {
		    TableName: "upl_users",
		    KeyConditionExpression: "#uID = :u",
		    ExpressionAttributeNames:{
		        "#uID": "uID"
		    },
		    ExpressionAttributeValues: {
	        	":u": {N: "" + uID},
	    	},
		};

		dynamodb.query(params, function(err, data) {
			if (err) {
				res.json({
					success : false,
					data: null,
					error: err
				});
			}
			else {
				if (data.Count == 1) {
					res.json({
						success: true,
						data: indv_bro_profile(data),
						err: null
					});
				}
				else {
					res.json({
						success: false,
						data: null,
						err: "Invalid uID."
					})
				}
			}
		});
	}
});

// Data Formatters
function indv_bro_profile(aws_data_obj) {
	var item = aws_data_obj.Items[0];
	var data = {
		uID : parseInt(item.uID.N),
		username : item.username.S,
		firstName : item.firstName.S,
		lastName : item.lastName.S,
		email : null,
		year : item.year.N,
		payments : item.payments.L,
		positions : item.positions.L,
		dues_status : {
			form_approved : item.dues_status.M.form_approved.BOOL,
			form_submitted : item.dues_status.M.form_submitted.BOOL
		}
	}
	return data;
};

module.exports = router;