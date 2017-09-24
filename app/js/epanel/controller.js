var upl_dependencies = function() {
  if (window.epanel_type == 'Treasurer') {
    return ['services.js', 'ui.bootstrap', 'treasurer_controller.js'];
  }
  else {
    return['services.js', 'ui.bootstrap'];
  }
};

angular.module('epanel-app', upl_dependencies())

.controller('root-controller', ['$scope', 'expenseService', 'modalService', function($scope, $expense, $modal) {
  $scope.currentModal = null;
	$scope.loaded = true;
	$scope.epanel_type = window.epanel_type;

  $scope.totals = {};

  $scope.openModal = function(modal_id) {
    $modal.pushModal(modal_id);
  };

  $scope.getModal = function(modal_id) {
    return $scope.currentModal == modal_id;
  }

  $scope.closeModal = function() {
    $modal.popModal();
  }

  $scope.$watch($modal.getTopModal, function(m) {
    $scope.currentModal = m;
  });

	$scope.epanelHeading = function() {
		switch ($scope.epanel_type) {
			case "Brotherhood":
				return "Brotherhood Account Overview";
			case "Social":
				return "Social Account Overview";
			case "Rush":
				return "Rush Account Overview";
			case "Treasurer":
				return "All Accounts Overview";
		}
	}

  $scope.$watch($expense.expenseData.getData, function(data) {
    if (data != null) {
      $scope.totals = data.totals;
    }
  });

	$scope.formatDollar = function(val, decimals) {
	    if (val != null) {
        if (typeof decimals == 'undefined' || decimals == null) {
          return "$" + val.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        else {
          return "$" + val.toFixed(decimals).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
	    }
	    else {
	      return "$..."
	    }
  	};

  	$scope.init = function() {
      $expense.registerType(window.epanel_type);
  		$expense.expenseData.init();
  	}

  	$scope.init();
}])

.controller('active-expense-controller', ['$scope', 'expenseService', function($scope, $expense) {
  	$scope.expenses = null;
  	$scope.loaded = false;

  	$scope.$watch($expense.expenseData.getData, function(data) {
      if (data) {
        console.log(data);2
        $scope.expenses = data.activeExpenses;
      }
  	});

  	$scope.$watch($expense.expenseData.isLoading, function(bool) {
  		$scope.loaded = !bool;
  	});

    $scope.show = function() {
      if ($scope.expenses) {
        if ($scope.expenses.length > 0) {
          return true;
        }
      }
      return false;
    }

    $scope.formatDate = function(date) {
      var options = {month : "short", day: "numeric", year: "numeric"};
      return date.toLocaleDateString("en-us", options);
    }

  	var approveExpense = function(uDatetime) {
  		$expense.approveExpense(uDatetime, function(bool) {
  			if (bool) {
  				console.log("success");
  			}
  			else {
  				console.log("failed");
  			}
  		});
  	};

  	var deleteExpense = function(uDatetime) {
  		$expense.deleteExpense(uDatetime, function(bool) {
  			if (bool) {
  				console.log("success");
  			}
  			else {
  				console.log("failed");
  			}
  		});
  	}

    $scope.options = [
      {
        name : "Approve",
        handler : approveExpense
      },
      {
        name : "Delete",
        handler : deleteExpense
      }
    ];
}])

.controller('expense-history-controller', ['$scope', 'expenseService', function($scope, $expense) {
  	$scope.expenses = null;
  	$scope.loaded = false;

  	$scope.$watch($expense.expenseData.getData, function(data) {
      if (data) {
        $scope.expenses = data.passiveExpenses;
      }
    });

    $scope.$watch($expense.expenseData.isLoading, function(bool) {
      $scope.loaded = !bool;
    });

    $scope.formatDate = function(date) {
      var options = {month : "short", day: "numeric", year: "numeric"};
      return date.toLocaleDateString("en-us", options);
    }


    $scope.show = function() {
      if ($scope.expenses) {
        if ($scope.expenses.length > 0) {
          return true;
        }
      }
      return false;
    }

    var payExpense = function(uDatetime) {
      $expense.payExpense(uDatetime, function(bool) {
        if (bool) {
          console.log("success");
        }
        else {
          console.log("failed");
        }
      });
    };

  	$scope.options = [];

    $scope.$watch($expense.getRegisteredType, function(type) {
      if (type == 'Treasurer') {
        $scope.options = [{
          handler : payExpense,
          name : "Pay"
        }];
      }
    })

}])

.controller('submit-expense-controller', ['$scope', 'expenseService', 'modalService', function($scope, $expense, $modal) {
  $scope.postLoading = false;

  $scope.input = {
    account: "",
    description: "",
    amount: ""
  }

  $scope.error = {active: false, msg : null};

  $scope.possibleAccounts = ["Social", "Brotherhood", "Rush", "Admin"];

  $scope.searchFilter = function(item) {
    if (item.toLowerCase().startsWith($scope.input.account.toLowerCase())) {
      return true;
    }
    return false;
  }

  $scope.reportError = function(err) {
    $scope.error.active = true;
    $scope.error.msg = err;
  }

  $scope.clearError = function() {
    $scope.error.active = false;
  }

  $scope.submit = function() {
    $scope.postLoading = true;
    $scope.clearError();
    if (isNaN(parseFloat($scope.input.amount))) { $scope.reportError("Amount must be valid dollar amount") }
    else {
      $expense.postExpense($scope.input, function(success) {
        $scope.postLoading = false;
        if (success) {
          $modal.popModal();
        }
        else {
          $scope.postLoading = false;
          $scope.reportError("An error occured, please try again!");
        }
      });
    }
  }
}])

.controller('nav-controller', ['$scope', function($scope) {

}])

.directive('epanelExpense', function() {
  return {
    restrict : 'E',
    scope : {
      data : "=",
      options : "=",
      needsAttention: '='
    },
    link : function(scope, element, attrs) {
      scope.open = false;

      scope.optionClick = function() {
        console.log(scope.options);
      }

      scope.formatDate = function(date) {
        var options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      }

    }, 
    replace : true,
    templateUrl : '/epanel-expense.html'
  };
});