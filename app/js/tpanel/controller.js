angular.module('tpanel-app',['services.js', 'ui.bootstrap'])

.controller('root-controller', ['$scope', 'modalService', 'duesService', function($scope, $modal, $dues) {
  $scope.currentModal = null;
  $scope.loaded = true;

  $scope.amounts = {
    paid: null,
    unpaid: null,
    total: null
  }

  $scope.formatDollar = function(val) {
    if (val != null) {
      return "$" + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    else {
      return "$..."
    }
  }

  $scope.click = function(){
    console.log("allBroChargeData")
    console.log($dues.allBroChargeData.getData());
    console.log("unpaidChargeData")
    console.log($dues.unpaidChargeData.getData());
    console.log("unsubmittedData")
    console.log($dues.unsubmittedData.getData());
    console.log("aggregateData")
    console.log($dues.aggregateData.getData());
  }

  $scope.openModal = function(modal_id) {
    $modal.pushModal(modal_id);
  };

  $scope.getModal = function(modal_id) {
    return $scope.currentModal == modal_id;
  }

  $scope.closeModal = function() {
    $modal.popModal();
  }

  $scope.hasModal = function() {
    return $scope.currentModal != null;
  }

  $scope.$watch($modal.getTopModal, function(m) {
    $scope.currentModal = m;
  });

  var init = function() {
    $dues.aggregateData.init();
  };

  $scope.$watch($dues.aggregateData.getData, function(data) {
    if (data != null) {
      $scope.amounts = data;
    }
  })

  init()
}])

.controller('nav-controller', ['$scope', 'filterService', 'modalService', function($scope, $f, $modal) {
    $scope.searchObj = $f.searchObj;
    $scope.filters = $f.filters;
}])

.controller('add-payment-controller', ['$scope', 'brotherhoodService', 'duesService', 'modalService', function($scope, $brohood, $dues, $modal) {
    $scope.showConfirmation = false;
    $scope.confirmation = null;
    $scope.postLoading = false;

    $scope.selectedUser = {
      name: "",
      uID: null
    };

    $scope.date = {
      open: false,
      date: new Date()
    };

    $scope.amount = null;

    $scope.error = {
      active : false,
      msg: ""
    };

    $scope.$watch($brohood.allUserData.getData, function(data) {
      if (data != null) {
        $scope.users = data;
      }
    });

    $scope.$watch($brohood.allUserData.isLoading, function(bool) {
      $scope.loadingUsers = bool;
    });

    // Name Selector //
    $scope.users = null;

    $scope.fullName = function(user) {
      if (typeof user == 'string') {
        return user;
      }
      else if (typeof user == 'object') {
        return user.firstName + " " + user.lastName;
      }
      else {
        return "";
      }
    }

    $scope.selectUser = function(item, model, label, event) {
      $scope.selectedUser.name = $scope.fullName(item);
      $scope.selectedUser.uID = item.uID;
    }

    $scope.searchFilter = function(user) {
      var selected = $scope.selectedUser.name ? $scope.selectedUser.name.toLowerCase() : "";
      if (user.firstName.toLowerCase().startsWith(selected) ||
        user.lastName.toLowerCase().startsWith(selected)) {
        return true;
      }
      return false;
    }
    // End Name Selector //

    // Date Picker Start //
    $scope.clear = function(index) {
      $scope.payments[index].date = null;
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      maxDate: new Date(2017, 11, 31),
      minDate: new Date(),
      startingDay: 1,
      showWeeks: false
    };

    $scope.open = function(index) {
      $scope.date.open = true;
    };

    $scope.format = 'dd-MMMM-yyyy';
    // Date Picker End //
    

    $scope.init = function() {
      $brohood.allUserData.init();
    }

    $scope.confirm = function() {
      $scope.clearError();
      if ($scope.selectedUser.uID == null) {
        $scope.reportError("Please try selecting a user again!");
        return;
      }
      if ($scope.date.date == null) {
        $scope.reportError("Please select a date");
        return;
      }
      if (isNaN(parseInt($scope.amount))) {
        $scope.reportError("Please enter a whole dollar amount");
      }
      if (parseInt($scope.amount) <= 0) {
        $scope.reportError("Please enter an amount greater than zero");
        return;
      }
      var options = { year: 'numeric', month: 'long', day: 'numeric' };
      $scope.confirmation = {
        uID : $scope.selectedUser.uID,
        date : $scope.date.date.toLocaleDateString('en-US', options),
        amount : parseInt($scope.amount),
        name : getName($scope.selectedUser.uID)
      }
      $scope.showConfirmation = true;
    }

    $scope.submit = function() {
      $scope.clearError();
      if ($scope.showConfirmation) {
        $scope.postLoading = true;
        var params = {
          uID : $scope.selectedUser.uID,
          date : $scope.date.date,
          amount : parseInt($scope.amount),
        }
        $dues.postPayment(params, function(result) {
          $scope.postLoading = false;
          if (result) {
            $modal.popModal();
          }
          else {
            $scope.reportError("An error occured submitting the charge. Please try again!");
          }
        });
      }
    }

    var getName = function(uID) {
      for (var i = 0; i < $scope.users.length; i++) {
        if (uID == $scope.users[i].uID) {
          return $scope.users[i].firstName + " " + $scope.users[i].lastName;
        }
      }
    }

    $scope.reportError = function(msg) {
      $scope.error.active = true;
      $scope.error.msg = msg;
    }

    $scope.clearError = function() {
      $scope.error.active = false;
      $scope.error.msg = "";
    }

    $scope.init();
}])

.controller('add-charge-controller', ['$scope', 'brotherhoodService', 'duesService', 'modalService', function($scope, $brohood, $dues, $modal) {
    $scope.showConfirmation = false;
    $scope.confirmation = null;
    $scope.postLoading = false;

    $scope.selectedUser = {
      name: "",
      uID: null
    };

    $scope.date = {
      open: false,
      date: new Date()
    };

    $scope.description = null;
    $scope.amount = null;

    $scope.error = {
      active : false,
      msg: ""
    };

    $scope.$watch($brohood.allUserData.getData, function(data) {
      if (data != null) {
        $scope.users = data;
      }
    });

    $scope.$watch($brohood.allUserData.isLoading, function(bool) {
      $scope.loadingUsers = bool;
    });

    // Name Selector //
    $scope.users = null;

    $scope.fullName = function(user) {
      if (typeof user == 'string') {
        return user;
      }
      else if (typeof user == 'object') {
        return user.firstName + " " + user.lastName;
      }
      else {
        return "";
      }
    }

    $scope.selectUser = function(item, model, label, event) {
      $scope.selectedUser.name = $scope.fullName(item);
      $scope.selectedUser.uID = item.uID;
    }

    $scope.searchFilter = function(user) {
      var selected = $scope.selectedUser.name ? $scope.selectedUser.name.toLowerCase() : "";
      if (user.firstName.toLowerCase().startsWith(selected) ||
        user.lastName.toLowerCase().startsWith(selected)) {
        return true;
      }
      return false;
    }
    // End Name Selector //

    // Date Picker Start //
    $scope.clear = function(index) {
      $scope.payments[index].date = null;
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      maxDate: new Date(2017, 11, 31),
      minDate: new Date(),
      startingDay: 1,
      showWeeks: false
    };

    $scope.open = function(index) {
      $scope.date.open = true;
    };

    $scope.format = 'dd-MMMM-yyyy';
    // Date Picker End //

    // Description Start //
    $scope.possibleDescriptions = ["Dues Payment", "JIB Fine"];
    // Description End //
    

    $scope.init = function() {
      $brohood.allUserData.init();
    }

    $scope.confirm = function() {
      $scope.clearError();
      if ($scope.selectedUser.uID == null) {
        $scope.reportError("Please try selecting a user again!");
        return;
      }
      if ($scope.date.date == null) {
        $scope.reportError("Please select a date");
        return;
      }
      if ($scope.description == null) {
        $scope.reportError("Please enter a description");
        return;
      }
      if (isNaN(parseInt($scope.amount))) {
        $scope.reportError("Please enter a whole dollar amount");
      }
      if (parseInt($scope.amount) <= 0) {
        $scope.reportError("Please enter an amount greater than zero");
        return;
      }
      var options = { year: 'numeric', month: 'long', day: 'numeric' };
      $scope.confirmation = {
        uID : $scope.selectedUser.uID,
        date : $scope.date.date.toLocaleDateString('en-US', options),
        description : $scope.description,
        amount : parseInt($scope.amount),
        name : getName($scope.selectedUser.uID)
      }
      $scope.showConfirmation = true;
    }

    $scope.submit = function() {
      $scope.clearError();
      if ($scope.showConfirmation) {
        $scope.postLoading = true;
        var params = {
          uID : $scope.selectedUser.uID,
          date : $scope.date.date,
          description : $scope.description,
          amount : parseInt($scope.amount),
        }
        $dues.postCharge(params, function(result) {
          $scope.postLoading = false;
          if (result) {
            $modal.popModal();
          }
          else {
            $scope.reportError("An error occured submitting the charge. Please try again!");
          }
        });
      }
    }

    var getName = function(uID) {
      for (var i = 0; i < $scope.users.length; i++) {
        if (uID == $scope.users[i].uID) {
          return $scope.users[i].firstName + " " + $scope.users[i].lastName;
        }
      }
    }

    $scope.reportError = function(msg) {
      $scope.error.active = true;
      $scope.error.msg = msg;
    }

    $scope.clearError = function() {
      $scope.error.active = false;
      $scope.error.msg = "";
    }

    $scope.init();
}])

.controller('unpaid-charges-controller', ['$scope', 'duesService', function($scope, $dues) {
  $scope.loading = false;
  $scope.unpaidCharges = [];

  $scope.init = function() {
    $dues.unpaidChargeData.init();
  }

  $scope.$watch($dues.unpaidChargeData.getData, function(data) {
    if (data != null) {
      $scope.unpaidCharges = data;
    }
  });

  $scope.formatDate = function(date) {
      var options = {month : "short", day: "numeric", year: "numeric"};
      return date.toLocaleDateString("en-us", options);
  }

  $scope.$watch($dues.unpaidChargeData.isLoading, function(bool) {
    $scope.loading = bool;
  });

  $scope.init();
}])

.controller('table-controller', ['$scope', 'filterService', 'duesService', function($scope, $f, $dues) {
  $scope.loading = true;
  $scope.approvalData = [];

  $scope.shouldShow = function(value, index, array) {
    if ((!$f.filters.received.on || value.dues_status.submitted == $f.filters.received.toggle) &&
      (!$f.filters.payingFull.on || value.dues_status.payingFull == $f.filters.payingFull.toggle) &&
      (!$f.filters.paymentPlan.on || value.dues_status.fullPlan == $f.filters.paymentPlan.toggle) &&
      (!$f.filters.discountedPlan.on || value.dues_status.discountedPlan == $f.filters.discountedPlan.toggle)) {

      if ($f.searchObj.text != "") {
        var sText = $f.searchObj.text;
        if (value.firstName.toLowerCase().startsWith(sText.toLowerCase()) ||
         value.lastName.toLowerCase().startsWith(sText.toLowerCase())) {
          return true;
        }
        else {
          return false;
        }
      }
      else {
        return true;
      }
    }
    return false;
  };

  $scope.abs = function(val) {
    return Math.abs(val);
  }

  $scope.init = function() {
    $dues.allBroChargeData.init();
  }

  $scope.$watch($dues.allBroChargeData.getData, function(data) {
    $scope.approvalData = data;
  })

  $scope.$watch($dues.allBroChargeData.isLoading, function(bool) {
    $scope.loading = bool;
  })

  $scope.init()
}])

.controller('expense-controller', ['$scope', '$http', function($scope, $http) {
  $scope.accounts = ["Treasurer", "Social", "Brotherhood", "Rush"];

  $scope.account_info = {};

  $scope.getSpent = function(account) {
    if (typeof $scope.account_info[account] == 'undefined') {
      return null;
    }
    return $scope.account_info[account].totals.spent;
  }

  $scope.format = function(val) {
    if (val != null) {
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    else {
      return "";
    }
  }

  $scope.getRemaining = function(account) {
    if (typeof $scope.account_info[account] == 'undefined') {
      return null;
    }
    return ($scope.account_info[account].totals.total - $scope.account_info[account].totals.spent).toFixed(2);
  }

  $scope.getName = function(account) {
    switch(account) {
      case 'Brotherhood':
        return 'Brohood';
      case 'Treasurer':
        return 'All'
      default:
        return account;
    }
  }

  $scope.getTotal = function(account) {
    if (typeof $scope.account_info[account] == 'undefined') {
      return null;
    }
    return $scope.account_info[account].totals.total;
  }

  var parseExpenseData = function(data, label) {
    var unapprovedExpenses = [];
    var approvedExpenses = [];

    var expenses = data.expenses;

    for (var i = 0; i < expenses.length; i++) {
      var date = new Date(expenses[i].uDatetime);
      expenses[i].date = date;
      if (expenses[i].approved) {
        approvedExpenses.push(expenses[i]);
        
      }
      else {
        unapprovedExpenses.push(expenses[i]);
      }
    }

    var parsedData = {
      unapprovedExpenses : unapprovedExpenses,
      approvedExpenses : approvedExpenses,
      totals : {
        total : data.budget,
        spent : 0,
        remaining : 0
      }
    }
    $scope.account_info[label] =  calcuateTotals(parsedData);
  }

  var calcuateTotals = function(data) {
    for (var i = 0; i < data.approvedExpenses.length; i++) {
      data.totals.spent += data.approvedExpenses[i].amount;
    }
    data.totals.spent = data.totals.spent.toFixed(2);
    data.totals.remaining = data.totals.total - data.totals.spent;

    return data;
  }

  var init = function() {
    for (var i = 0; i < $scope.accounts.length; i++) {
      var url = '/api/get-expenses?gt=' + $scope.accounts[i];
      $http.get(url).then(
        function sucess(response) {
          if (response.data.success) {
            parseExpenseData(response.data.data, response.data.data.account);
          }
          else {
            console.log(response.data.error);
          }
        }, function error(response) {
          console.log(response);
        })
    }
    
  };

  init();

}])

.directive('duesStatusEntry', function() {
  return {
    restrict : 'E',
    scope : {
      data : "="
    },
    link : function(scope, element, attrs) {
      scope.open = false;

      scope.formatDate = function(date) {
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      }

      scope.abs = function(val) {
        return Math.abs(val);
      }
    }, 
    replace : true,
    templateUrl : '/dues-status-entry.html'
  };
})

.directive('tpanelUnpaidCharge', function() {
  return {
    restrict : 'E',
    scope : {
      data : "="
    },
    link : function(scope, element, attrs) {
      scope.formatDate = function(date) {
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      }
    }, 
    replace : true,
    templateUrl : '/tpanel-unpaid-charge.html'
  };
})

.directive('uplSwitch', function() {
  return {
    restrict : 'E',
    scope : {
      open : '='
    },
    link : function(scope, element, attrs) {
      scope.toggleOpen = function() {
        scope.open = !scope.open;
      };

      scope.carrotDirection = function() {
        if (scope.open) {
          return 'glyphicon-chevron-down';
        }
        else {
          return 'glyphicon-chevron-up';
        }
      };
    }, 
    replace : true,
    template: "<span style='float:right; font-size:1.2em; cursor:pointer' class='glyphicon' ng-click='toggleOpen()'' ng-class='carrotDirection()'></span>"
  };
})

.directive('tpanelToggle', function() {
  return {
    restrict : 'E',
    scope : {
      data : "="
    },
    link : function(scope, element, attrs) {
      scope.toggle = function(bool) {
        scope.data.on = true;
        scope.data.toggle = bool;
      };

      scope.clear = function() {
        scope.data.on = false;
      };

      scope.highlight = function(bool) {
        if (scope.data.on && scope.data.toggle == bool) {
          return true;
        }
        return false;
      };
    }, 
    replace : true,
    templateUrl : '/tpanel-toggle.html'
  };
});

var sortCharges = function(a, b) {
  return a.date < b.date ? (a.date == b.date ? 0 : -1) : 1;
}