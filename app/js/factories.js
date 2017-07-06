angular.module('factories.js',['ngResource'])

.factory('updateBrotherPOST', function($resource) {
	'use strict';
	var resourse = $resource('/artifacts/updateBrother.php', {} , {
		save : {
			method: "POST",
			isArray: false,
			timeout: 4000,
			cancellable: true, 
			headers : {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		}
	});
	return resourse;
})

.factory('submitEmailPOST', function($resource) {
	'use strict';
	var resourse = $resource('/artifacts/updateEmail.php', {} , {
		save : {
			method: "POST",
			isArray: false,
			timeout: 4000,
			cancellable: true, 
			headers : {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		}
	});
	return resourse;
})

.factory('submitPasswordPOST', function($resource) {
	'use strict';
	var resourse = $resource('/artifacts/updatePhrase.php', {} , {
		save : {
			method: "POST",
			isArray: false,
			timeout: 4000,
			cancellable: true, 
			headers : {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		}
	});
	return resourse;
})

.factory('submitPaymentsPOST', function($resource) {
	'use strict';
	var resourse = $resource('/artifacts/insertPayments.php', {} , {
		save : {
			method: "POST",
			isArray: false,
			timeout: 4000,
			cancellable: true, 
			headers : {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		}
	});
	return resourse;
})

.factory('sessionInfoJSON', function($resource) {
	'use strict';
	var resourse = {
		query: function(uID) {
			return $resource('/artifacts/session_data.php', {} , {
				save : {
					method: "GET",
					isArray: false,
					timeout: 4000,
					cancellable: true,
					params: {param1 : uID}
				}
			}).save();
		}
	};
	return resourse;
})

.factory('approveExpensesPOST', function($resource) {
	var resourse = $resource('/artifacts/approveExpenses.php', {} , {
		save : {
			method: "POST",
			isArray: false,
			timeout: 4000,
			cancellable: true, 
			headers : {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		}
	});
	return resourse;
})

.factory('expensesJSON', function($resource) {
	'use strict';
	var resourse = {
		query: function(account, approved) {
			return $resource('/artifacts/getExpenses.php', {} , {
				save : {
					method: "GET",
					isArray: false,
					timeout: 4000,
					cancellable: true,
					params: {param1 : account, param2: approved}
				}
			}).save();
		}
	};
	return resourse;
})

.factory('expenseUsageJSON', function($resource) {
	'use strict';
	var resourse = {
		query: function(account, approved) {
			return $resource('/artifacts/getExpenseUsage.php', {} , {
				save : {
					method: "GET",
					isArray: false,
					timeout: 4000,
					cancellable: true
				}
			}).save();
		}
	};
	return resourse;
})

.factory('upcomingEventsJSON', function($resource) {
	'use strict';
	var resourse = {
		query: function(account, approved) {
			return $resource('/artifacts/getUpcomingEvents.php', {} , {
				save : {
					method: "GET",
					isArray: false,
					timeout: 4000,
					cancellable: true
				}
			}).save();
		}
	};
	return resourse;
})

.factory('submitExpensePOST', function($resource) {
	'use strict';
	var resourse = $resource('/artifacts/submitExpense.php', {} , {
		save : {
			method: "POST",
			isArray: false,
			timeout: 4000,
			cancellable: true, 
			headers : {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		}
	});
	return resourse;
})

.factory('deleteExpenseGET', function($resource) {
	'use strict';
	var resourse = {
		query: function(uID) {
			return $resource('/artifacts/deleteExpense.php', {} , {
				save : {
					method: "GET",
					isArray: false,
					timeout: 4000,
					cancellable: true,
					params: {param1 : uID}
				}
			}).save();
		}
	};
	return resourse;
})

.factory('brotherStatusJSON', function($resource) {
	'use strict';
	var resourse = {
		query: function() {
			return $resource('/artifacts/dues_data.php', {} , {
				save : {
					method: "GET",
					isArray: false,
					timeout: 4000,
					cancellable: true
				}
			}).save();
		}
	};
	return resourse;
})

.factory('submitPOST', function($resource) {
	'use strict';
	var resource = function(type) {
		var url;
		switch (type) {
			case "reportIssue" :
				url = '/artifacts/reportIssue.php';
				break;
			case "addEvent" :
				url = '/artifacts/addEvent.php';
				break;
		}
		return $resource(url, {} , {
			save : {
				method: "POST",
				isArray: false,
				timeout: 4000,
				cancellable: true, 
				headers : {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
			}
		})
	};
	return resource;
});