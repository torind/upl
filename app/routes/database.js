'use strict'
var express = require('express');
var AWS = require("aws-sdk");
var passwordHash = require('password-hash');
var sesHandler = require('../../SES/ses-handler.js');
var config = require(__dirname + "/../../config.js");
var async = require("async");

AWS.config.loadFromPath('../DynamoDB/dynamodb-config.json');

var router = express.Router();
var docClient = new AWS.DynamoDB.DocumentClient();

var database = {};

database.db_addExpense = function(expense, api_callback) {
	var expenseObj = {expense : expense};
	var parallelFunctions = [putExpense.bind(expenseObj), updateUserWithExpense.bind(expenseObj)]
	async.parallel(parallelFunctions, api_callback);
}

database.db_deleteExpense = function(expense, api_callback) {
	var expenseObj = {expense : expense };
	var getParams = {
		TableName : config.expenseTable,
		Key : { uDatetime : expense.uDatetime }
	}
	docClient.get(getParams, function(err, data) {
		if (err) {
			api_callback("Could not get expense based on uID", null);
		}
		else {
			if (data.Item) {
				expenseObj.expense.submitter_uID = data.Item.submitter_uID;
				removeExpenseFromUser.bind(expenseObj)(function(err, data) {
					if (err) {
						api_callback(err, null);
					}
					else {
						deleteExpense.bind(expenseObj)(api_callback);
					}
				});
			}
			else { api_callback("Invalid expense uID", null); }
		}
	})
}

database.db_getFullUser = function(uID, api_callback) {
	var params = {
		TableName : config.userTable,
		Key : {uID : uID }
	}
	docClient.get(params, function(err, data) {
		if (err) {
			var message = "Error: Could not get user for userID: " + uID;
			console.log(message);
			console.log(error);
			api_callback(message, null);
		}
		else {
			var user = data.Item;
			var expenseIDs = user.expenses;
			var expenses = [];
			if (typeof expenseIDs != 'undefined' && expenseIDs != null) {
				async.each(expenseIDs, getExpenseFromID.bind({expenses : expenses}) , function(err) {
					if (err) {
						api_callback(err, null);
					}
					else {
						user.expenses = expenses;
						api_callback(null, user);
					}
				})
			} 
			else {
				user.express = [];
				api_callback(null, user);
			}
		}
	});
}

var getExpenseFromID = function(uDatetime, callback) {
	var expenses = this.expenses;
	var params = {
		TableName : config.expenseTable,
		Key : {uDatetime : uDatetime}
	}
	docClient.get(params, function(err, data) {
		if (err) {
			var message = "Could not get expenses for uID: " + uDatetime;
			console.log(message);
			console.log(err);
			callback(message);
		}
		else {
			expenses.push(data.Item);
			callback();
		}
	})
}

var putExpense = function(callback) {
	var expense = this.expense;
	var expense_put_params = {
        TableName: config.expenseTable,
        Item: {
            uDatetime : expense.datetime,
            account : expense.account,
            description : expense.description,
            submitter_uID : expense.submitter_uID,
            amount : parseFloat(expense.amount)
        }
    }
    docClient.put(expense_put_params, function(err, data) {
    	if (err) {
    		console.log(err);
    		callback("Failed: An error occured adding the expense to the databse", null);
    	}
    	else {
    		callback(err, data);
    	}
    });
}

var deleteExpense = function(callback) {
	var expense = this.expense;
	var expense_delete_params = {
		TableName : config.expenseTable,
		Key : {uDatetime : expense.uDatetime}
	}
	docClient.delete(expense_delete_params, function(err, data) {
		if (err) {
			console.log(err);
			callback("An error occured deleting the expense from the table", null);
		}
		else {
			callback(null, "Success");
		}
	})
}

var updateUserWithExpense = function(callback) {
	var expense = this.expense;
	var getParams = {
		TableName: config.userTable,
		Key : {uID : expense.submitter_uID},
		ProjectionExpression : "expenses"
	}
	docClient.get(getParams, function(err, data) {
		if (err) {
    		console.log(err);
    		callback("Failed: An error occured getting user to append expense", null);
		}
		else {
			var expenses = data.Item.expenses;
			if (expenses) {
				expenses.push(expense.datetime);
			}
			else {
				expenses = [expense.datetime];
			}
			var updateParams = {
				TableName: config.userTable,
				Key : {uID : expense.submitter_uID},
				UpdateExpression : "set expenses = :e",
				ExpressionAttributeValues: {
					":e" : expenses
				}
			}
			docClient.update(updateParams, function(err, data) {
				if (err) {
		    		console.log(err);
		    		callback("Failed: An error occured appending the expense to the user", null);
		    	}
		    	else {
		    		callback(err, data);
		    	}
			});
		}
	})
}

var removeExpenseFromUser = function(callback) {
	var expense = this.expense;
	var getParams = {
		TableName: config.userTable,
		Key : {uID : expense.submitter_uID},
		ProjectionExpression : "expenses"
	}
	docClient.get(getParams, function(err, data) {
		if (err) {
    		console.log(err);
    		callback("Failed: An error occured getting user to remove expense", null);
		}
		else {
			var dbExpenses = data.Item.expenses;
			var expenseFound = false;
			for (var i = 0; i < dbExpenses.length; i++) {
				if (dbExpenses[i] == expense.uDatetime) {
					dbExpenses.splice(i, 1);
					expenseFound = true;
				}
			}
			if (expenseFound) {
				var updateParams = {
					TableName: config.userTable,
					Key : {uID : expense.submitter_uID},
					UpdateExpression : "set expenses = :e",
					ExpressionAttributeValues: {
						":e" : dbExpenses
					}
				}
				docClient.update(updateParams, function(err, data) {
					if (err) {
			    		console.log(err);
			    		callback("Failed: An error occured appending the expense to the user", null);
			    	}
			    	else {
			    		callback(err, data);
			    	}
				});
			}
			else {
				callback("Failed: Expense not found in user", null);
			}
		}
	})
}


module.exports = database;