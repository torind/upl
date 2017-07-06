angular.module('homepageApp',['services.js', 'factories.js', 'chart.js'])

.config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
      responsive: true,
      maintainAspectRatio: true,
      cutoutPercentage : 20,
      legend : {
        display : true,
        position: "bottom"
      },
      tooltips: {
        bodySpacing : 10,
        xPadding: 12,
        yPadding: 12,
        bodyFontSize: 14,
        callbacks : {
          label : function(elem, data) {
            var account = data.labels[elem.index];
            var amount = data.datasets[0].data[elem.index];
            return account + ": $" + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }
        }
      }
    });
    // Configure all line charts
    ChartJsProvider.setOptions('line', {
      showLines: false
    });
}])

.controller('mainController', function($scope, modalService) {
  $scope.currentModal = null;
  $scope.loaded = false;

  $scope.isOpen = function() {
    if ($scope.currentModal) {
      return true;
    }
    return false;
  };

  $scope.init = function() {
    $scope.loaded = true;
  };

  $scope.openModal = function(name) {
    modalService.openModal(name);
  };

  $scope.getModal = function(name) {
    if (name === $scope.currentModal) {
      return true;
    }
    else {
      return false;
    }
  };

  $scope.$watch(function() {
    return modalService.getModal();
  }, function(name) {
    if (name) {
      $scope.currentModal = name;
    }
    else {
      $scope.currentModal = null;
    }
  });

  $scope.close = function() {
    modalService.closeModal();
  }
})

.controller('currentUsageController', function($scope, expenseService) {
	$scope.open = true;
  $scope.usages = {
    social : 0,
    rush: 0,
    brohood: 0
  };

  $scope.max = {
    social : 9000,
    rush: 4351.16,
    brohood: 7000
  };

  $scope.init = function() {
    expenseService.requestUsage();
  };

  $scope.$watch(function() {
    return expenseService.getUsage();
  }, function(data) {
    if (data) {
      $scope.usages = data;
    }
  });

  $scope.totalUsage = function() {
    return $scope.usages.social + $scope.usages.rush + $scope.usages.brohood;
  };

  $scope.totalMax = function() {
    return $scope.max.social + $scope.max.rush + $scope.max.brohood;
  }
})

.controller('eventController', function($scope, eventService) {
  $scope.open = true;
  $scope.data = {};

  $scope.init = function() {
    eventService.requestEventInfo();
  };

  $scope.$watch(function() {
    return eventService.getUpcomingEventData();
  }, function(data) {
    $scope.data = data;
  });

  $scope.formatTime = function(date) {
    var comps = date.split(" ");
    var timeComps = comps[1].split(":");
    if (timeComps[0] > 12) {
      var newTime = timeComps[0] - 12;
      return newTime + ":" + timeComps[1] + " PM";
    }
    else if (timeComps[0] == 0) {
      return "12:" + timeComps[1] + " AM"
    }
    else if (timeComps[0] == 12) {
      return "12:" + timeComps[1] + " PM"
    }
    else {
      return timeComps[0] + ":" + timeComps[1] + " AM";
    }
  };

  $scope.formatDate = function(date) {
    var days = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"];
    var comps = date.split(" ");
    var javaDate = new Date(comps[0]);
    return days[javaDate.getDay()];
  };
  
})

.controller('addEventController', function($scope, eventService, modalService) {
  $scope.data = {
    date: "",
    time: "",
    description: "",
    location: ""
  };

  $scope.submit = function() {
    var dateRe = /\d\d\/\d\d\/\d\d\d\d/i;
    var timeRe = /\d\d:\d\d \w\w/i;
    if (dateRe.test($scope.data.date) && timeRe.test($scope.data.time) && $scope.data.description.length > 0 && $scope.data.location.length > 0) {
      eventService.addEvent($scope.data);
      modalService.closeModal();
    }
  };

  $scope.dateFormat = function(event) {
    var length = $scope.data.date.length;
    if (length === 2 || length === 5) {
      $scope.data.date = $scope.data.date + "/";
    }
  };

  $scope.timeFormat = function(event) {
    var length = $scope.data.time.length;
    if (length === 2) {
      $scope.data.time = $scope.data.time + ":";
    }
    else if (length === 5) {
      $scope.data.time = $scope.data.time + " ";
    }
  };
})

.controller('announceController', function($scope) {
  $scope.open = true;
})

.controller('navController', function($scope, sessionService) {
  $scope.open = true;
  $scope.name = "";
  $scope.userData = null;

  $scope.init = function(uID) {
    sessionService.requestSessionInfo(uID);
  };

  $scope.name = function() {
    if ($scope.userData) {
      return $scope.userData.firstName;
    }
  };
  $scope.message = function() {
    if ($scope.userData) {
      return $scope.userData.status.message;
    }
  };

  $scope.icon = function() {
    if ($scope.userData && $scope.userData.status.ok) {
      return 'glyphicon-ok';
    }
    else {
      return 'glyphicon-alert';
    }
  };

  $scope.$watch(function() {
    return sessionService.getData();
  }, function(data) {
    if (data) {
      $scope.userData = data;
    }
  });

  $scope.complianceClass = function() {
    if ($scope.userData && $scope.userData.status.ok) {
      return 'compliant';
    }
    else {
      return 'non-compliant';
    }
  };
})

.controller('individualDuesController', function($scope, $interval, brotherStatusService) {
	$scope.open = true;
  $scope.data = null;
  $scope.lastUpdated = "";

  $scope.format = function(val) {
    if (val === "1") {
     return true;
   }
   else {
     return false;
   }
  };

  $scope.rowType = function(index) {
    if ($scope.data[index].paid === "1") {
      return "success";
    }
    else {
      return "danger";
    }
  };

  $scope.init = function() {
    brotherStatusService.getBrotherStatusJSON();
  };

  $scope.$watch(function() {
    return brotherStatusService.getBrotherStatus();
  }, function(data) {
    $scope.data = data;
  });

  $scope.$watch(function() {
    return brotherStatusService.getLastUpdate();
  }, function(timestamp) {
    if (timestamp) {
      var lastDate = formatDate(timestamp);
      var time = timestamp.split(" ")[1];
      $scope.lastUpdated = lastDate + " - " + time;
    }

  });
})

.controller('approvalController', function($scope, expenseService, modalService) {
  $scope.data = [];

  $scope.init = function(privilige) {
    var account = "";
    switch(privilige) {
      case 10: 
        account = "All";
        break;
      case 7 :
        account = "Brotherhood";
        break;
      case 6 :
        account = "Rush";
        break;
      case 5 :
        account = "Social";
        break;
    }
    if (account !== "") {
      expenseService.requestUnapproved(account);
    }
  }

  $scope.$watch(function() {
    return expenseService.getUnapproved();
  }, function(data) {
      if (data) {
        $scope.data = data;
      }
  });

  $scope.deleteExp = function(index) {
    if ($scope.data[index].approved == 0) {
      var result = confirm("Are you sure you want to delete this expense?");
      if (result) {
        if(expenseService.deleteExpense($scope.data[index].uID)) {
          $scope.data.splice(index, index + 1);
        }
      }
    }
    else {
      alert("You may not delete an expense that is already approved!");
    }
  };

  $scope.date = function(index) {
    return formatDate($scope.data[index].timestamp);
  };

  $scope.approve = function(index) {
    if ($scope.data[index].approved == 0) {
      $scope.data[index].approved = 1;
    }
    else {
      $scope.data[index].approved = 0;
    }
  };

  $scope.pay = function(index) {
    if ($scope.data[index].paid == 0) {
      $scope.data[index].paid = 1;
    }
    else {
      $scope.data[index].paid = 0;
    }
  };

  $scope.submit = function(index) {
    var approved_uIDs = [];
    var paid_uIDs = [];
    for (var i = 0; i < $scope.data.length; i++) {
      if ($scope.data[i].approved == 1) {
        approved_uIDs.push($scope.data[i].uID);
      }
      if ($scope.data[i].paid == 1) {
        paid_uIDs.push($scope.data[i].uID);
      }
    }
    if (approved_uIDs.length > 0 || paid_uIDs.length > 0) {
      expenseService.updateExpenses(approved_uIDs, paid_uIDs);
      $scope.data = [];
      modalService.closeModal();
    }
  }

  $scope.isApproved = function(index) {
    if ($scope.data[index].approved == 1) {
      return true;
    }
    return false;
  }; 

  $scope.isPaid = function(index) {
    if ($scope.data[index].paid == 1) {
      return true;
    }
    return false;
  }; 
})

.controller('updateController', function($scope, brotherStatusService, $interval, modalService, validationService) {
	$scope.updates = [];
  $scope.data = null;

	$scope.format = function(val) {
		if (val === "1") {
			return true;
		}
		else {
			return false;
		}
	};

	$scope.rowType = function(index) {
    if (validationService.validate($scope.data[index])) {
      return "success";
    }
    else {
      return "danger";
    }
	};

  $scope.existingUpdateIndex = function(type, index) {
    for (var i = 0; i < $scope.updates.length; i++) {
      if ($scope.updates[i].index === index && $scope.updates[i].type === type) {
        return i;
      }
    }
    return -1;
  };

	$scope.update = function(type, index) {
		if ($scope.format($scope.data[index][type])) {
      $scope.data[index][type] = "0";
    }
    else {
      $scope.data[index][type] = "1";
    }
    var upIndex = $scope.existingUpdateIndex(type, index);
    if (upIndex !== -1) {
      $scope.updates.splice(upIndex, 1);
    }
    else {
      $scope.updates.push({"type" : type, "uID": $scope.data[index].uID});
    }
	};

	$scope.$watch(function() {
		return brotherStatusService.getBrotherStatus();
	}, function(data) {
		$scope.data = data;
	});

  $scope.submit = function() {
    if ($scope.updates.length !== 0) {
      brotherStatusService.update($scope.updates);
    }
    modalService.closeModal();
  };
})

.controller('duesFormController', function($scope, modalService, $http, submitPaymentsPOST, sessionService) {
  $scope.payments = [
    {
      date : "",
      amount : ""
    },
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

  $scope.formSubmitted = -1;

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

  $scope.init = function(uID) {
    getFormStatus(uID);
    getDuesObligation(uID);
  };

  var getFormStatus = function(uID) {
    $http.get('/artifacts/session_data.php', {
      params: {
        param1 : uID
      }
    }).then(function(data,err) {
      if (data.data.data.formRecieved == 0) {
        $scope.formSubmitted = 0;
      }
      if (data.data.data.formRecieved == 1) {
        $scope.formSubmitted = 1;
      }
    }, function(err) {

    });
  }

  var getDuesObligation = function(uID) {
    $http.get('/artifacts/getDuesObligation.php', {
      params : {
        param1: uID
      }
    })
    .then(function(data,err) {
      $scope.obligation = data.data.obligation;
    }, function(err) {
      $scope.obligation = "Please contact Torin. Err: " + err;
    });
  }

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
    console.log(str);
  }

  $scope.clearError = function() {
    $scope.hasError = false;
    $scope.errorText = null;
  }

  $scope.submit = function(uID) {
    var paymentDate = "01-13-17";
    $scope.clearError();
    if ($scope.options.one) {
      var params = {
          param0: uID,
          param1: JSON.stringify([{date: paymentDate, amount: $scope.obligation}])
        };
        var query = submitPaymentsPOST.save($.param(params));
        query.$promise.then(function(data,err) {

          if(data.success) {
            $http.get('/artifacts/updateDuesFormStatus.php', {
              params : {
                param1: uID,
                param2: 1,
                param3: 1
              }
            })
            .then(function(data,err) {
              if(data.data.success) {
                sessionService.requestSessionInfo(uID);
                modalService.closeModal();
              }
              else {
                $scope.reportError("An error occured. Please try again! Err: " + data.data.error);
              }
            }, function(err) {
              $scope.obligation = "Please contact Torin. Err: " + err;
            });
          }
          else {
            $scope.reportError("An error occured. Please try again! Err: " + data.data.error);
          }
        }, function(err) {
          $scope.reportError = "Please contact Torin. Err: " + err;
        });
    }
    else if ($scope.options.two) {
      if (optionTwoSanity()) {
        if(paymentSanity()) {
          var params = {
            param0: uID,
            param1: JSON.stringify($scope.payments)
          };
          var query = submitPaymentsPOST.save($.param(params));
          query.$promise.then(function(data,err) {

            if(data.success) {
              $http.get('/artifacts/updateDuesFormStatus.php', {
                params : {
                  param1: uID,
                  param2: 2,
                  param3: 1
                }
              })
              .then(function(data,err) {
                if(data.data.success) {
                  modalService.closeModal();
                }
                else {
                  $scope.reportError("An error occured. Please try again! Err: " + data.data.error);
                }
              }, function(err) {
                $scope.obligation = "Please contact Torin. Err: " + err;
              });
            }
            else {
              $scope.reportError("An error occured. Please try again! Err: " + data.data.error);
            }
          }, function(err) {
            $scope.reportError = "Please contact Torin. Err: " + err;
          });
        }
      }
      else {
        $scope.reportError("Proposed amounts do not equal your charged amount.")
      }
    }
    else if ($scope.options.three) {
      if (optionThreeSanity()) {
        if(paymentSanity()) {
          var params = {
            param0: uID,
            param1: JSON.stringify($scope.payments)
          };
          var query = submitPaymentsPOST.save($.param(params));
          query.$promise.then(function(data,err) {

            if(data.success) {
              $http.get('/artifacts/updateDuesFormStatus.php', {
                params : {
                  param1: uID,
                  param2: 3,
                  param3: 1,
                  param4: $scope.proposed.text
                }
              })
              .then(function(data,err) {
                if(data.data.success) {
                  modalService.closeModal();
                }
                else {
                  $scope.reportError("An error occured. Please try again! Err: " + data.data.error);
                }
              }, function(err) {
                $scope.obligation = "Please contact Torin. Err: " + err;
              });
            }
            else {
              $scope.reportError("An error occured. Please try again! Err: " + data.data.error);
            }
          }, function(err) {
            $scope.reportError = "Please contact Torin. Err: " + err;
          });
        }
      }
      else {
        $scope.reportError("Proposed amounts do not equal your proposed total.")
      }
    }
    else {

    }
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

    console.log($scope.proposed.text);
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
})

.controller('expenseController', function($scope, modalService, expenseService) {
  $scope.accounts = ["Social", "Brotherhood", "Rush", "Education"];
  $scope.data =  {
    account : "",
    description: "",
    amount: ""
  };  
  $scope.submit = function(uID) {
    if ($scope.account !== "" && $scope.description !== "" && $scope.amount !== ""){
      expenseService.send(uID, $scope.data);
      modalService.closeModal();
    }
  };
})

.controller('emailController', function($scope, sessionService, modalService) {
  $scope.email = "";

  $scope.validEmail = function() {
    if ($scope.email === "") {
      return true;
    }
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test($scope.email);
  };

  $scope.isPenn = function() {
    var re = /upenn./i;
    return re.test($scope.email);
  }

  $scope.submit = function(uID) {
    if ($scope.validEmail() && !$scope.isPenn() & $scope.email !== "") {
      sessionService.updateEmail(uID, $scope.email);
      modalService.closeModal();
    }
  };
})

.controller('passwordController', function($scope, sessionService, modalService) {
  $scope.password = {
    value: "",
    valid: true,
    validate : function() {
      if ($scope.password.value.length > 5) {
      $scope.password.valid = true;
      }
      else {
        $scope.password.valid = false;
      }
    }
  };
  $scope.confirm = {
    value: "",
    valid: true,
    validate : function() {
      if ($scope.password.value === $scope.confirm.value) {
      $scope.confirm.valid = true;
      }
      else {
        $scope.confirm.valid = false;
      }
    }
  };
  $scope.submit = function(uid) {
    if ($scope.password.valid && $scope.confirm.valid) {
      sessionService.postChangePassword(uid, $scope.password.value);
      modalService.closeModal();
    }
  }
})

.controller('reportController', function($scope, modalService, submitService) {
  $scope.description = "";
  $scope.submit = function(uID) {
    if ($scope.description !== "") {
      submitService.postIssue(uID, $scope.description);
      modalService.closeModal()
    }
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
		templateUrl : '/directives/upl-toggle-switch.html'
	};
})

.directive('uplEvent', function() {
  return {
    restrict : 'E',
    scope : {
      date: "=",
      time: "=",
      description : "=",
      location : "="
    },
    link : function(scope, element, attrs) {

    }, 
    replace : true,
    templateUrl : '/directives/upl-event.html'
  };
})

.directive('uplProgressBar', function() {
    return {
    restrict : 'E',
    scope : {
      name : '=',
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

      scope.color = function() {
        switch(scope.name) {
          case "Total Budget Usage" :
            return "progress-bar-danger"
          case "Social Budget" :
            return "progress-bar-info";
          case "Rush Budget" :
            return "progress-bar-success";
          case "Brotherhood Budget" :
            return "progress-bar-warning";
        }
      }
    }, 
    replace : true,
    templateUrl : '/directives/upl-progressBar.html'
  };
})

.directive('inputSelection', function() {
  return {
    restrict : 'E',
    scope: {
      fieldData : '=',
      value : '='
    },
    link : function(scope, element, attrs) {
      scope.open = false;
      scope.selection = 0;

      scope.dropdownClass = function() {
        if (scope.open) {
          return 'autoComplete';
        }
      };
      scope.openAutoComplete = function() {
        scope.selection = 0;
        scope.open = true;
      };
      scope.closeAutoComplete = function() {
        scope.selection = 0;
        scope.open = false;
      };
      scope.keyPress = function(keyCode) {
        var key = scope.selection;
          //Up Key Pressed
          if (keyCode === 38) {
            if (key > 0) {
              scope.selection = key - 1;
            }
          }
          //Down Key Pressed
          else if (keyCode === 40) {
            if (key < scope.fieldData.length) {
              scope.selection = key + 1;
            }
          }
          //Enter Pressed
          else if (keyCode == 13) {
            if (scope.selection !== 0) {
              scope.update(scope.selection - 1);
              scope.closeAutoComplete();
            }
          }
        };
        scope.shouldHighlight = function(index) {
          if (scope.selection === index + 1) {
            return true;
          }
          else {
            return false;
          }
        };
        scope.select = function(index) {
          scope.selection = index + 1;
        };
        scope.update = function(index) {
          console.log(index);
          scope.value = scope.fieldData[index];
        };
      },
      replace: true,
      templateUrl: '/directives/dropdown.html'
    };
  });

function formatDate(dateString) {
    'use strict';
    var monthNames = ["Jan", "Feb", "March", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var hrs, half;
    var date = new Date(dateString);
    if (dateString) {
        if (dayNames[date.getDay()]) {
            if (date.getHours() === 0) {
                hrs = 12;
                half = "AM";
            }
            else if (date.getHours() > 12) {
                hrs = date.getHours() - 12;
                half = "PM";
            }
            else {
                hrs = date.getHours();
                half = "AM";
            }
            return "" + dayNames[date.getDay()] + ", " + monthNames[date.getMonth()]+ " " + date.getDate(); 
        }
        else {
          var datetime, dateComps, timeComps;
          datetime = dateString.split(" ");
          dateComps = datetime[0].split("-");
          timeComps = datetime[1].split(":");
          return monthNames[parseInt(dateComps[1]) - 1] + " " + dateComps[2];
        }
    }
};