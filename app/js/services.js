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

.service('profileService', function($http, modalService) {
	var profileData = null;
	this.init = function() {
		$http.get('/api/indv_bro_profile').then(
			function success(response) {
				if (response.data.success) {
					profileData = response.data.data;
					var needsPwdReset = profileData.passwordNeedsReset;
					if (typeof needsPwdReset != 'undefined' && needsPwdReset) {
						modalService.pushModal('account-setup');
					}
				}
				else {
					console.log("Successful request but bad response!", response.data.error.message);
				}
			},
			function errorCallback(response) {
				console.log("Error: Could not get profile data");
			});
	};

	this.getData = function() {
		return profileData;
	}

	this.setFormSubmitted = function() {
		if (profileData != null && profileData.dues_status != null) {
			profileData.dues_status.form_submitted = true;
		}
	}

	this.isFormSubmitted = function() {
		if (profileData != null) {
			return profileData.dues_status.form_submitted;
		}
	}

	this.getDuesObligation = function() {
		if (profileData != null) {
			return profileData.dues_status.obligation;
		}
	}
});