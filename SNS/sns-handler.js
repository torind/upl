var AWS = require("aws-sdk");
var ejs = require("ejs");
var fs = require("fs");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var SNS = new AWS.SNS();

var handler = {};

handler.sendSignupConfirmation = function(number) {
	var msg = "Thank you for adding a phone number to your profile. You will now be able to " + 
		"recieve notifications and alerts by text message. \n\n Visit https://upennlions.com " + 
		"to change your notifiaction preferences.";
	var payload = {
		Subject: "UpennLions",
		Message: msg,
		MessageStructure: "string",
		PhoneNumber: number
	}

	SNS.publish(payload, function(err, data) {

	});
};

handler.sendPasswordReset = function(number, link, callback) {
	var msg = "Please follow this link to reset your password:\n" + link + 
		"\n\nThe link will expire in 6 hours."

	var payload = {
		Subject: "UpennLions",
		Message: msg,
		MessageStructure: "string",
		PhoneNumber: number
	}

	SNS.publish(payload, callback);
}

module.exports = handler;