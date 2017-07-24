var AWS = require("aws-sdk");
AWS.config.loadFromPath('./DynamoDB/dynamodb-config.json');


var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "upl_users",
    KeySchema: [       
        { AttributeName: "uID", KeyType: "HASH"}  //Partition key
    ],
    AttributeDefinitions: [       
        { AttributeName: "uID", AttributeType: "N" }, 
        { AttributeName: "username", AttributeType: "S" }, 
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
    }, 
    GlobalSecondaryIndexes: [{
        IndexName: "usernameIndex",
        KeySchema: [
        {
            AttributeName: "username",
            KeyType: "HASH"
        }
        ],
        Projection: {
            ProjectionType: "INCLUDE",
            NonKeyAttributes: ["password"]
        },
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }]
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Table created successfully!");
    }
});

