var AWS = require("aws-sdk");
var fs = require('fs');
var passwordHash = require('password-hash');

AWS.config.loadFromPath(__dirname + '/dynamodb-config.json');

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Resetting user information into DynamoDB. Please wait.");

var i = 0;
var successCount = 0;

var dues_status = {
    form_submitted : false,
    form_approved : false
}

var scan_params = {
  TableName : 'dev_upl_users',
  ProjectionExpression : "uID"
};

var dues_amounts = {
  proposed_amount : 0,
  agreed_amount: 0
}


var update_params = {
  TableName: 'dev_upl_users',
  Key: { uID : null },
  UpdateExpression: 'set #p = :p, #s = :s, #da = :da',
  ExpressionAttributeNames: {'#p' : 'charges', '#s' : 'dues_status', '#da' : 'dues_amounts'},
  ExpressionAttributeValues: {
    ':p' : [], 
    ':s' : dues_status, 
    ':da' : dues_amounts
  }
};

docClient.scan(scan_params, function(err, data) {
  if (err) {
    console.log("Failed to scan table!");
    console.log(err);
  }
  else {
    var users = data.Items;
    var totalCount = data.Count;
    var i = 0;
    var successCount = 0;
    users.forEach(function(user) {
      update_params.Key.uID = user.uID;
      docClient.update(update_params, function(err, data) {
        i++;
        if (err) {
          console.log(err);
        }
        else {
          successCount++;
        }
        if (i == totalCount) {
          console.log("Complete! " + successCount + "/" + totalCount + " entries updated!");
        }
      });
    });
  }
})

