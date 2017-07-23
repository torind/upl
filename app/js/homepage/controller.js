angular.module('homepage-app',['services.js'])

.controller('root-controller', ['$scope', 'modalService', 'profileService', function($scope, $modal, $profile) {
  $scope.currentModal = null;
  $scope.profileData = null;

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

.controller('dues-form-controller', ['$scope', 'modalService', 'profileService', '$http', function($scope, $modal, $profile, $http) {
  $scope.payments = [
  {
    date : "",
    amount : ""
  }
  ];

  $scope.hasError = false;
  $scope.errorText = null;

  $scope.obligation = "...";

  $scope.proposed = {
    text : ""
  };

  $scope.formSubmitted = false;

  $scope.options  = {
    one: false,
    two: false,
    three: false
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
        param0: 'paying_full',
        param1: JSON.stringify([{date: paymentDate, amount: $scope.obligation}])
      };
    }
    else if ($scope.options.two) {
      if (optionTwoSanity()) {
        if(paymentSanity()) {
          params = {
            param0: 'full_plan',
            param1: JSON.stringify($scope.payments)
          };

        }
      }
      else {
        $scope.reportError("Proposed amounts do not equal total amount.")
      }
    }
    else if ($scope.options.three) {
      if (optionThreeSanity()) {
        if(paymentSanity()) {
          params = {
            param0: 'discounted_plan',
            param1: JSON.stringify($scope.payments)
          };
        }
      }
      else {
        $scope.reportError("Proposed amounts do not equal total amount.")
      }
    }
    $http.post('/api/post_dues_form', params).then(
      function success(response) {
        if (response.data.success) {
          $modal.popModal();
        }
        else {
          $scope.reportError(response.data.error);
        }
      },
      function error(response) {
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
}]);