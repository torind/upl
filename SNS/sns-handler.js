var AWS = require("aws-sdk");
var ejs = require("ejs");
var fs = require("fs");
var config = require(__dirname + "/../config.js");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');
var docClient = new AWS.DynamoDB.DocumentClient();

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
	var msg = "UpennLions: Please follow this link to reset your password:\n" + link + 
		"\n\nThe link will expire in 6 hours."

	var payload = {
		Subject: "UpennLions",
		Message: msg,
		MessageStructure: "string",
		PhoneNumber: number
	}

	SNS.publish(payload, callback);
}

handler.sendPaymentConfirmation = function(uID, amount) {
	lookup_number(uID, function(err, data) {
		if (err) {
			console.log("Could not look up number");
		}
		else {
			if (data.Item.phone_number) {
				var msg = "UpennLions: Thank you for payment of $" + amount + ". The " +
					"payment has been credited to your account.\n\nLog onto https://upennlions.com" + 
					" at anytime to view your dues status."

				var payload = {
					Subject: "UpennLions",
					Message: msg,
					MessageStructure: "string",
					PhoneNumber: data.Item.phone_number
				}

				SNS.publish(payload, function(err, data) {
					if (err) {
						console.log("Sheit")
					}
				});
			}
		}
	});
}

handler.sendPaymentConfirmation = function(uID, amount) {
	var msg = "UpennLions: Thank you for payment of $" + amount + ". The " +
	"payment has been credited to your account.\n\nLog onto https://upennlions.com" + 
	" at anytime to view your dues status."

	send_message(uID, msg);
}

handler.sendExpenseRecievedConfirmation = function(uID, amount, desc) {
	var msg = "UpennLions: Your reimbursement request of $" + amount + " for \"" + desc
	+ "\" has been SUBMITTED.\n\nLog onto https://upennlions.com" + 
	" at anytime to view the status of your expenses."

	send_message(uID, msg);
}

handler.sendExpenseApprovedConfirmation = function(uDatetime) {
	lookupExpense(uDatetime, function(err, data) {
		if (err) {
			console.log("Error sending approval confirmation")
			console.log(err);
		}
		else {
			if (data.Item) {
				var amount = data.Item.amount;
				var desc = data.Item.description;
				var msg = "UpennLions: Your reimbursement request of $" + amount + " for \"" + desc
					+ "\" has been APPROVED.\n\nLog onto https://upennlions.com" + 
					" at anytime to view the status of your expenses."

				send_message(data.Item.submitter_uID, msg);
			}
		}
	})
}

handler.sendExpensePaidConfirmation = function(uDatetime) {
	lookupExpense(uDatetime, function(err, data) {
		if (err) {
			console.log("Error sending approval confirmation")
			console.log(err);
		}
		else {
			if (data.Item) {
				var amount = data.Item.amount;
				var desc = data.Item.description;
				var msg = "UpennLions: Your reimbursement request of $" + amount + " for \"" + desc
					+ "\" has been PAID.\n\nLog onto https://upennlions.com" + 
					" at anytime to view the status of your expenses."

				send_message(data.Item.submitter_uID, msg);
			}
		}
	})
}

var lookupExpense = function(uDatetime, callback) {
	var params = {
		TableName : config.expenseTable,
		Key : {uDatetime, uDatetime},
		ProjectionExpression : "submitter_uID, amount, description"
	}

	docClient.get(params, callback);
}

var send_message = function(uID, msg) {
	lookup_number(uID, function(err, data) {
		if (err) {
			console.log("Could not look up number");
			console.log(err);
		}
		else {
			if (data.Item.phone_number) {
				var payload = {
					Subject: "UpennLions",
					Message: msg,
					MessageStructure: "string",
					PhoneNumber: data.Item.phone_number
				}

				SNS.publish(payload, function(err, data) {
					if (err) {
						console.log("Sheit")
					}
				});
			}
		}
	});
}

handler.notify_keg_hit = function(names) {
	var message = "Keg has hit the critical mass! People in are:\n"

	for (let i = 0; i < names.length; i++) {
		message += names[i];
		if (i != names.length -1) {
			message += "\n"
		}
	}

	send_message(12, message);
}

var lookup_number = function(uID, callback) {
	var params = {
        TableName : config.userTable,
        Key: {uID: uID},
        ProjectionExpression : 'uID, phone_number'
    }

    docClient.get(params, callback);
}

module.exports = handler;