angular.module('services.js',[])

.service('modalService', function() {
	var that = this;
	var currentModal = null;

	this.openModal = function(name) {
		that.currentModal = name;
	};

	this.closeModal = function() {
		that.currentModal = null;
	};

	this.getModal = function() {
		return that.currentModal;
	};
})

.service('eventService', function(upcomingEventsJSON, submitPOST) {
	var that = this;
	var upcomingEventData = null;
	this.requestEventInfo = function() {
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = upcomingEventsJSON.query();
		query.$promise.then(
			function successCallback(response) {
				that.setUpcomingEventData(response.data);
			},
			function errorCallback(response) {
				console.log("Error: Couldn't get data");
			}
		);
	};

	this.addEvent = function(event) {
		var dateComps = event.date.split("/");
		var timeComps1 = event.time.split(" ");
		var timeComps = timeComps1[0].split(":");
		timeComps.push(timeComps1[1]);
		var datetime = "" + dateComps[2] + "-" + dateComps[0] + "-" + dateComps[1] + " ";
		if (timeComps[2] === "AM") {
			if (timeComps[0] === "12") {
				datetime = datetime + "00:" + timeComps[1] + ":00";
			} else {
				datetime = datetime + timeComps[0] + ":" + timeComps[1] + ":00";
			}
		}
		else if (timeComps[2] === "PM") {
			if (timeComps[0] === "12") {
				datetime = datetime + timeComps[0] + ":" + timeComps[1] + ":00";
			} else {
				var PMtime = parseInt(timeComps[0]) + 12;
				datetime = datetime + PMtime + ":" + timeComps[1] + ":00";
			}
		};
		var data = {param1: event.description, param2: event.location,  param3: datetime};
		var query = submitPOST("addEvent").save($.param(data));
		query.$promise.then(
			function successCallback(response) {
				console.log("Success!");
			},
			function errorCallback(response) {
				console.log("Error: Could submit update request");
			}
		);
	};

	this.getUpcomingEventData = function() {
		if (that.upcomingEventData) {
			return that.upcomingEventData;
		}
	};

	this.setUpcomingEventData = function(data) {
		that.upcomingEventData = data;
	};
})

.service('sessionService', function(sessionInfoJSON, submitPasswordPOST, validationService, submitEmailPOST, modalService) {
	var that = this;
	var sessionData = null;

	this.requestSessionInfo = function(uID) {
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = sessionInfoJSON.query(uID);
		query.$promise.then(
			function successCallback(response) {
				that.setData(response.data);
			},
			function errorCallback(response) {
				console.log("Error: Couldn't get data");
			}
		);
	};

	this.updateEmail = function(uID, email) {
		var data = {param1: uID, param2: email};
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = submitEmailPOST.save($.param(data));
		query.$promise.then(
			function successCallback(response) {
				console.log("Success!");
			},
			function errorCallback(response) {
				console.log("Error: Could submit update request");
			}
		);
	};

	this.postChangePassword = function(uID, password) {
		var data = {param1: uID, param2: password};
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = submitPasswordPOST.save($.param(data));
		query.$promise.then(
			function successCallback(response) {
				console.log("Success!");
			},
			function errorCallback(response) {
				console.log("Error: Could submit update request");
			}
		);
	};

	this.setData = function(data) {
		var status = validationService.generateValidationMessage(data);
		data.status = status;
		that.sessionData = data;
		if (data.email === "") {
			modalService.openModal('email');
		}
	};

	this.getData = function() {
		return that.sessionData;
	}
})

.service('submitService', function(submitPOST) {
	this.postIssue = function(uID, description) {
		var data = {param1: uID, param2: description};
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = submitPOST("reportIssue").save($.param(data));

		query.$promise.then(
			function successCallback(response) {
				console.log("Success!");
			},
			function errorCallback(response) {
				console.log("Error: Could submit update request");
			}
		);
	}
})

.service('expenseService', function(submitExpensePOST, expensesJSON, approveExpensesPOST, expenseUsageJSON, deleteExpenseGET) {
	var that = this;
	var unapprovedExpenses = null;
	var usageData = null;

	this.send = function(uID, data) {
		var data = {param1: uID, param2: data.account, param3: data.description, param4: data.amount};
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = submitExpensePOST.save($.param(data));
		query.$promise.then(
			function successCallback(response) {
				console.log("Success!");
			},
			function errorCallback(response) {
				console.log("Error: Could submit update request");
			}
		);
	};

	this.deleteExpense = function(uID) {
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		console.log("Deleting expense with ID: " + uID);
		var query = deleteExpenseGET.query(uID);
		query.$promise.then(
			function successCallback(response) {
				console.log("Success!");
			},
			function errorCallback(response) {
				console.log("Error: Couldn't get data");
			}
		);
		return true;
	} 

	this.requestUnapproved = function(account) {
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = expensesJSON.query(account, 0, 0);
		query.$promise.then(
			function successCallback(response) {
				that.setUnapproved(response.data);
			},
			function errorCallback(response) {
				console.log("Error: Couldn't get data");
			}
		);
	};

	this.requestUsage = function() {
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = expenseUsageJSON.query();
		query.$promise.then(
			function successCallback(response) {
				that.setUsage(response.data);
			},
			function errorCallback(response) {
				console.log("Error: Couldn't get data");
			}
		);
	}

	this.updateExpenses = function(approved_uIDs, paid_uIDs) {
		var data = {"approved_uIDs" : JSON.stringify(approved_uIDs), "paid_uIDs": JSON.stringify(paid_uIDs)};
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = approveExpensesPOST.save($.param(data));
		query.$promise.then(
			function successCallback(response) {
				console.log("Success!");
			},
			function errorCallback(response) {
				console.log("Error: Could submit update request");
			}
		);
	};

	this.setUsage = function(data) {
		that.usageData = data;
	};

	this.getUsage = function() {
		if (that.usageData !== null) {
			return that.usageData;
		}
	};

	this.setUnapproved = function(data) {
		that.unapprovedExpenses = data;
	};

	this.getUnapproved = function() {
		if (that.unapprovedExpenses) {
			return that.unapprovedExpenses;
		}
	};
})

.service('validationService', function(){
	this.validate = function(elem) {
		if (elem.paid === "1") {
			return true;
		}
		else {
			return false;
		}
	};

	this.generateValidationMessage = function(elem) {
		if (elem.abroad === "1") {
			return {ok: true, message: "Abroad"};
		}
		if (elem.paid === "1") {
			return {ok: true, message: "Paid! You're chillen"};
		}
		if (elem.formApproved === "1") {
			return {ok: false, message: "Form Approved!"};
		}
		if (elem.formRecieved === "1") {
			return {ok:false, message: "Awaiting Approval..."};
		}
		else {
			return {ok: false, message: "No Form Submitted"};
		}
	}
})

.service('brotherStatusService', function(brotherStatusJSON, updateBrotherPOST, validationService) {
	var that = this;
	var brotherStatusData = null;
	var lastUpdated = null;

	this.getBrotherStatusJSON = function() {
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = brotherStatusJSON.query();
		query.$promise.then(
			function successCallback(response) {
				that.setBrotherStatus(response.data);
				that.setLastUpdate(response.lastUpdated);
			},
			function errorCallback(response) {
				console.log("Error: Could not get brother status JSON data");
			}
		);
	};

	this.setBrotherStatus = function(data) {
		for (var i = 0; i < data.length; i++) {
			var ok = validationService.validate(data[i]);
			data[i].ok = ok;
		}
		that.brotherStatusData = data;
	};

	this.getBrotherStatus = function() {
		return that.brotherStatusData;
	};

	this.getLastUpdate = function() {
		return that.lastUpdated;
	};

	this.setLastUpdate = function(val) {
		that.lastUpdated = val;
	}

	this.update = function(updates) {
		var data = {"updates" : JSON.stringify(updates)};
		if(!navigator.onLine) {
			console.log("Error: No internet connection detected");
			return;
		}
		var query = updateBrotherPOST.save($.param(data));
		query.$promise.then(
			function successCallback(response) {
				console.log("Sucess!");
			},
			function errorCallback(response) {
				console.log("Error: Could submit update request");
			}
		);
	};
});