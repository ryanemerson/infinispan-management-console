(function () {
  'use strict';

  var module = angular.module('ispn.directives.cache.modaldialog', ['ispn.services.utils']);

  module.directive('modalDialog', ['utils', '$modal', function (utils, modal) {
    return {
      restrict: 'E',
      scope: {
        data: '=',
        field: '@',
        metadata: '=',
        outsideController: '=',
        previousValues: '=',
        title: '@',
        view: '@'
      },
      replace: true,
      templateUrl: 'components/directives/cache/store/modal-dialog/views/modal-button.html',
      link: function (scope) {

        scope.getStyle = function () {
          return scope.metadata.style;
        };

        scope.openModal = function () {
          var modalInstance = modal.open({
            templateUrl: 'components/directives/cache/store/modal-dialog/views/' + scope.view + '.html',
            resolve: {
              store: function () {
                return {
                  data: utils.isNullOrUndefined(scope.data[scope.field]) ? {} : scope.data[scope.field],
                  meta: scope.metadata['value-type'],
                  prevData: utils.isNullOrUndefined(scope.previousValues) ? {} : scope.previousValues,
                  title: scope.title
                };
              }
            },
            controller: ['$scope', 'utils', '$modalInstance', 'store', function ($scope, utils, $modalInstance, store) {
              $scope.title = store.title;
              $scope.field = store.field;
              $scope.metadata = store.meta;
              $scope.data = store.data;
              $scope.prevData = store.prevData;

              $scope.cancelModal = function () {
                $scope.undoAllFieldChanges($scope.data);
                $modalInstance.dismiss('cancel');
              };

              $scope.submitModal = function () {
                $scope.data.modified = $scope.isObjectModified($scope.data, $scope.metadata);
                $modalInstance.close($scope.data);
              };

              $scope.isObjectModified = function (data, metadata) {
                for (var key in data) {
                  if (data.hasOwnProperty(key) && utils.isNotNullOrUndefined(metadata[key])) {
                    var value = data[key];
                    var modified = false;
                    if (utils.isObject(value)) {
                      var subMeta = metadata[key]['value-type'];
                      modified = $scope.isObjectModified(value, subMeta);
                    } else {
                      modified = metadata[key].uiModified;
                    }
                    if (modified) {
                      return true;
                    }
                  }
                }
                return false;
              };

              $scope.getMetadataObject = function (field, parent) {
                if (utils.isNotNullOrUndefined(parent)) {
                  return $scope.metadata[parent]['value-type'][field];
                } else {
                  return $scope.metadata[field];
                }
              };

              $scope.getObject = function (object, field, parent) {
                if (utils.isNullOrUndefined(object)) {
                  return null
                }

                if (utils.isNotNullOrUndefined(parent)) {
                  if (utils.isNullOrUndefined(object[parent])) {
                    object[parent] = {
                      field: null
                    };
                  }
                  return object[parent][field];
                } else {
                  return object[field];
                }
              };

              $scope.resolveFieldDescription = function (field, parent) {
                return $scope.getMetadataObject(field, parent).description;
              };

              $scope.getStyle = function (field, parent) {
                return $scope.getMetadataObject(field, parent).style;
              };

              $scope.isFieldValueModified = function (field, parent) {
                return $scope.getMetadataObject(field, parent).uiModified === true;
              };

              $scope.fieldChangeRequiresRestart = function (field, parent) {
                return $scope.getMetadataObject(field, parent)['restart-required'] !== 'no-services';
              };

              $scope.fieldValueModified = function (field, parent) {
                var currentVal = $scope.getObject($scope.data, field, parent);
                var previousVal = $scope.getObject($scope.prevData, field, parent);
                var meta = $scope.getMetadataObject(field, parent);

                if (currentVal === previousVal ||
                  (utils.isBoolean(currentVal) && !currentVal && utils.isNullOrUndefined(previousVal)) ||
                  (!currentVal && utils.isNullOrUndefined(previousVal))) {
                  meta.uiModified = false;
                  meta.style = null;
                } else {
                  meta.uiModified = true;
                  meta.style = {'background-color': '#fbeabc'};
                }
              };

              $scope.undoFieldChange = function (field, parent) {
                var meta = $scope.getMetadataObject(field, parent);
                meta.uiModified = false;
                meta.style = null;

                if (utils.isNotNullOrUndefined(parent)) {
                  $scope.data[parent][field] = angular.copy($scope.prevData[parent][field]);
                } else {
                  $scope.data[field] = angular.copy($scope.prevData[field]);
                }
              };

              $scope.undoAllFieldChanges = function (object) {
                for (var key in object) {
                  var val = object[key];
                  if (utils.isObject(val)) {
                    $scope.undoAllFieldChanges(val);
                  } else {
                    $scope.undoFieldChange(key);
                  }
                }
              };
            }]
          });

          modalInstance.result.then(function (storeObject) {
            // We still need to do this if !modified, as a user may have entered something and then deleted it,
            // thus setting the field to an empty string which will result in a WFLY error from the DMR.
            utils.removeEmptyFieldsFromObject(storeObject, true);
            if (!utils.isEmptyObject(storeObject) && storeObject.modified) {
              delete storeObject.modified;

              scope.data[scope.field] = storeObject;
              scope.metadata.uiModified = true;
              scope.metadata.style = {'background-color': '#fbeabc'};
              scope.$emit('configurationFieldDirty', scope.field);

              if (utils.isNotNullOrUndefined(scope.outsideController)) {
                scope.outsideController.requiresRestart = function () {
                  return true;
                }
              }
            }
          });

          // TODO need to tell outer directive/constructor that field has been modified
          // We have the metadata here, so just set/unset fields as required
        };
      }
    };
  }]);
}());
