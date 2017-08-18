'use strict';

angular.module('services.js',[])

.service('modalService', function() {
	var that = this;
	var modalQueue = [];

	this.pushModal = function(modal_id) {
		modalQueue.push(modal_id);
	};

	this.popModal = function() {
		modalQueue.pop();
	};

	this.getTopModal = function() {
		if (that.hasModal()) {
			return modalQueue[0];
		}
		else {
			return null;
		}
	};

	this.hasModal = function() {
		return (modalQueue.length > 0);
	}
})

.service('brotherhoodService', function($http, refreshService, HTTPGetFactory) {
	var that = this;

	var initUserData = function(callback) {
		$http.get('/api/all-users').then(
			function success(response) {
				if (response.data.success) {
					callback(null, response.data.data);
				}
				else {
					callback(response.error, null);
				}
			}, function error(response) {
				callback(response, null);
			}
		);
	}

	this.allUserData = HTTPGetFactory(initUserData);
})

.service('expenseService', function($http, HTTPGetFactory, refreshService) {
	var that = this;

	var registeredType = null;

	this.registerType = function(type) {
		registeredType = type;
	}

	this.getRegisteredType = function() {
		return registeredType;
	}

	this.postExpense = function(data, callback) {
		var params = {
			param0: data.account,
			param1: data.description,
			param2: data.amount
		}
		$http.post('/api/post-expense', params).then(
			function success(response) {
				if (response.data.success) {
					refreshService.refresh()
					callback(true)
				}
				else {
					console.log(response.data.error);
					callback(false)
				}
			}, function error(response) {
				console.log(response);
				callback(false)
			}
		);
	}

	this.deleteExpense = function(uDatetime, callback) {
		var params = {uID : uDatetime};
		$http.get('/api/delete-expense', {params : params}).then(
			function success(response) {
				if (response.data.success) {
					refreshService.refresh()
					callback(true);
				}
				else {
					console.log(response.data.error);
					callback(false);
				}
			}, function error(response) {
				console.log(response);
				callback(false);
			}
		);
	}

	this.payExpense = function(uDatetime, callback) {
		var params = {uID : uDatetime};
		$http.get('/api/pay-expense', {params : params}).then(
			function success(response) {
				if (response.data.success) {
					refreshService.refresh()
					callback(true);
				}
				else {
					console.log(response.data.error);
					callback(false);
				}
			}, function error(response) {
				console.log(response);
				callback(false);
			}
		);
	}

	this.approveExpense = function(uDatetime, callback) {
		var params = {uID : uDatetime};
		$http.get('/api/approve-expense', {params : params}).then(
			function success(response) {
				if (response.data.success) {
					refreshService.refresh()
					callback(true);
				}
				else {
					console.log(response.data.error);
					callback(false);
				}
			}, function error(response) {
				console.log(response);
				callback(false);
			}
		);
	}

	var parseExpenseData = function(data) {
		var activeExpenses = [];
		var passiveExpenses = [];
		var paidExpenses = [];

		var expenses = data.expenses;

		for (var i = 0; i < expenses.length; i++) {
			var date = new Date(expenses[i].uDatetime);
			expenses[i].date = date;
			if (expenses[i].approved) {
				if (expenses[i].paid) {
					paidExpenses.push(expenses[i]);
				}
				else {
					passiveExpenses.push(expenses[i]);
				}
				
			}
			else {
				activeExpenses.push(expenses[i]);
			}
		}
		activeExpenses.sort(sortCharges);
		passiveExpenses.sort(sortCharges);
		var parsedData = {
			activeExpenses : activeExpenses,
			passiveExpenses : passiveExpenses,
			paidExpenses : paidExpenses,
			totals : {
				total : data.budget,
				spent : 0,
				remaining : 0
			}
		}
		return calcuateTotals(parsedData);
	}

	var calcuateTotals = function(data) {
		if (registeredType == 'Treasurer') {
			for (var i = 0; i < data.passiveExpenses.length; i++) {
				data.totals.spent += data.passiveExpenses[i].amount;
			}
			for (var i = 0; i < data.paidExpenses.length; i++) {
				data.totals.spent += data.paidExpenses[i].amount;
			}
			
		}
		else {
			for (var i = 0; i < data.passiveExpenses.length; i++) {
				data.totals.spent += data.passiveExpenses[i].amount;
			}
		}
		data.totals.remaining = data.totals.total - data.totals.spent;
		return data;
	}

	var initExpenses = function(callback) {
		if (registeredType == null) { callback("Registered type not defined", null); }
		var queryString = "/api/get-expenses?gt=" + registeredType;
		$http.get(queryString).then(
			function success(response) {
				if (response.data.success) {
					
					callback(null, parseExpenseData(response.data.data));
				}
				else {
					callback(response.data.error, null);
				}
			}, 
			function error(response) {
				callback(response, null);
			}
		);
	}

	this.expenseData = HTTPGetFactory(initExpenses);
})

.service('filterService', function($http) {
	var that = this;

	this.searchObj = {
		text : ""
	};

	this.filters = {
      approved : {
        title : "Approved",
        toggle : false,
        on : false,
      },
      received : {
        title : "Received",
        toggle : false,
        value : false,
      },
      payingFull : {
        title : "Paying Full",
        toggle : false,
        value : false,
      },
      paymentPlan : {
        title : "Payment Plan",
        toggle : false,
        value : false,
      },
      discountedPlan : {
        title : "Discounted",
        toggle : false,
        value : false,
      }
    };
})

.service('duesService', function($http, refreshService, HTTPGetFactory) {
	var that = this;

	var initUnsubmittedData = function(callback) {
		$http.get('/api/dues_form_progress').then(
			function success(response){
				if (response.data.success) {
					callback(null, response.data.data);
				}
				else {
					console.log("Successful request but bad response!", response.data.data.error);
				}
			}, 
			function error(response) {
				console.log("Error: could not get unsubmittedData");
			});
	}

	var initAggregateData = function(callback) {
		$http.get('/api/agg-dues-data').then(
	      function successCallback(response) {
	        if (response.data.success) {
	        	var agg = {};
	          	agg.paid = response.data.data.paid ? response.data.data.paid : 0;
	          	agg.unpaid = response.data.data.unpaid ? response.data.data.unpaid : 0;
	          	agg.total = response.data.data.total ? response.data.data.total : 0;
	  			callback(null, agg);
	        }
	        else {
	          callback(response.data.error, null);
	        }
	      }, 
	      function errorCallback(response) {
	        callback(response, null);
	      });
	}

	var initRawBroData = function(callback) {
	    $http.get('/api/raw-bro-data').then(
	      function success(response) {
	        if (response.data.success) {
	          var rData = response.data.data;
	          parseRawData(rData);
	          callback(null, rData);
	        }
	        else {
	          callback(response.data.error, null);
	        }
	      }, function error(response) {
	        callback(response, null);
	      });
  	};

  	var parseRawData = function(rData) {
	    for (var i = 0; i < rData.length; i++) {
	      var charges = rData[i].charges;
	      var payments = rData[i].payments;

	      var chargeTotal = 0;
	      var paymentTotal = 0;
	      for (var j = 0; j < charges.length; j++) {
	        var d = new Date(charges[j].date);
	        charges[j].date = d;
	        chargeTotal += parseInt(charges[j].amount);
	      }

	      for (var j = 0; j < payments.length; j++) {
	        var d = new Date(payments[j].date);
	        payments[j].date = d;
	        paymentTotal += parseInt(payments[j].amount);
	      }
	      rData[i].chargeTotal = chargeTotal;
	      rData[i].paymentTotal = paymentTotal;

	      rData[i].charges.sort(sortCharges);
	      rData[i].payments.sort(sortCharges);
	    }
  	}

  	var initUnpaidCharges = function(callback) {
	    $http.get('/api/unpaid-charges').then(
	      function success(response) {
	        if (response.data.success) {
	          
	          var unpaidCharges = response.data.data;
	          for (var i = 0; i < unpaidCharges.length; i++) {
	            var c = unpaidCharges[i];
	            var date = new Date(c.date);
	            c.date = date;
	          }
	          callback(null, unpaidCharges.sort(sortCharges));
	        }
	        else {
	          callback(response.data.error, null);
	        }
	      }, function error(response) {
	        callback(response, null);
	      }
	    );
  	}

  	this.postCharge = function(data, callback) {
		var params = {
			param0: data.date,
			param1: data.uID,
			param2: data.description,
			param3: data.amount
		}
		$http.post('/api/post-user-charge', params).then(
			function success(response) {
				if (response.data.success) {
					callback(true)
					refreshService.refresh();
				}
				else {
					callback(false)
				}
			}, function error(response) {
				console.log(response);
				callback(false)
			}
		);
	}

	this.postPayment = function(data, callback) {
		var params = {
			param0: data.date,
			param1: data.uID,
			param2: data.amount
		}
		$http.post('/api/post-user-payment', params).then(
			function success(response) {
				if (response.data.success) {
					callback(true)
					refreshService.refresh();
				}
				else {
					callback(false)
				}
			}, function error(response) {
				callback(false)
			}
		);
	}

  	this.allBroChargeData = HTTPGetFactory(initRawBroData);
  	this.unpaidChargeData = HTTPGetFactory(initUnpaidCharges);
	this.unsubmittedData = HTTPGetFactory(initUnsubmittedData);
	this.aggregateData = HTTPGetFactory(initAggregateData);
})

.service('profileService', function($http, HTTPGetFactory, refreshService) {
	var that = this;

	var initIndvBroProfile = function(callback) {
		$http.get('/api/indv_bro_profile').then(
			function success(response) {
				if (response.data.success) {
					var new_data = parseProfileData(response.data.data);
					var needsPwdReset = new_data.passwordNeedsReset;
					if (typeof needsPwdReset != 'undefined' && needsPwdReset) {
						modalService.pushModal('account-setup');
					}
					callback(null, new_data);
				}
				else {
					callback(response.data.error.message, null);
				}
			},
			function errorCallback(response) {
				callback(response, null);
			});
	};

	this.indvProfileData = HTTPGetFactory(initIndvBroProfile);

	var parseProfileData = function(data) {
		// Process Payments
		var payments = data.payments;
		var charges = data.charges;
		var paymentTotal = 0;
		var chargeTotal = 0;

		for (var i = 0; i < payments.length; i++) {
			var date = new Date(payments[i].date);
			payments[i].date = date;
			paymentTotal += parseInt(payments[i].amount)
		}

		for (var i = 0; i < charges.length; i++) {
			var date = new Date(charges[i].date);
			charges[i].date = date;
			chargeTotal += parseInt(charges[i].amount);
		}
		
		data.paymentTotal = paymentTotal;
		data.chargeTotal = chargeTotal;

		data.charges.sort(sortCharges);
		data.payments.sort(sortCharges);

		//Process Expenses
		var unapproved = [];
		var approved = [];
		var paid = [];
		for (var i = 0; i < data.expenses.length; i++) {
			var e = data.expenses[i];
			e.date = new Date(e.uDatetime);
			if (e.paid) {
				paid.push(e);
			}
			else if (e.approved) {
				approved.push(e);
			}
			else {
				unapproved.push(e);
			}
		}
		data.expenses = {
			unapproved : unapproved,
			approved : approved,
			paid : paid
		};
		return data;
	}

})

.service('refreshService', function($http) {
	var listeners = [];

	this.registerListener = function(func) {
		listeners.push(func);
	};

	this.refresh = function() {
		for (var i = 0; i < listeners.length; i++) {
			listeners[i]();
		}
	};
})

.directive('uplProgressBar', function() {
    return {
    restrict : 'E',
    scope : {
      currentVal : '=',
      maxVal : '=',
      showTotal : '=',
      showPercentage : '='
    },
    link : function(scope, element, attrs) {
      scope.maxValString = function() {
      	if (scope.maxVal) {
        	return scope.maxVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      	}
      	return "";
      };

      scope.percentage = function() {
      	if (scope.currentVal && scope.maxVal) {
        	return Math.round(scope.currentVal / scope.maxVal * 100);
        }
        return 0;
      };

      scope.currentValString = function() {
      	if (scope.currentVal) {
        	return scope.currentVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
     		}
     		return "";
      };

      scope.progress = function() {
      	if (scope.maxVal && scope.currentVal) {
        	var per = scope.currentVal / scope.maxVal * 100;
        	return "" + per.toString() + "%";
        }
        return "0%"
      };
    }, 
    replace : true,
    templateUrl : '/upl-progress-bar.html'
  };
})

.factory('HTTPGetFactory', function(refreshService) {
	var factory = function(initFunction) {
		var factoryObj = {
			data: null,
			loading: true
		};
		factoryObj.setLoading = function(bool) {
			factoryObj.loading = bool;
		};
		factoryObj.getData = function() {
			return factoryObj.data;
		};
		factoryObj.isLoading = function() {
			return factoryObj.loading;
		}; 
		factoryObj.init = function() {
			factoryObj.loading = true;
			initFunction(function(err, new_data) {
				if (err) { null; factoryObj.loading = false; }
				else { factoryObj.data = new_data; factoryObj.loading = false; }
			})
		};
		refreshService.registerListener(factoryObj.init);
		return factoryObj;
	}
	return factory;
});

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