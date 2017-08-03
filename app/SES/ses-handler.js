var AWS = require("aws-sdk");
var ejs = require("ejs");
var fs = require("fs");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var SES = new AWS.SES({apiVersion: '2010-12-01'});



var handler = {};

handler.sendDuesFormConfirmation = function(email) {
  var from = 'UpennLions <et@upennlions.com>';
  var to = [email];
  var ejsStr = fs.readFileSync(__dirname + "/email_templates/dues_form_confirmation/confirmation-template.ejs", "utf-8");
  var htmlStr = ejs.render(ejsStr, {});

  SES.sendEmail( { 
     Source: from, 
     Destination: { ToAddresses: to },
     Message: {
         Subject: {
            Data: 'Dues Form Submission Confirmation'
         },
         Body: {
            Html: {
              Charset: "UTF-8", 
              Data: htmlStr
            }, 
          }
     }
  }
  , function(err, data) {
      if(err) throw err
          console.log('Email sent:');
          console.log(data);
   });
};

handler.sendDuesFormConfirmation("torindisalvo@gmail.com");

module.exports = handler;