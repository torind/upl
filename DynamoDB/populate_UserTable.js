var AWS = require("aws-sdk");
var fs = require('fs');
var passwordHash = require('password-hash');

AWS.config.loadFromPath(__dirname + '/dynamodb-config.json');

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Importing user information into DynamoDB. Please wait.");

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

var allUsers = JSON.parse(fs.readFileSync(__dirname + '/../../bin/users.json', 'utf8'));
var totalCount = allUsers.length;

allUsers.forEach(function(user) {
    var params = {
        TableName: "qa_upl_users",
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

