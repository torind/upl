var AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + '/dynamodb-config.json');


var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "upl_users",
    ProjectionExpression: "uID, charges, dues_amounts, dues_status"
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
            var updateParams = {
                TableName : "qa_upl_users",
                Key : {uID :  item.uID},
                ExpressionAttributeNames: {
                    "#c" : "charges",
                    "#ds" : "dues_status",
                    "#da" : "dues_amounts"
                },
                ExpressionAttributeValues: {
                    ":c" : item.charges,
                    ":ds" : item.dues_status,
                    ":da" : item.dues_amounts
                }, 
                UpdateExpression: "set #c = :c, #ds = :ds, #da = :da"
            }
            docClient.update(updateParams, function(err, data) {
                counter++;
                if (err) {
                    console.log(err.message);
                }
                else {
                    successCount++;
                    if (counter == totalCount) {
                        console.log("Success! " + successCount + "/" + totalCount + " entries updated!");
                    }
                }
            })
        }
    }
})

