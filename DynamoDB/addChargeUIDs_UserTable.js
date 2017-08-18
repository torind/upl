var AWS = require("aws-sdk");
var fs = require('fs');
var passwordHash = require('password-hash');

AWS.config.loadFromPath(__dirname + '/dynamodb-config.json');

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Adding uIDs to all charges. Please wait.");

var params = {
	TableName: "dev_upl_users",
	ProjectionExpression: "uID, charges"
}

docClient.scan(params, function(err, data) {
	if (err) {
		logError(err);
		return;
	}
	else {
		var items = date.Items;
		var (i = 0; i < items.length; i++) {
			var charges = items[i].charges;
			var uID = items[i].uID;
			for (var j = 0; j < charges.length; j++) {
				charges.uID = j;
				var updateParams = {
					TableName : "dev_upl_users",
					Key : {uID : uID },
					UpdateExpression : "set charges = :c",
					ExpressionAttributeValues : {
						":c" : charges
					}
				}

			}
			
		}
	}
});

function logError(err) {
	console.log("Error! " + err);
}