var express = require('express');
var AWS = require("aws-sdk");
var passwordHash = require('password-hash');

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var router = express.Router();
var docClient = new AWS.DynamoDB.DocumentClient();

router.get('/indv_bro_profile', function(req, res) {
    var uID = parseInt(req.session.uID);
    console.log("uID: ", uID, ", type: ", typeof uID)
    if (uID == 'undefined') {
        res.status(400).json({
            success : false,
            data : null, 
            error : "User id required for profile information."
        });
    }
    else {
        var params = {
            TableName: "upl_users",
            Key : {
                uID : uID
            }
        };

        docClient.get(params, function(err, data) {
            if (err) {
                res.json({
                    success : false,
                    data: null,
                    error: err
                });
            }
            else {
                if (typeof data.Item != 'undefined') {
                    res.json({
                        success: true,
                        data: indv_bro_profile(data),
                        err: null
                    });
                }
                else {
                    res.json({
                        success: false,
                        data: null,
                        err: "Invalid uID."
                    })
                }
            }
        });
    }
});

// Data Formatters
function indv_bro_profile(aws_data_obj) {
    var dbItem = aws_data_obj.Item
    var cData = {
        firstName : dbItem.firstName,
        lastName : dbItem.lastName,
        balance: null,
        balance_alert: null,
        message: null,
        payment_info: null,
        charge_info: null,
        dues_status: null
    }
    popBalance(cData, dbItem);
    popMessage(cData, dbItem);
    popChargeInfo(cData, dbItem);
    popPaymentInfo(cData, dbItem);
    popDuesStatus(cData, dbItem);
    popPasswordReset(cData, dbItem);
    return cData;
};

function popDuesStatus(cData, dbItem) {
    var obligation;
    switch(dbItem.year) {
        case 2018 :
            obligation = 700;
            break;
        case 2019 :
            obligation = 850;
            break;
        case 2020:
            obligation = 980;
            break;
        default:
            obligation = 1000000;
    }
    cData.dues_status = {
        obligation : obligation,
        form_approved : dbItem.dues_status.form_approved,
        form_submitted : dbItem.dues_status.form_submitted 
    }
}

function popChargeInfo(cData, dbItem) {
    cData.charge_info = {
        next_charge_date : null,
        next_charge_amount : null,
        charges : []
    };
};

function popPaymentInfo(cData, dbItem) {
    cData.payment_info = {
        next_payment_date : null,
        next_payment_amount : null,
        charges: []
    };
};

function popMessage(cData, dbItem) {
    var balance = cData.balance;
    var message = "";
    if (!dbItem.dues_status.form_approved) {
        message = "Please submit a dues form for this semester!";
    }
    else if (!dbItem.dues_status.form_approved) {
        message = "Your dues form is being processed. No action is required as of now!";
    }
    else if (balance < 0) {
        message = "You have outstanding charges on your account. Please pay off your balance or reach out to Torin";
    }
    else {
        message = "You are chillen. No action is required right now."
    }
    cData.message = message;
};

function popBalance(cData, dbItem) {
    var charges = dbItem.charges;
    var payments = dbItem.payments;
    var totalCharge = 0;
    var totalPayments = 0;
    for (var i = 0; i < charges.length; i++) {
        var c = charges[i];
        var today = new Date()
        var cDate = new Date(c.date);
        if (cDate.getDate() < today.getDate()) {
            totalCharge += c.amount;
        }
    }
    for (var i =0; i < payments.length; i++) {
        var p = payments[i];
        var today = new Date()
        var pDate = new Date(p.date);
        if (pDate.getDate() < today.getDate()) {
            totalPayments += p.amount;
        }
    }
    cData.balance = totalPayments - totalCharge;
    cData.balance_alert = cData.balance < 0;
};

function popPasswordReset(cData, dbItem) {
    if (passwordHash.verify("lions1", dbItem.password)) {
        cData.passwordNeedsReset = true;
    }
}

router.post('/post-dues-form', function(req, res) {
    var uID = parseInt(req.session.uID);
    if (uID == 'undefined') {
        res.status(400).json({
            success : false,
            data : null, 
            error : "User id required for profile information."
        });
    }
    else {
        var payments = req.body.param0;
        var dues_status = {
            form_submitted : true,
            form_approved : false
        }
        var params = {
          TableName: 'upl_users',
          Key: { uID : uID },
          UpdateExpression: 'set #c = :p, #s = :s',
          ExpressionAttributeNames: {'#c' : 'charges', '#s' : 'dues_status'},
          ExpressionAttributeValues: {
            ':p' : payments, 
            ':s' : dues_status
        }
    };
    docClient.update(params, function(err, data) {
        if (err) {
            res.json({
                success : false,
                data : null, 
                error : err
            });
        }
        else {
            res.json({
                success: true,
                data: null,
                error: null
            });
        }
    });
}
});

router.post('/post-account-setup', function(req, res) {
    var uID = parseInt(req.session.uID);
    if (uID == 'undefined') {
        res.status(400).json({
            success : false,
            data : null, 
            error : "User id required for profile setup"
        });
    }
    else {
        var email = req.body.param0;
        var password = req.body.param1;
        var params = {
          TableName: 'upl_users',
          Key: { uID : uID },
          UpdateExpression: 'SET #e = :e, #p = :p',
          ExpressionAttributeNames: {'#e' : 'email', '#p': 'password'},
          ExpressionAttributeValues: {
            ':e' : email,
            ':p' : passwordHash.generate(password)
        }
    };
    docClient.update(params, function(err, data) {
        if (err) {
            res.json({
                success : false,
                data : null, 
                error : err
            });
        }
        else {
            res.json({
                success: true,
                data: null,
                error: null
            });
        }
    });
}
});

module.exports = router;