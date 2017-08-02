var AWS = require("aws-sdk");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var SES = new AWS.SES({apiVersion: '2010-12-01'});


// send to list
var to = ['torindisalvo@gmail.com']

// this must relate to a verified SES account
var from = 'et@upennlions.com'

SES.sendEmail( { 
   Source: from, 
   Destination: { ToAddresses: to },
   Message: {
       Subject: {
          Data: 'A Message To You Rudy'
       },
       Body: {
           Text: {
               Data: 'Stop your messing around',
           }
        }
   }
}
, function(err, data) {
    if(err) throw err
        console.log('Email sent:');
        console.log(data);
 });