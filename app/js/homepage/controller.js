'use strict'
angular.module('homepage-app',['services.js', 'ui.bootstrap'])

.controller('root-controller', ['$scope', 'modalService', 'profileService', function($scope, $modal, $profile) {
  $scope.currentModal = null;
  $scope.profileData = null;

  $scope.loaded = false;

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

  $scope.getBalance = function() {
    if ($scope.profileData != null) {
      return $scope.profileData.balance.toFixed(2);
    }
  }

  var init = function() {
    $profile.indvProfileData.init()
  };

  $scope.$watch($profile.indvProfileData.isLoading, function(bool) {
    if (!$scope.loaded) {
      $scope.loaded = !bool;
    }
  });

  $scope.$watch($profile.indvProfileData.getData, function(data) {
    if (data) {
      $scope.profileData = data;
    }
  });

  $scope.$watch($modal.getTopModal, function(m) {
    $scope.currentModal = m;
  });

  init()
}])

.controller('welcome-dashboard-controller', ['$scope' , 'profileService', function($scope, $profile) {
  $scope.welcome = {
    message : "",
    icon: null
  };

  $scope.profileData = null;
  $scope.showButton = false;

  $scope.messageHeight = function() {
    var element = $('#welcome-panel-body');
    var pad = 30;
    if ($scope.welcome.icon == 'ok') {
      return element.outerHeight() - 25 - pad;
    }
    else if ($scope.welcome.icon == 'alert') {
      return element.outerHeight() - 30 - pad;
    }
    else if ($scope.welcome.icon == 'warn') {
      return element.outerHeight() - 30 - pad;
    }
  }

  var displayMsg = function(icon, msg, showButton) {
    $scope.welcome.icon = icon;
    $scope.welcome.message = msg;
    $scope.showButton = showButton;
  }

  var parseData = function(data) {
    $scope.profileData = data;
    if (!data.dues_status.form_submitted) {
      displayMsg('alert', "Please submit a dues form as soon as possible!", false);
    }
    else {
      var charges = data.charges;
      for (var i = 0; i < charges.length; i++) {
        var c = charges[i];
        var nextWeekDate = (new Date()).setDate((new Date).getDate() + 7);
        if (c.date < new Date() && !c.paid) {
          displayMsg('alert', "You have an unpaid " + c.description + " in the amount of $" + c.amount + ". Please pay it immediately.", true);
          return;
        }
        else if (c.date < nextWeekDate && !c.paid) {
          var options = {weekday : 'short', month: 'short', day : 'numeric'};
          var date = c.date.toLocaleDateString('en-US', options);
          displayMsg('warn', "You have a upcoming " + c.description + " due on " + date + " in the amount of $" + c.amount + ".", true);
          return;
        }
        else {
          displayMsg('ok', "You have no upcoming payments due.", true);
        }
      }
    }
  }

  $scope.$watch($profile.indvProfileData.getData, function(data) {
    if (data != null) {
      parseData(data);
    }
  }, true);
}])

.controller('expense-dashboard-controller', ['$scope', 'profileService', function($scope, $profile) {
  $scope.expense = {
    unapproved : [],
    approved : [],
    paid : []
  }

  $scope.show = function() {
    var show = {
      openButton: false
    }
    if ($scope.expense.unapproved.length > 0 ||
      $scope.expense.approved.length > 0 ||
      $scope.expense.paid.length > 0) {
        show.openButton = true;
    }
    return show;
  }

  $scope.getExpenseMessage = function() {
    var approvedCount = $scope.expense.approved.length;
    var unapprovedCount = $scope.expense.unapproved.length
    var paidCount = $scope.expense.paid.length

    var _s = function(size) {
      var ret = size > 1 ? "s" : "";
      return ret;
    }

    if (unapprovedCount > 0 && approvedCount > 0) {
      return "You have " + approvedCount + " approved expense" + _s(approvedCount) +
        " and " + unapprovedCount +  " expense" + _s(unapprovedCount) + " pending approval";
    }
    else if (unapprovedCount > 0) {
      return "You have " + unapprovedCount + " expense" + _s(unapprovedCount) + " pending approval"
    }
    else if (approvedCount > 0) {
      return "You have " + approvedCount + " approved expense" + _s(approvedCount) + " pending payment"
    }
    else if (paidCount > 0) {
      return "You have no pending expenses at this time"
    }
    else {
      return "You have not submitted an expense this semester"
    }
  }

  $scope.$watch($profile.indvProfileData.getData, function(data) {
    if(data != null) {
      $scope.expense = data.expenses;
    }
  });

  $scope.$watch($profile.isProfileDataLoading, function(bool) {
    $scope.loading = bool;
  });
}])

.controller('expenses-modal-controller', ['$scope', 'profileService', 'modalService', function($scope, $profile, $modal) {
  $scope.expenses = [];
  $scope.amounts = {
    fronted : null,
    owed : null
  }

  $scope.$watch($profile.indvProfileData.getData, function(data) {
    if (data) {
      parseData(data.expenses);
    }
  });

  $scope.closeModal = function() {
    $modal.popModal();
  }

  $scope.formatDate = function(date) {
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  $scope.formatDollar = function(val) {
    if (val != null) {
      return "$" + val.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    else {
      return "";
    }
  }

  var parseData = function(expenses) {
    var allExpenses = [];
    var fronted = 0;
    var owed = 0;

    for (var i = 0; i < expenses.paid.length; i++) {
      var e = expenses.paid[i];
      fronted += e.amount;
      e.status = "Paid";
      allExpenses.push(e);
    }
    for (var i = 0; i < expenses.approved.length; i++) {
      var e = expenses.approved[i];
      fronted += e.amount;
      owed += e.amount;
      e.status = "Approved";
      allExpenses.push(e);
    }
    for (var i = 0; i < expenses.unapproved.length; i++) {
      var e = expenses.unapproved[i];
      e.status = "Pending";
      allExpenses.push(e);
    }
    allExpenses.sort(sortCharges);
    $scope.expenses = allExpenses;
    $scope.amounts = {
      fronted : fronted,
      owed : owed
    }
  };
}])

.controller('dues-form-controller', ['$scope', 'modalService', 'profileService', '$http', '$location', '$anchorScroll', '$window', 'refreshService',
 function($scope, $modal, $profile, $http, $location, $anchorScroll, $window, $refresh) {

  $scope.hasError = false;
  $scope.errorText = null;

  $scope.loading = false;

  $scope.obligation = "...";

  $scope.proposed = {
    text : ""
  };

  $scope.formSubmitted = true;

  $scope.options  = {
    one: false,
    two: false,
    three: false
  };

  var showErrorText = function() {
    $location.hash('errorText');
    $anchorScroll();
  };

  $scope.optionClick = function(num) {
    switch(num) {
      case 1: 
        if ($scope.options.one) {
          $scope.options.one = false;
        }
        else {
          $scope.options.one = true;
          $scope.options.two = false;
          $scope.options.three = false;
        }
        break;
      case 2: 
        if ($scope.options.two) {
          $scope.options.two = false;
        }
        else {
          $scope.options.one = false;
          $scope.options.two = true;
          $scope.options.three = false;
        }
        break;
      case 3: 
        if ($scope.options.three) {
          $scope.options.three = false;
        }
        else {
          $scope.options.one = false;
          $scope.options.two = false;
          $scope.options.three = true;
        }
      break;
    }
  }

  $scope.datePickerPosition = function() {
    if ($window.innerWidth < 640) {
      return "top-left"
    }
    else {
      return "top"
    }
  }

  $scope.datePickerPosition();

  $scope.addPayment = function() {
    $scope.payments.push({
      date : new Date(),
      opened: false,
      amount : ""
    });
  }

  $scope.reportError = function(str) {
    $scope.hasError = true;
    $scope.errorText = str;
    showErrorText();
  }

  $scope.clearError = function() {
    $scope.hasError = false;
    $scope.errorText = null;
  }

  $scope.formatPayments = function() {
    var formattedPayments = [];
    for (var i = 0; i < $scope.payments.length; i++) {
      var unformattedP = $scope.payments[i];
      var d = unformattedP.date;
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
      var formattedP = {
        amount : unformattedP.amount,
        description : "Dues Payment",
        date : unformattedP.date.toUTCString()
      }
      formattedPayments.push(formattedP);
    }
    return formattedPayments;
  }

  $scope.submit = function() {
    var params;
    $scope.clearError();
    if ($scope.options.one) {
      $scope.payments = [
        {
          date : new Date(2017, 8, 12, 0, 0, 0, 0),
          amount : $scope.obligation
        }
      ];
      var p = $scope.formatPayments();
      params = {
        param0: p
      };
    }
    else if ($scope.options.two) {
      if (optionTwoSanity()) {
        if(paymentSanity()) {
          params = {
            param0: $scope.formatPayments()
          };
        }
        else {
          return;
        }
      }
      else {
        $scope.reportError("Proposed amounts do not equal your charged amount.")
        return;
      }
    }
    else if ($scope.options.three) {
      if (optionThreeSanity()) {
        if(paymentSanity()) {
          params = {
            param0: $scope.formatPayments()
          };
        }
        else {
          return;
        }
      }
      else {
        $scope.reportError("Proposed amounts do not equal your proposed total.")
        return;
      }
    }
    else {
      $scope.reportError("Please choose an option before submitting!");
      return;
    }
    $scope.loading = true;

    $http.post('/api/post-dues-form', params).then(
      function success(response) {
        $scope.loading = false;
        if (response.data.success) {
          $modal.popModal();
          $refresh.refresh();
        }
        else {
          $scope.reportError(response.data.error);
        }
      },
      function error(response) {
        $scope.loading = false;
        $scope.reportError(response.statusText + " Please try again.");
      });
  }

  var optionTwoSanity = function() {
    var paymentSum = 0;

    for (var i = 0; i < $scope.payments.length; i++) {
      var int = parseInt($scope.payments[i].amount);
      if(int) {
        paymentSum += int;
      }
    }
    if (paymentSum == $scope.obligation) {
      return true;
    }
    else {
      return false;
    }
  }

  var optionThreeSanity = function() {
    var paymentSum = 0;

    for (var i = 0; i < $scope.payments.length; i++) {
      var int = parseInt($scope.payments[i].amount);
      if(int) {
        paymentSum += int;
      }
    }

    if (paymentSum == parseInt($scope.proposed.text)) {
      return true;
    }
    else {
      return false;
    }
  }

  var paymentSanity = function() {
    for (var i = 0; i < $scope.payments.length; i++) {
      var pmnt = $scope.payments[i];
      if (!paymentCheck(pmnt)) {
        return false;
      }
    }
    return true;
  }

  var paymentCheck = function(pmnt) {
    if (pmnt.date != "" || pmnt.amount != "") {
      var amountRX = /^[0-9]+$/i;
      if(!amountRX.test(pmnt.amount)) {
        $scope.reportError("All amounts must conform to the specified format. Please try again");
        return false;
      }
    }
    return true;
  }

  $scope.isDiscounted = function() {
    if ($scope.options.three) {
      return true;
    }
    else {
      return false;
    }
  }

  $scope.isShowMore = function() {
    if ($scope.options.two || $scope.options.three) {
      return true;
    }
    else {
      return false;
    }
  }

  $scope.payments = [
    {
      date : new Date(),
      opened: false,
      amount : ""
    }
  ];

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
    $scope.payments[index].opened = true;
  };

  $scope.format = 'dd-MMMM-yyyy';


  // End Date Picker JS

  var init = function() {
    $scope.formSubmitted = $profile.indvProfileData.getData().dues_status.form_submitted;
    $scope.obligation = $profile.indvProfileData.getData().obligation;
  };

  init();
}])

.controller('payment-info-controller', ['$scope', 'profileService', function($scope, $profile) {
  $scope.shouldShow = false;

  $scope.amounts = {
    total : 980,
    paid: 300,
    owed: 580
  };

  $scope.payments = [
  ];

  $scope.parseData = function(data) {
    if (data.dues_status.form_submitted) {
      $scope.shouldShow = true;
      $scope.amounts.total = data.chargeTotal;
      $scope.amounts.paid = data.paymentTotal;
      $scope.amounts.owed = $scope.amounts.total - $scope.amounts.paid;
      $scope.payments = data.charges;
    }
  }

  $scope.formatDate = function(date) {
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  $scope.$watch($profile.indvProfileData.getData, function(data) {
    if (data != null) {
      $scope.parseData(data);
    }
    else {
      $scope.shouldShow = false;
    }
  });
}])

.controller('account-setup-controller', ['$scope', 'modalService', '$http', function($scope, $modal, $http) {
  $scope.error = {
    active : false,
    msg : ""
  };

  $scope.email = {
    value : "",
    valid : true
  };

  $scope.password = {
    value: "", 
    valid: true
  }

  $scope.confirm = {
    value: "",
    valid: true
  }

  $scope.loading = false;

  $scope.email.validate = function(verbose) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var isEmail = re.test($scope.email.value);

    var pennRe = /.*(upenn).*/i;
    var hasPenn = pennRe.test($scope.email.value);
    var isValid = isEmail && !hasPenn;
    $scope.email.valid = isValid;
    
    if (verbose && !isValid) {
      if (hasPenn) {
        $scope.reportError("You may not use your Penn email");
      }
      else if (!isEmail) {
        $scope.reportError("Please enter a valid email");
      }
    }
    else {
      $scope.resetError()
    }
    return isValid;
  };

  $scope.password.validate = function(verbose) {
    var isValid = false;
    if ($scope.password.value.length > 4) {
      isValid = true;
    };
    $scope.password.valid = isValid;
    if (verbose && !isValid) {
      $scope.reportError("Password must be at least 5 characters. Please try again")
    }
    else {
      $scope.resetError()
    }
    return isValid;
  };

  $scope.confirm.validate = function(verbose) {
    if ($scope.password.value == $scope.confirm.value) {
      if ($scope.password.value != "lions1") {
        $scope.resetError;
        $scope.password.valid = true;
        $scope.confirm.valid = true;
        return true;
      }
      else {
        if (verbose) { $scope.reportError("New password cannot be lions1. Please try again"); }
        $scope.password.valid = false;
        $scope.confirm.valid = false;
        return false;
      }
    }
    else {
      if (verbose) { $scope.reportError("Passwords must match. Please try again"); }
        $scope.password.valid = false;
        $scope.confirm.valid = false;
      return false;
    }
  }

  $scope.reportError = function(error) {
    $scope.error.active = true;
    $scope.error.msg = error;
  }

  $scope.resetError = function() {
    $scope.error.active = false;
    $scope.error.msg = "";
  }

  $scope.submit = function() {
    if ($scope.email.validate(true) && $scope.password.validate(true) && $scope.confirm.validate(true)) {
      var params = {
        param0 : $scope.email.value,
        param1 : $scope.password.value
      }
      $scope.loading = true;
      $http.post('/api/post-account-setup', params).then(
        function success(response) {
          if (response.data.success) {
            $scope.loading = false;
            $modal.popModal()
          }
          else {
            console.log(response.data.error);
            $scope.loading = false;
            $scope.reportError("An error occured please try again. " + response.data.error.message);
          }
        }, function(response) {
            console.log(response)
            $scope.loading = false;
            $scope.reportError("An error occured please try again. " + response.statusText);
        });
    }
  }
}])

.controller('phone-number-controller', ['$scope', 'modalService', '$http', function($scope, $modal, $http) {
  $scope.phoneVal;

  $scope.error = {
    msg: null,
    active: false,
    reset: function() {
      this.msg = null;
      this.active = false
    },
    set: function(msg) {
      this.msg = msg;
      this.active = true;
    }
  }

  $scope.submit = function() {
    $scope.error.reset();
    if (validate()) {
      var fullNumber = "+1" + $scope.phoneVal;
      var params = {
        param0 : fullNumber
      }
      $scope.loading = true;
      $http.post('/api/post-phonenumber-setup', params).then(
        function success(response) {
          if (response.data.success) {
            $scope.loading = false;
            $modal.popModal()
          }
          else {
            console.log(response.data.error);
            $scope.loading = false;
            $scope.error.set("An error occured please try again. " + response.data.error.message);
          }
        }, function(response) {
            console.log(response)
            $scope.loading = false;
            $scope.error.set("An error occured please try again. " + response.statusText);
        });
    }
  }

  var validate = function() {
    if ($scope.phoneVal.length != 10 || isNaN($scope.phoneVal)) {
      $scope.error.set("Please enter a valid phone number");
      return false;
    }
    return true;
  }
}])

.controller('dues-form-progress-controller', ['$scope', 'duesService', function($scope, $dues) {
  $scope.totalCount = null;
  $scope.submittedCount = null;
  $scope.names = null;
  $scope.loading = true;

  $scope.init = function() {
    $dues.unsubmittedData.init();
  }

  $scope.$watch($dues.unsubmittedData.getData, function(data) {
    if (data!= null) {
      $scope.totalCount = data.totalCount;
      $scope.submittedCount = data.totalCount - data.unsubmittedCount;
      $scope.names = data.names;
    }
  });

  $scope.$watch($dues.unsubmittedData.isLoading, function(bool) {
    $scope.loading = bool;
  })

  $scope.refreshData = function() {
    $dues.unsubmittedData.init();
  }

  $scope.$watch($dues.unsubmittedData.loaded, function(bool) {
    $scope.loaded = bool;
  });

  $scope.percentage = function() {
    var percent = ($scope.submittedCount / $scope.totalCount) * 100;
    return percent.toFixed(0);
  }

  $scope.init();
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
          $scope.reportError("An error occured, please try again!");
        }
      });
    }
  }
}])

.directive('phoneInput', function($filter, $browser) {
    return {
        require: 'ngModel',
        link: function($scope, $element, $attrs, ngModelCtrl) {
            var listener = function() {
                var value = $element.val().replace(/[^0-9]/g, '');
                $element.val($filter('tel')(value, false));
            };

            // This runs when we update the text field
            ngModelCtrl.$parsers.push(function(viewValue) {
                return viewValue.replace(/[^0-9]/g, '').slice(0,10);
            });

            // This runs when the model gets updated on the scope directly and keeps our view in sync
            ngModelCtrl.$render = function() {
                $element.val($filter('tel')(ngModelCtrl.$viewValue, false));
            };

            $element.bind('change', listener);
            $element.bind('keydown', function(event) {
                var key = event.keyCode;
                // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
                // This lets us support copy and paste too
                if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)){
                    return;
                }
                $browser.defer(listener); // Have to do this or changes don't get picked up properly
            });

            $element.bind('paste cut', function() {
                $browser.defer(listener);
            });
        }

    };
})

.filter('tel', function () {
    return function (tel) {
        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 1:
            case 2:
            case 3:
                city = value;
                break;

            default:
                city = value.slice(0, 3);
                number = value.slice(3);
        }

        if(number){
            if(number.length>3){
                number = number.slice(0, 3) + '-' + number.slice(3,7);
            }
            else{
                number = number;
            }

            return ("(" + city + ") " + number).trim();
        }
        else{
            return "(" + city;
        }

    };
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
