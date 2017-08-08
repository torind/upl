angular.module('homepage-app',['services.js', 'ui.bootstrap'])

.controller('root-controller', ['$scope', 'modalService', 'profileService', function($scope, $modal, $profile) {
  $scope.currentModal = null;
  $scope.profileData = null;

  $scope.welcomeIcon = null;
  $scope.loaded == false;

  $scope.welcomeMessage = "";

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

  $scope.showNextCharge = function() {
    if ($scope.profileData != null) {
      return $scope.profileData.charge_info.next_charge_date != null;
    }
  }

  $scope.showNextPayment = function() {
    if ($scope.profileData != null) {
      return $scope.profileData.payment_info.next_payment_date != null;
    }
  }

  $scope.messageHeight = function() {
    var element = $('#welcome-panel-body');
    if ($scope.welcomeIcon == 'ok') {
      return element.outerHeight() - 20;
    }
    else if ($scope.welcomeIcon == 'alert') {
      return element.outerHeight() - 30;
    }
    
  }

  $scope.$watch($modal.getTopModal, function(m) {
    $scope.currentModal = m;
  });

  var init = function() {
    $profile.init()
  };

  var parseData = function() {
    if ($scope.profileData.dues_status.form_submitted) {
      $scope.welcomeMessage = "Your dues form has been submitted. Thank you!"
      $scope.welcomeIcon = 'ok';
    }
    else {
      $scope.welcomeIcon = 'alert';
      $scope.welcomeMessage = "Please submit a dues form as soon as possible!"

    }
  }

  $scope.$watch($profile.getData, function(data) {
    if (data != null) {
      $scope.loaded = true;
      $scope.profileData = data;
      parseData();
    }
  }, true);

  init()
}])

.controller('dues-form-controller', ['$scope', 'modalService', 'profileService', '$http', '$location', '$anchorScroll', '$window',
 function($scope, $modal, $profile, $http, $location, $anchorScroll, $window) {

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
          $profile.refreshAfterFormSubmit();
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
    $scope.formSubmitted = $profile.isFormSubmitted();
    $scope.obligation = $profile.getDuesObligation();
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
      $scope.amounts.total = data.dues_amounts.agreed == 0 ? data.dues_amounts.proposed : data.dues_amounts.agreed;
      $scope.amounts.paid = 0;
      $scope.amounts.owed = $scope.amounts.total - $scope.amounts.paid;
      var charges = data.charge_info.charges;
      for (var i = 0; i < charges.length; i++) {
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        var date = new Date(charges[i].date).toLocaleDateString('en-US', options);
        $scope.payments.push({
          date: date,
          amount: charges[i].amount,
          description: charges[i].description
        });
      }
    }
  }

  $scope.$watch($profile.getData, function(data) {
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
    var isValid = re.test($scope.email.value);  
    $scope.email.valid = isValid;
    if (verbose && !isValid) {
      $scope.reportError("Please enter a valid email")
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
    var isValid = false;
    if ($scope.password.value == $scope.confirm.value) {
      isValid = true;
    }
    $scope.confirm.valid = isValid;
    if (verbose && !isValid) {
      $scope.reportError("Passwords must match. Please try again")
    }
    else {
      $scope.resetError()
    }
    return isValid;
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

.controller('dues-form-progress-controller', ['$scope', 'duesService', function($scope, $dues) {
  $scope.totalCount = null;
  $scope.submittedCount = null;
  $scope.names = null;
  $scope.loaded = false;

  $scope.init = function() {
    $dues.initUnsubmittedData()
  }

  $scope.$watch($dues.getUnsubmittedData, function(data) {
    if (data!= null) {
      $scope.totalCount = data.totalCount;
      $scope.submittedCount = data.totalCount - data.unsubmittedCount;
      $scope.names = data.names;
    }
  });

  $scope.$watch($dues.isLoaded, function(bool) {
    $scope.loaded = bool;
  });

  $scope.percentage = function() {
    var percent = ($scope.submittedCount / $scope.totalCount) * 100;
    return percent.toFixed(0);
  }

  $scope.init();
}])

.directive('uplProgressBar', function() {
    return {
    restrict : 'E',
    scope : {
      currentVal : '=',
      maxVal : '='
    },
    link : function(scope, element, attrs) {
      scope.maxValString = function() {
        return scope.maxVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      scope.percentage = function() {
        return Math.round(scope.currentVal / scope.maxVal * 100);
      };

      scope.currentValString = function() {
        return scope.currentVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      scope.progress = function() {
        per = scope.currentVal / scope.maxVal * 100;
        return "" + per.toString() + "%";
      };
    }, 
    replace : true,
    templateUrl : 'upl-progress-bar.html'
  };
});

