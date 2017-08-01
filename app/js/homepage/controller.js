angular.module('homepage-app',['services.js'])

.controller('root-controller', ['$scope', 'modalService', 'profileService', function($scope, $modal, $profile) {
  $scope.currentModal = null;
  $scope.profileData = null;

  $scope.messageHeight = function() {
    var element = $('#welcome-panel-body');
    return element.outerHeight() - 10;
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


  $scope.$watch($modal.getTopModal, function(m) {
    $scope.currentModal = m;
  });

  var init = function() {
    $profile.init()
  };

  $scope.$watch($profile.getData, function(d) {
    $scope.profileData = d;

  });

  init()
}])

.controller('dues-form-controller', ['$scope', 'modalService', 'profileService', '$http', '$location', '$anchorScroll',
 function($scope, $modal, $profile, $http, $location, $anchorScroll) {
  $scope.payments = [
  {
    date : "",
    amount : ""
  }
  ];

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

  $scope.dateParse = function(index) {
    var date = $scope.payments[index].date;
    var parsedDate = "";
    date.replace("-", "");
    if (date.length >= 2) {
      parsedDate += date.substring(0, 1) + "-";
      if (date.length >= 4) {
        parsedDate += date.substring(2, 3) + "-";
      }
      $scope.payments[index].date = parsedDate;
    }
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

  $scope.getNumber = function(num) {
    return new Array(num);   
  }

  $scope.addPayment = function() {
    $scope.payments.push({
      date : "",
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

  $scope.submit = function() {
    var paymentDate = "09-10-17";
    var params;
    $scope.clearError();
    if ($scope.options.one) {
      params = {
        param0: JSON.stringify([{date: paymentDate, amount: $scope.obligation}])
      };
    }
    else if ($scope.options.two) {
      if (optionTwoSanity()) {
        if(paymentSanity()) {
          params = {
            param0: JSON.stringify($scope.payments)
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
            param0: JSON.stringify($scope.payments)
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
    $scope.loading = true;
    $http.post('/api/post-dues-form', params).then(
      function success(response) {
        $scope.loading = false;
        if (response.data.success) {
          $modal.popModal();
          $profile.setFormSubmitted();
          $profile.init();
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
      var dateRX = /^[0-9]{2}-[0-9]{2}-[0-9]{2}$/i;
      var amountRX = /^[0-9]+$/i;
      if (!dateRX.test(pmnt.date)) {
        $scope.reportError("All dates must conform to the specified format. Please try again");
        return false;
      }

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

  var init = function() {
    $scope.formSubmitted = $profile.isFormSubmitted();
    $scope.obligation = $profile.getDuesObligation();
  };

  init();
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
}]);