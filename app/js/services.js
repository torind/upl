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

.service('duesService', function($http) {
	var that = this;
	var unsubmittedData = null;
	var loaded = false;

	this.initUnsubmittedData = function() {
		that.loaded = false;
		$http.get('/api/dues_form_progress').then(
			function success(response){
				if (response.data.success) {
					that.loaded = true;
					unsubmittedData = response.data.data;
				}
				else {
					console.log("Successful request but bad response!", response.data.error.message);
				}
			}, 
			function error(response) {
				console.log("Error: could not get unsubmittedData");
			});
	}

	this.isLoaded  = function() {
		return that.loaded;
	}

	this.getUnsubmittedData = function() {
		return unsubmittedData;
	}
})

.service('profileService', function($http, modalService, duesService) {
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

	this.refreshAfterFormSubmit = function() {
		if (profileData != null && profileData.dues_status != null) {
			profileData.dues_status.form_submitted = true;
		}
		this.init();
		duesService.initUnsubmittedData();
	}

	this.isFormSubmitted = function() {
		if (profileData != null) {
			return profileData.dues_status.form_submitted;
		}
	}

	this.getDuesObligation = function() {
		if (profileData != null) {
			return profileData.dues_amounts.obligation;
		}
	}
});