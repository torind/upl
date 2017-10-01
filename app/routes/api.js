'use strict'
var express = require('express');
var AWS = require("aws-sdk");
var passwordHash = require('password-hash');
var sesHandler = require('../../SES/ses-handler.js');
var snsHandler = require('../../SNS/sns-handler.js');
var config = require(__dirname + "/../../config.js");
var async = require("async");
var database = require(__dirname + "/database.js");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var router = express.Router();
var docClient = new AWS.DynamoDB.DocumentClient();

router.use(checkAuth);

router.get('/indv_bro_profile', function(req, res) {
    var uID = parseInt(req.session.uID);
    if (uID == 'undefined') {
        res.status(400).json({
            success : false,
            data : null, 
            error : "User id required for profile information."
        });
    }
    else {
        var params = {
            TableName: config.userTable,
            Key : {
                uID : uID
            }
        };

        database.db_getFullUser(uID, function(err, data) {
            if (err) {
                res.json(err_factory(err));
            }
            else {
                res.json(scc_factory(indv_bro_profile(data)));
            }
        });
    }
});

// Data Formatters
function indv_bro_profile(data) {
    var dbItem = data;
    var cData = {
        firstName : dbItem.firstName,
        lastName : dbItem.lastName,
        balance: null,
        charges: null,
        expenses : dbItem.expenses,
        payments: dbItem.payments,
        dues_status: dbItem.dues_status,
        obligation: getObligation(dbItem.year),
        phoneNumber: dbItem.phone_number
    }
    popBalance(cData, dbItem);
    popAppliedPayments(cData, dbItem);
    popDuesAmounts(cData, dbItem);
    popPasswordReset(cData, dbItem);
    return cData;
};

function popDuesAmounts(cData, dbItem) {
    var obligation = getObligation(dbItem.year);
    cData.dues_amounts = {
        obligation : obligation,
        proposed : dbItem.dues_amounts.proposed_amount,
        agreed : dbItem.dues_amounts.agreed_amount
    }
}

function popAppliedPayments(cData, dbItem) {
    var appliedPayments = applyPayments(dbItem.charges, dbItem.payments);
    cData.charges = appliedPayments.charges;
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
        var proposed_amount = 0;
        console.log(payments);
        for (var i = 0; i < payments.length; i++) {
            proposed_amount += parseInt(payments[i].amount);
        }

        var dues_amounts = {
          proposed_amount : proposed_amount,
          agreed_amount : 0
        }

        var params = {
          TableName: config.userTable,
          Key: { uID : uID },
          UpdateExpression: 'set #p = :p, #s = :s, #d = :d',
          ExpressionAttributeNames: {'#p' : 'charges', '#s' : 'dues_status', '#d' : 'dues_amounts'},
          ExpressionAttributeValues: {
            ':p' : payments, 
            ':s' : dues_status,
            ':d' : dues_amounts
          }
        };

        var formattedPayments = [];
        for (var i = 0; i < payments.length; i++) {
            var date = new Date(payments[i].date);
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            var obj = {
                amount: payments[i].amount,
                date : date.toLocaleDateString('en-US', options)
            };
            formattedPayments.push(obj);
        }

        docClient.update(params, function(err, data) {
          if (err) {
              res.json({
                  success : false,
                  data : null, 
                  error : err
              });
          }
          else {
            sendConfirmationEmail(uID, formattedPayments);
            res.json({
                success: true,
                data: null,
                error: null
            });
          }
        });
    }
});

var sendConfirmationEmail = function(uID, formattedPayments) {
  var params = {
    TableName: config.userTable,
    Key: {
      uID: uID
    }, 
    ProjectionExpression : "email"
  };
  docClient.get(params, function(err, data) {
    if (err) {
      error_log(err);
    }
    else {
      var email = data.Item.email;
      sesHandler.sendDuesFormConfirmation(email, formattedPayments);
    }
  });
}

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
          TableName: config.userTable,
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

router.post('/post-phonenumber-setup', function(req, res) {
    var uID = parseInt(req.session.uID);
    if (uID == 'undefined') {
        res.status(400).json({
            success : false,
            data : null, 
            error : "User id required for profile setup"
        });
    }
    else {
        var number = req.body.param0;
        var params = {
          TableName: config.userTable,
          Key: { uID : uID },
          UpdateExpression: 'SET #pn = :pn',
          ExpressionAttributeNames: {'#pn' : 'phone_number'},
          ExpressionAttributeValues: {
            ':pn' : number
          }
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
            snsHandler.sendSignupConfirmation(number);
            res.json({
                success: true,
                data: null,
                error: null
            });
        }
    });
});

router.get('/dues_form_progress', function(req, res) {
    var params = {
        TableName: config.userTable,
        ProjectionExpression: 'firstName, lastName, dues_status'
    };

    docClient.scan(params, function(err, data) {
        if (err) {
            res.json({
                success: false,
                data: null,
                error: err
            });
        }
        else {
            var totalCount = data.Count;
            var unsubmittedCount = 0;
            var unsubmitted_names = [];
            var all = data.Items;
            var failed = false;
            for (var i = 0; i < all.length; i++) {
                var status = all[i].dues_status;
                if (status != null) {
                    if (!status.form_submitted) {
                        unsubmitted_names.push(all[i].firstName + " " + all[i].lastName);
                        unsubmittedCount += 1;
                    }
                }
                else {
                    failed = true;
                    res.json({
                        success: false,
                        error: "An error occured, please contact Torin",
                        data: null
                    })
                }
            }
            if (!failed) {
                var cData = {
                    totalCount : totalCount,
                    unsubmittedCount : unsubmittedCount,
                    names: unsubmitted_names
                }
                res.json({
                    success: true,
                    error: null,
                    data: cData
                });
            }
        }
    });
});

router.get('/agg-dues-data', function(req, res) {
    var params = {
        TableName : config.userTable,
        ProjectionExpression : "firstName, lastName, charges, payments"
    }
    docClient.scan(params, function(err, data) {
        if (err) {
            req.json({
                success : false,
                error: err,
                data: null
            });
        }
        else {
            var users = data.Items;
            var totalSum = 0;
            var shouldBePaidSum = 0;
            var paidSum = 0;
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                for (var j = 0; j < user.charges.length; j++) {
                    var c = user.charges[j];
                    totalSum += parseInt(c.amount);
                    var d = new Date(c.date);
                    if (new Date(c.date) < new Date()) {
                        shouldBePaidSum += parseInt(c.amount);
                    }
                }

                for (var j = 0; j < user.payments.length; j++) {
                    var c = user.payments[j];
                    paidSum += parseInt(c.amount);
                }

            }
            res.json({
                success: true,
                error: null,
                data: {
                    paid : paidSum,
                    unpaid : shouldBePaidSum - paidSum,
                    total : totalSum
                }
            });
        }
    })
});

router.get('/unpaid-charges', function(req, res) {
    var params = {
        TableName : config.userTable,
        ProjectionExpression : 'uID, firstName, lastName, charges, payments, dues_amounts, dues_status, #y',
        ExpressionAttributeNames: {"#y" : "year"}
    }

    docClient.scan(params, function(err, data) {
        if (err) {
            res.json({
                success : false,
                error: err,
                data: null
            });
        }
        else {
            var cData = [];
            var items = data.Items;
            for (var i = 0; i < items.length; i++) {
                var user = items[i];
                var appliedPayments = applyPayments(user.charges, user.payments);
                for (var j = 0; j < appliedPayments.charges.length; j++) {
                    var charge = appliedPayments.charges[j];
                    if (charge.chargeable && !charge.paid) {
                        cData.push({
                            firstName : user.firstName,
                            lastName: user.lastName,
                            date: charge.date, 
                            amount: charge.amount,
                            description: charge.description
                        })
                    }
                }
            }

            res.json({
                success: true,
                error: null,
                data: cData
            })
        }
    })
})

router.get('/raw-bro-data', function(req, res) {
    var params = {
        TableName : config.userTable,
        ProjectionExpression : 'uID, firstName, lastName, charges, payments, dues_amounts, dues_status, #y',
        ExpressionAttributeNames: {"#y" : "year"}
    }

    docClient.scan(params, function(err, data) {
        if (err) {
            res.json({
                success : false,
                error: err,
                data: null
            });
        }
        else {
            var cData = [];
            var items = data.Items;
            for (var i = 0; i < items.length; i++) {
                var user = items[i];
                var appliedPayments = applyPayments(user.charges, user.payments);
                var u = {
                    uID : user.uID,
                    firstName : user.firstName,
                    lastName : user.lastName,
                    charges : appliedPayments.charges, 
                    summary : popDuesFormSummary(user.year, user.charges, user.dues_status),
                    dues_status : popVerbDuesStatus(user.year, user.charges, user.dues_status),
                    obligation : getObligation(user.year),
                    payments : user.payments,
                    balance : appliedPayments.balance
                }
                cData.push(u);
            }
            res.json({
                success: true,
                error: null,
                data: cData
            })
        }
    })
});

var applyPayments = function(charges, payments) {
    var paymentTotal = 0;
    for (var i = 0; i < payments.length; i++) {
        var p = payments[i];
        paymentTotal += parseInt(p.amount);
    }
    charges.sort(sortCharges);
    
    for (var i = 0; i < charges.length; i++) {
        var c = charges[i];
        c.chargeable = false;
        c.paid = false;
        var date = new Date(c.date);
        if (date < new Date()) {
            c.chargeable = true;
            paymentTotal -= parseInt(c.amount);
            if (paymentTotal >= 0) {
                c.paid = true;
            }
            else {
                paymentTotal += parseInt(c.amount);
            }
        }
    }
    var r = {
        balance: paymentTotal,
        charges : charges
    }
    return r;
}

var duesStatusCode = function(year, charges, dues_status) {
    if (dues_status.form_submitted) {
        var obligation = getObligation(year);
        var payingAmount = 0;
        var numDuesCharges = 0;
        for (var i = 0; i < charges.length; i++) {
            if (charges[i].description == "Dues Payment") {
                payingAmount += parseInt(charges[i].amount);
                numDuesCharges ++;
            }
        }
        if (payingAmount == obligation && numDuesCharges == 1) {
            return 1;
        }
        else if (payingAmount == obligation && numDuesCharges > 1) {
            return 2;
        }
        else {
            return 3;
        }
    }
    else {
        return 0;
    }
}

var popVerbDuesStatus = function(year, charges, dues_status) {
    var obj = {
        submitted : false,
        payingFull : false,
        fullPlan : false,
        discountedPlan : false
    }
    switch(duesStatusCode(year, charges, dues_status)) {
        case 0:
            return obj
        case 1:
            obj.submitted = true;
            obj.payingFull = true;
            return obj;
        case 2:
            obj.submitted = true;
            obj.fullPlan = true;
            return obj;
        case 3:
            obj.submitted = true;
            obj.discountedPlan = true;
            return obj;
    }
}

var popDuesFormSummary = function(year, charges, dues_status) {
    switch(duesStatusCode(year, charges, dues_status)) {
        case 0:
            return "Not Submitted"
        case 1:
            return "Paying Full"
        case 2:
            return "Full Plan"
        case 3:
            return "Discounted Plan"
    }
}

router.get('/all-users', function(req, res) {
    var params = {
        TableName: config.userTable,
        ProjectionExpression: "firstName, lastName, uID"
    }

    docClient.scan(params, function(err, data) {
        if (err) {
            res.json({
                success: false,
                error: err,
                data: null
            })
        }
        else {
            var items = data.Items;
            res.json({
                success: true,
                error: null,
                data: items
            });
        }
    })
})

router.post('/post-user-charge', function(req, res) {
    var body = req.body;
    var date = req.body.param0;
    var uID = req.body.param1;
    var description = req.body.param2;
    var amount = req.body.param3;

    if (typeof amount != 'number') { res.json(err_factory("Amount must be a number")); return;}

    var newCharge = {
        date : date,
        description : description,
        amount : amount
    }

    var getParams = {
        TableName : config.userTable,
        Key : {uID : uID},
        ProjectionExpression : "charges"
    }

    docClient.get(getParams, function(err, data) {
        if (err) {
            res.json(err_factory(err));
            return;
        }
        else {
            var charges = data.Item.charges;
            charges.push(newCharge);
            var updateParams = {
                TableName : config.userTable,
                Key : {uID : uID},
                UpdateExpression : "set charges = :charges",
                ExpressionAttributeValues : {
                    ':charges' : charges
                }
            }

            docClient.update(updateParams, function(err, data) {
                if (err) {
                    res.json(err_factory(err));
                    return;
                }
                else {
                    res.json({
                        success: true,
                        error: null,
                        data: null
                    })
                }
            })
        }
    })

})

router.post('/post-user-payment', function(req, res) {
    var body = req.body;
    var date = req.body.param0;
    var uID = req.body.param1;
    var amount = req.body.param2;

    if (typeof amount != 'number') { res.json(err_factory("Amount must be a number")); return;}

    var newPayment = {
        date : date,
        amount : amount
    }

    var getParams = {
        TableName : config.userTable,
        Key : {uID : uID},
        ProjectionExpression : "payments"
    }

    docClient.get(getParams, function(err, data) {
        if (err) {
            res.json(err_factory(err));
            return;
        }
        else {
            var payments = data.Item.payments;
            payments.push(newPayment);
            var updateParams = {
                TableName : config.userTable,
                Key : {uID : uID},
                UpdateExpression : "set payments = :payments",
                ExpressionAttributeValues : {
                    ':payments' : payments
                }
            }

            docClient.update(updateParams, function(err, data) {
                if (err) {
                    res.json(err_factory(err));
                    return;
                }
                else {
                    res.json({
                        success: true,
                        error: null,
                        data: null
                    })
                }
            })
        }
    })

})

function checkAuth(req, res, next) {
    if (req.path != "/") {
        if (!req.session || !req.session.authenticated) {
            res.json({
                success: false,
                error: "Please authenticate to access this information",
                data: null
            })
            return;
        }
    }
    next();
}

function err_factory(err) {
    var json = {
        success: false,
        error: err,
        data: null
    }
    return json;
}

function scc_factory(data) {
    var json = {
        success: true,
        error: null,
        data: data
    }
    return json;
}

function getObligation(year) {
    switch(year) {
        case 2018 :
            return 700;
        case 2019 :
            return 850;
        case 2020:
            return 980;
        default:
            return 1000000;
    }
}

router.get('/get-expenses', function(req, res) {
    var type = req.query.gt;

    var filter;
    var projectionExpression;
    var accountKey;
    switch(type) {
        case 'Treasurer':
            accountKey = 'All';
            filter = null;
            projectionExpression = "uDatetime, account, amount, approved, description, submitter_uID, paid"
            break;
        case 'Social':
            accountKey = 'Social';
    filter = 'Social';
            projectionExpression = "uDatetime, account, amount, approved, description, submitter_uID"
            break;
        case 'Rush':
            accountKey = 'Rush';
            filter = 'Rush';
            projectionExpression = "uDatetime, account, amount, approved, description, submitter_uID"
            break;
        case 'Brotherhood':
            accountKey = 'Brotherhood'; 
            filter = 'Brotherhood';
            projectionExpression = "uDatetime, account, amount, approved, description, submitter_uID"
            break;
        default:
            var err_str = "Invalid type: " + type;
            res.json(err_factory(err_str));
            return;
    };
    var params = {
        TableName : config.expenseTable,
        ProjectionExpression : projectionExpression
    }
    if (filter) {
        params.ExpressionAttributeValues = { ":t" : filter };
        params.FilterExpression = "account = :t";
    }

    async.parallel([function getBudget(callback) {
        var getParams = {
            TableName : config.budgetTable,
            Key : { account : accountKey}
        }
        docClient.get(getParams, callback);
    }, function getExpenses(callback) {
        docClient.scan(params, function(err, data) {
            if (err) {
                callback("Expenses:" + err, 0);
            }
            else {
                var expenses = data.Items;
                async.each(expenses, function(obj, callback) {
                    var uID = obj.submitter_uID;
                    var params = {
                        TableName: config.userTable,
                        Key : {uID : uID}, 
                        ProjectionExpression : "firstName, lastName"
                    };
                    docClient.get(params, function(err, data) {
                        if (err) { callback(err); }
                        else {
                            obj.name = data.Item.firstName + " " + data.Item.lastName;
                            callback();
                        }
                    })
                }, function(err) {
                    if (err) {
                        callback(err, null)
                    }
                    else {
                        callback(null, expenses);
                    }
                })
            }
        });
    }], function parallelCallback(err, results) {
        if(err) {
            res.json(err_factory(err));
        }
        else {
            var data = {
                account : type,
                budget : results[0].Item.budget,
                expenses : results[1]
            }
            res.json(scc_factory(data));
        }
    });
});


router.get('/delete-expense', function(req, res) {
    var expense = {
        uDatetime : req.query.uID
    }

    if (!expense.uDatetime) {
        res.json(err_factory("Delete request must include a uID"));
    }
    else {
        database.db_deleteExpense(expense, function(err, data) {
            if (err) {
                res.json(err_factory(err));
            }
            else {
                res.json(scc_factory("Success!"))
            }
        })
    }
});

router.get('/approve-expense', function(req, res) {
    var uDatetime = req.query.uID;
    var params = {
        TableName : config.expenseTable,
        Key : {
            uDatetime : uDatetime
        },
        UpdateExpression : "set approved = :t",
        ExpressionAttributeValues : {
            ":t" : true
        }
    };
    docClient.update(params, function(err, data) {
        if (err) { res.json(err_factory(err)); }
        else {
            res.json(scc_factory(""));
        }
    });
});

router.get('/pay-expense', function(req, res) {
    var uDatetime = req.query.uID;
    var params = {
        TableName : config.expenseTable,
        Key : {
            uDatetime : uDatetime
        },
        UpdateExpression : "set paid = :t",
        ExpressionAttributeValues : {
            ":t" : true
        }
    };
    docClient.update(params, function(err, data) {
        if (err) { res.json(err_factory(err)); }
        else {
            res.json(scc_factory(""));
        }
    });
});

router.post('/post-expense', function(req, res) {
    var expense = {
        datetime : new Date().toString(),
        account : req.body.param0,
        description : req.body.param1,
        submitter_uID : req.session.uID,
        amount : req.body.param2
    }

    if (isNaN(parseFloat(expense.amount))) {res.json(err_factory("Amount must be a valid dollar amount"))}
    else {
        database.db_addExpense(expense, function(err, data) {
            if (err) {
                res.json(err_factory(err)); 
            }
            else {
                res.json(scc_factory("Success!"));
            }
        });
    }

});

var error_log = function(err) {
    if (err) {
      var currentdate = new Date();
      var datetime = "Last Sync: " + currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/" 
                    + currentdate.getFullYear() + " @ "  
                    + currentdate.getHours() + ":"  
                    + currentdate.getMinutes() + ":" 
                    + currentdate.getSeconds();
      console.log(datetime + "  ~~  API ~~" + err);
    }
};

var sortCharges = function(a, b) {
  if (a.date < b.date) {
    return -1;
  }
  else if (a.date > b.date) {
    return 1;
  }
  else {
    if (a.paid) { return -1; }
    if (b.paid) { return 1; }
    return 0;
  }
}

module.exports = router;