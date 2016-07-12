(function () {
  'use strict';

  var module = angular.module('ispn.directives.cache.cachestore', ['ispn.services.utils']);

// TODO change cachestore to cacheStore so that the directive is called as cache-store
  module.directive('cachestore', ['utils', '$modal', function (utils, modal) {
    var customStoreFields = ['is-new-node', 'store-original-type'];
    return {
        restrict: 'E',
        scope: {
          data: '=',
          metadata: '=',
          cacheType: '=',
          initDefaults: '=',
          readOnly:'=',
          outsideController: '='
        },
        replace: true,
        templateUrl: 'components/directives/cache/store/cache-store.html',
        link: function (scope) {

          scope.init = function () {
            if (utils.isNotNullOrUndefined(scope.outsideController)){
              if (utils.isArray(scope.outsideController)){
                var handle = {};
                scope.outsideController.push(handle);
                scope.internalController = handle;
              } else {
                scope.internalController = scope.outsideController;
              }
            } else {
              scope.internalController = {};
            }

            scope.metadata.storeTypes = ['None', 'string-keyed-jdbc-store','mixed-keyed-jdbc-store', 'binary-keyed-jdbc-store',
              'leveldb-store', 'file-store', 'remote-store', 'rest-store'];
            scope.resourceDescriptionMap = {};
            utils.makeResourceDescriptionMap(scope.resourceDescriptionMap);
            scope.metadata.checkboxes = scope.getCommonStoreCheckboxes();

            if (utils.isNullOrUndefined(scope.data)){
              scope.data = {};
            }
            var storeType = scope.getStoreType();
            scope.data['store-type'] = storeType;
            scope.metadata.currentStore = scope.resolveDescription(storeType);
            scope.store = scope.getStoreObject();
            scope.store['is-new-node'] = scope.isNoStoreSelected();
            scope.storeView = scope.getStoreView(storeType);
            scope.prevData = {};
            scope.cleanMetadata();

            if (scope.initDefaults) {
              scope.data['store-type'] = 'None';

              scope.metadata.checkboxes.forEach(function (attrName) {
                scope.store[attrName] = scope.metadata[attrName].default;
              });
            }

            scope.internalController.requiresRestart = scope.requiresRestart;
            scope.internalController.cleanMetadata = scope.cleanMetadata;
          };

          scope.getStoreType = function () {
            var array = scope.metadata.storeTypes;
            for (var i = 0; i < array.length; i++) {
              var store = scope.data[array[i]];
              if (utils.isNotNullOrUndefined(store)) {
              if (array[i] === undefined) {
              }
                var storeObject = store[scope.getStoreObjectKey(array[i])];
                if (Object.keys(storeObject).length > 1) {
                  return array[i];
                }
              }
            }
            return 'None';
          };

          scope.isNoStoreSelected = function () {
            return scope.data['store-type'] === 'None';
          };

          scope.getStoreObject = function () {
            var storeKey = scope.data['store-type'];
            if (scope.isNoStoreSelected()) {
              return {};
            }

            var objectKey = scope.getStoreObjectKey(storeKey);
            if (utils.isNullOrUndefined(scope.data[storeKey][objectKey])) {
              scope.data[storeKey][objectKey] = {};
            }
            return scope.data[storeKey][objectKey];
          };

          scope.getStoreObjectKey = function (storeKey) {
            return storeKey.toUpperCase().replace(/-/g, '_');
          };

          scope.hasStringKeyedTable = function () {
            return utils.isNotNullOrUndefined(scope.data) && utils.isNotNullOrUndefined(scope.data['string-keyed-table']);
          };

          scope.hasBinaryKeyedTable = function () {
            return utils.isNotNullOrUndefined(scope.data) && utils.isNotNullOrUndefined(scope.data['binary-keyed-table']);
          };

          scope.getCommonStoreCheckboxes = function () {
            var boxes = [];
            var genericStoreMeta = scope.resolveDescription('store');
            angular.forEach(genericStoreMeta, function (value, key) {
              var type = value['type'];
              var deprecated = utils.isNotNullOrUndefined(value['deprecated']);
              if (utils.isNotNullOrUndefined(type)) {
                var modelType = type['TYPE_MODEL_VALUE'];
                if (utils.isNotNullOrUndefined(modelType) && modelType === 'BOOLEAN' && !deprecated) {
                  boxes.push(key);
                }
              }
            });
            return boxes;
          };

          scope.updateStoreType = function (previousType) {
            var storeType = scope.data['store-type'];
            var previousStore = scope.store;
            var storeTypeChanged = scope.prevData['store-type'] !== storeType;

            if (storeTypeChanged) {
              scope.makeFieldDirty(scope.metadata['store-type'], 'store-type', true);
            } else {
              scope.makeFieldClean(scope.metadata['store-type'], 'store-type', true);
            }

            scope.storeView = scope.getStoreView(storeType);
            if (scope.isNoStoreSelected()) {
              scope.metadata.currentStore = {};
              return;
            }

            var storeKey = scope.getStoreObjectKey(storeType);
            scope.updateStoreAttributesAndMeta(storeType, previousType);
            scope.data[storeType] = {};
            scope.data[storeType][storeKey] = utils.isNotNullOrUndefined(previousStore) ? previousStore : {};
            scope.data['is-new-node'] = storeTypeChanged;
            scope.store = scope.data[storeType][storeKey];
            scope.store['is-new-node'] = storeTypeChanged;
            scope.metadata.currentStore = scope.resolveDescription(storeType);
          };

          scope.getStoreView = function (storeType) {
          var viewDir = 'components/directives/cache/store/views/';
            switch (storeType) {
              case 'None':
                return null;
              case 'string-keyed-jdbc-store':
              case 'binary-keyed-jdbc-store':
              case 'mixed-keyed-jdbc-store':
                return viewDir + 'jdbc-store.html';
              default:
                return viewDir + storeType + '.html';
            }
          };

          scope.cleanMetadata = function () {
            angular.forEach(scope.metadata.currentStore, function (value, key) {
              if (utils.isObject(value)) {
                scope.makeFieldClean(value);
                scope.prevData[key] = angular.copy(scope.store[key]);
              }
            });

            scope.prevData['store-type'] = scope.data['store-type'];
            scope.metadata['store-type'] = {
              uiModified: false,
              style: null
            };
            scope.data['store-original-type'] = scope.prevData['store-type'];
          };

          scope.fieldValueModified = function (field) {
            var original = scope.prevData[field];
            var latest = scope.store[field];

            if ((utils.isNullOrUndefined(original) && !latest) || original === latest) {
              scope.makeFieldClean(scope.metadata.currentStore[field], field, true);
            } else {
              scope.makeFieldDirty(scope.metadata.currentStore[field], field, true);
            }
          };

          scope.makeFieldDirty = function (field, fieldName, emit) {
            field.uiModified = true;
            field.style = {'background-color': '#fbeabc'};
            if (emit) {
              scope.$emit('configurationFieldDirty', fieldName);
            }
          };

          scope.makeFieldClean = function (field, fieldName, emit) {
            field.uiModified = false;
            field.style = null;
            if (emit) {
              scope.$emit('configurationFieldClean', fieldName);
            }
          };

          scope.isFieldValueModified = function (field) {
            var fieldMeta = scope.isGenericField(field) ? scope.metadata[field] : scope.metadata.currentStore[field];
            return utils.isNotNullOrUndefined(fieldMeta) && fieldMeta.uiModified === true;
          };

          scope.fieldChangeRequiresRestart = function (field) {
            var fieldMeta = scope.metadata.currentStore[field];
            return utils.isNotNullOrUndefined(fieldMeta) && fieldMeta['restart-required'] !== 'no-services';
          };

          scope.requiresRestart = function () {
            var restartRequired = scope.prevData['store-type'] !== scope.data['store-type'];
            if (restartRequired) {
              return true;
            }

            if (utils.isNotNullOrUndefined(scope.metadata.currentStore)) {
              return Object.keys(scope.metadata.currentStore).some(function (field) {
                return scope.isFieldValueModified(field) && scope.fieldChangeRequiresRestart(field);
              });
            }
            return false;
          };

          // True if the field is stored as part of the generic metadata, not metadata.currentStore
          scope.isGenericField = function (field) {
            return scope.metadata.hasOwnProperty(field);
          };

          scope.undoFieldChange = function (field) {
            scope.store[field] = scope.prevData[field];
            scope.makeFieldClean(scope.metadata.currentStore[field], field, true);
          };

          scope.undoTypeChange = function () {
            var currentStoreType = scope.data['store-type'];
            var originalStoreType = scope.prevData['store-type'];
            scope.data[originalStoreType] = originalStoreType === 'None' ? {} : scope.store;
            scope.data['store-type'] = originalStoreType;
            scope.data['is-new-node'] = false;
            scope.storeView = scope.getStoreView(originalStoreType);

            scope.updateStoreAttributesAndMeta(originalStoreType, currentStoreType);
            scope.makeFieldClean(scope.metadata['store-type'], 'store-type', true);
          };

          scope.updateStoreAttributesAndMeta = function (newStoreType, oldStoreType) {
            if (utils.isNotNullOrUndefined(oldStoreType) && oldStoreType === 'None') {
              return;
            }

            var oldMeta = scope.metadata.currentStore;
            var newMeta = scope.resolveDescription(newStoreType);
            if (utils.isNotNullOrUndefined(newMeta)) {
              angular.forEach(scope.store, function (value, key) {
                if (customStoreFields.indexOf(key) < 0) {
                  if (!newMeta.hasOwnProperty(key)) {
                    delete scope.store[key];
                  } else if (utils.isNotNullOrUndefined(oldMeta)) {
                    newMeta[key] = oldMeta[key];
                  }
                }
              });
              scope.metadata.currentStore = newMeta;
            }

            if (utils.isNotNullOrUndefined(oldStoreType) && oldStoreType !== 'None') {
              scope.data[oldStoreType] = null;
            }
          };

          scope.getStyle = function (field) {
            var fieldMeta = scope.isGenericField(field) ? scope.metadata[field] : scope.metadata.currentStore[field];
            return utils.isNotNullOrUndefined(fieldMeta) ? fieldMeta.style : '';
          };

          scope.resolveFieldName = function (field) {
            return utils.convertCacheAttributeIntoFieldName(field);
          };

          scope.resolveDescription = function (elementPath) {
            if (utils.isNotNullOrUndefined(elementPath) && elementPath !== 'None') {
              return utils.resolveDescription(scope.metadata, scope.resourceDescriptionMap, elementPath, scope.cacheType);
            }
          };

          scope.openModal = function (keyType) {
            scope.metadata['key-type'] = keyType;
            var modalInstance = modal.open({
              templateUrl: 'components/directives/cache/store/keyed-table-modal.html',
              controller: KeyedTableModalInstanceCtrl,
              scope: scope,
              resolve: function () {
                return $scope.data;
              }
            });

            modalInstance.result.then(function (newKeyedTable) {
              scope.store[keyType] = newKeyedTable;
              scope.fieldValueModified(keyType);
            });
          };

          // Initialise scope variables
          scope.init();








          var KeyedTableModalInstanceCtrl = function ($scope, utils, $modalInstance) {
            $scope.keyType = $scope.$parent.metadata['key-type'];
            $scope.data = $scope.$parent.store[$scope.keyType];
            $scope.title = $scope.$parent.resolveFieldName($scope.keyType);
            $scope.metadata = $scope.$parent.metadata[$scope.keyType]['value-type'];

            if (utils.isNullOrUndefined($scope.$parent.prevData[$scope.keyType])) {
              $scope.$parent.prevData[$scope.keyType] = {};
            }
            $scope.prevData = $scope.$parent.prevData[$scope.keyType];

            $scope.cancelModal = function () {
              delete $scope.metadata['key-type'];
              $modalInstance.dismiss('cancel');
            };

            $scope.submitModal = function () {
              delete $scope.metadata['key-type'];
              $modalInstance.close($scope.data);
            };

            $scope.resolveFieldDescription = function (field, parent) {
              if (utils.isNotNullOrUndefined(parent)) {
                return $scope.metadata[parent]['value-type'][field].description;
              } else {
                return $scope.metadata[field].description;
              }
            };

            $scope.getStyle = function (field, parent) {
              var meta = $scope.getMetadataObject(field, parent);
              return utils.isNotNullOrUndefined(meta) ? meta.style : '';
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

            $scope.getMetadataObject = function (field, parent) {
              if (utils.isNotNullOrUndefined(parent)) {
                return $scope.metadata[parent]['value-type'][field];
              } else {
                return $scope.metadata[field];
              }
            };

            $scope.fieldValueModified = function (field, parent) {
              var currentVal = $scope.getObject($scope.data, field, parent);
              var previousVal = $scope.getObject($scope.prevData, field, parent);
              var meta = $scope.getMetadataObject(field, parent);

              if (currentVal !== previousVal) {
                meta.uiModified = true;
                meta.style = {'background-color': '#fbeabc'};
              } else {
                meta.uiModified = false;
                meta.style = null;
              }
            };

            $scope.undoFieldChange = function (field, parent) {
              var meta = $scope.getMetadataObject(field, parent);
              meta.uiModified = false;
              meta.style = null;

              if (utils.isNotNullOrUndefined(parent)) {
                $scope.data[parent][field] = $scope.prevData[parent][field];
              } else {
                $scope.data[field] = $scope.prevData[field];
              }
            };

            $scope.isFieldValueModified = function (field, parent) {
              return $scope.getMetadataObject(field, parent).uiModified === true;
            };

            $scope.fieldChangeRequiresRestart = function (field, parent) {
              return $scope.getMetadataObject(field, parent)['restart-required'] !== 'no-services';
            };
          };
        }
      };
    }
  ]);
}());
