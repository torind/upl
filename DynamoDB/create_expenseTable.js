var AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + '/dynamodb-config.json');


var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "upl_expenses",
    KeySchema: [       
        { AttributeName: "uDatetime", KeyType: "HASH"}  //Partition key
    ],
    AttributeDefinitions: [     
        { AttributeName: "uDatetime", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Table created successfully!");
    }
});

