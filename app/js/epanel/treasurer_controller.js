angular.module('treasurer_controller.js', ['services.js', 'ui.bootstrap'])

.controller('paid-expenses-controller', ['$scope', 'expenseService', function($scope, $expense) {
	$scope.expenses = null;
  	$scope.loaded = false;

  	$scope.$watch($expense.expenseData.getData, function(data) {
      if (data) { 
      $scope.expenses = data.paidExpenses;
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
}]);