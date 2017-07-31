// load aws sdk
var aws = require('aws-sdk');

// load aws config
aws.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var ses = new aws.SES({apiVersion: '2010-12-01'});

var sendEmail = function(toAddr, fromAddr, message) {
	var params = {
		Source: fromAddr, 
		Destination: { ToAddresses: toAddr },
		Message: {
		   Subject: {
		      Data: 'Thank You - Dues Form Submission Confirmation'
		   },
		   Body: {
		       Text: {
		           Data: 'Thank you for submitting your dues form.',
		       }
		    }
		}
	}

	ses.sendEmail(params, function(err, data) {
		if (err) {
			console.log("Error");
			console.log(err);
		}
		else {
			console.log('Email sent:');
        	console.log(data);
		}
	});
};

module.exports = sendEmail;