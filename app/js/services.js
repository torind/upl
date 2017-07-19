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

.service('profileService', function() {
	this.init = function(user_uID) {
		
	};
});