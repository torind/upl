var AWS = require("aws-sdk");
var fs = require('fs');
var passwordHash = require('password-hash');
AWS.config.loadFromPath('./DynamoDB/dynamodb-config.json');


var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var hashKey = "uID";
var tableName = "upl_users";

var params = {
	TableName: tableName,
};

var i = 0;
docClient.scan(params, function(err, data) {
    if (err) console.log(err) // an error occurred
    	else {
    		console.log("Deleting items");
    		if (data.Items.length > 0) {
	    		data.Items.forEach(function(obj,i){
	    			var params = {
	    				TableName: tableName,
	    				Key: buildKey(obj),
	                ReturnValues: 'NONE', // optional (NONE | ALL_OLD)
	                ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
	                ReturnItemCollectionMetrics: 'NONE' // optional (NONE | SIZE)
	            	};

	            	var totalItems = data.Items.length
		            docClient.delete(params, function(err, data) {
		                if (err) console.log(err); // an error occurred
		                else {
							i++;
				            if (i == totalItems) {
				            	console.log(i + "/" + totalItems + " items delted");
				            	repopulate();
				            }
		            	}
		            });
		            
		        });
    		} 
    		else {
    			console.log("No items deleted.")
    			repopulate();
    		}
    	}
    });


var repopulate = function() {
	console.log("re-populating!");
	var dues_amounts_blank = {
		"proposed_amount": null,
		"agreed_amount" : null,
	};

	var dues_status_blank = {
		"form_submitted": false,
		"form_approved" : false
	};

	var i = 0;
	var successCount = 0;

	var allUsers = JSON.parse(fs.readFileSync('../bin/users.json', 'utf8'));
	var totalCount = allUsers.length;

	allUsers.forEach(function(user) {
		var params = {
			TableName: "upl_users",
			Item: {
				"uID": user.uID,
				"username": user.username,
				"password" : passwordHash.generate(user.password),
				"firstName":  user.firstName,
				"lastName": user.lastName,
				"email": null,
				"year":  user.year,
				"dues_amounts": dues_amounts_blank,
				"dues_status": dues_status_blank,
				"charges": [],
				"payments": [],
				"positions" : []
			}
		};

		docClient.put(params, function(err, data) {
			i += 1;
			if (err) {
				console.error("Unable to add user", user.firstName, " ", user.lastName,
					". Error JSON:", JSON.stringify(err, null, 2));
			}
			else {
				successCount += 1;
			}
			if (i == totalCount) {
				console.log("Population complete... ", successCount, "/", totalCount, " entries successfully updated.");
			}
		});
	});
}


function buildKey(obj){
	var key = {};
	key[hashKey] = obj[hashKey]

	return key;
}