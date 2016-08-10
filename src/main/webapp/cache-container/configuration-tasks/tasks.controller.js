'use strict';

angular.module('managementConsole')
  .controller('editContainerTasksCtrl', [
    '$scope',
    '$q',
    '$state',
    '$stateParams',
    '$uibModal',
    'utils',
    'modelController',
    'cacheContainerConfigurationService',
    function ($scope, $q, $state, $stateParams, $uibModal, utils, modelController, cacheContainerConfigurationService) {

      $scope.clusters = modelController.getServer().getClusters();
      $scope.currentCluster = modelController.getServer().getClusterByNameAndGroup($stateParams.clusterName, $stateParams.groupName);
      $scope.serverGroup = $scope.currentCluster.getServerGroupName();
      $scope.availableTasks = [];

      $scope.loadScriptTasks = function () {
        cacheContainerConfigurationService.loadScriptTasks($scope.currentCluster).then(
          function (response) {
            $scope.availableTasks = response;
          }
        );
      };

      $scope.loadScriptTasks();

      var TasksModalInstanceCtrl = function ($scope, $state, $uibModalInstance) {
        $scope.cancelModal = function () {
          $uibModalInstance.close();
        };
        $scope.confirmRemoveScript = function () {
          $scope.removeScript($scope.artifact);
        };
      };

      $scope.openConfirmationModal = function (artifact, mode) {
        $scope.artifact = artifact;
        $scope.mode = mode;

        $uibModal.open({
          templateUrl: 'cache-container/configuration-tasks/confirmation-modal.html',
          controller: TasksModalInstanceCtrl,
          scope: $scope
        });
      };

      var EditScriptModalInstanceCtrl = function ($scope, $state, $uibModalInstance, currentCluster, modelController, script) {

        $scope.task = script;
        $scope.successTaskDeploy = false;
        $scope.errorDeploying = false;
        $scope.errorDescription = null;

        // Recreates script body from
        $scope.buildBody = function () {
          var realTaskName = $scope.task.name;

          var body = '// name=' + realTaskName + ', language=' + $scope.task.language + '\n';
          body += '// mode=' + $scope.task.mode + '\n';
          if ($scope.task.parameters && $scope.task.parameters.length > 0) {
            body += '// parameters=[' + $scope.task.parameters + ']\n';
          }
          if ($scope.task.role && $scope.task.role.length > 0) {
            body += '// role=' + $scope.task.role + '\n';
          }

          body += '\n';
          body += $scope.task.body;

          return body;
        };

        $scope.cancel = function () {
          $uibModalInstance.close();
        };

        // Task creation
        $scope.createScript = function () {
          $scope.errorExecuting = false;
          $scope.errorDescription = null;
          $scope.successExecuteOperation = false;

          // In edit mode, we allow the user to edit the script directly
          var realBody = $scope.task.editing ? $scope.task.body : $scope.buildBody();

          cacheContainerConfigurationService.deployScript(currentCluster, $scope.task.name, realBody).then(
            function () {
              $scope.errorExecuting = false;
              $scope.successExecuteOperation = true;
              $uibModalInstance.close();
            },
            function (reason) {
              $scope.errorExecuting = true;
              $scope.errorDescription = reason;
            }
          );
        };
      };

      $scope.openCreateScriptModal = function (script) {
        if (script === null) {
          script = {
            editing: false
          };
        }

        var d = $uibModal.open({
          templateUrl: 'cache-container/configuration-tasks/edit-script-modal.html',
          controller: EditScriptModalInstanceCtrl,
          scope: $scope,
          size: 'lg',
          resolve: {
            currentCluster: function () {
              return $scope.currentCluster;
            },
            modelController: function () {
              return modelController;
            },
            script: function () {
              return script;
            }
          }
        });

        d.result.then(
          function () {
            // Refresh the list of tasks
            $scope.loadScriptTasks();
          }
        );
      };

      $scope.openEditScriptModal = function (scriptName) {
        // Load script content
        cacheContainerConfigurationService.loadScriptBody($scope.currentCluster, scriptName)
          .then(function (response) {
            var script = {
              name: scriptName,
              body: response,
              editing: true
            };
            $scope.openCreateScriptModal(script);
          }, function (error) {
            $scope.openErrorModal(error);
          });
      };

      $scope.removeScript = function (name) {
        cacheContainerConfigurationService.removeScript($scope.currentCluster, name).then(function () {
          $state.go('editCacheContainerTasks', {
            groupName: $scope.currentCluster.getServerGroupName(),
            clusterName: $scope.currentCluster.name
          }, {
            reload: true
          });
        }).catch(function (e) {
          $scope.openErrorModal(e);
        });
      };
}]);
