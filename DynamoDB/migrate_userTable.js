var AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + '/dynamodb-config.json');


var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "upl_users"
}

var docClient = new AWS.DynamoDB.DocumentClient();

docClient.scan(params, function(err, data) {
    if (err) {
        console.log(err.message);
    }
    else {
        var copyItems = data.Items;
        var totalCount = copyItems.length;
        var counter = 0;
        var successCount = 0;
        for (var i = 0; i < copyItems.length; i++) {
            var item = copyItems[i];

            var putParams = {
                TableName : "sp18_upl_users",
                Key : {uID :  item.uID},
                Item: {
                    "uID" : item.uID,
                    "charges" : [],
                    "dues_amounts" : {agreed_amount: 0, proposed_amount: 0},
                    "dues_status" : {form_approved: false, form_submitted: false},
                    "email" : item.email,
                    "firstName" : item.firstName,
                    "lastName" : item.lastName,
                    "password" : item.password,
                    "payments" : [],
                    "phone_number" : item.phone_number,
                    "positions" : [],
                    "username" : item.username,
                    "year" : item.year
                }
            }
            docClient.put(putParams, function(err, data) {
                counter++;
                if (err) {
                    console.log(err.message);
                }
                else {
                    successCount++;
                    if (counter == totalCount) {
                        console.log("Success! " + successCount + "/" + totalCount + " entries added!");
                    }
                }
            })
        }
    }
})

