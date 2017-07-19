angular.module('homepage-app',['services.js'])

.controller('root-controller', ['$scope', 'modalService', function($scope, $modal) {
    $scope.currentModal = null;

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
}]);