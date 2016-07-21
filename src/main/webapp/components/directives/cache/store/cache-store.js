(function () {
  'use strict';

  var module = angular.module('ispn.directives.cache.cachestore', ['ispn.services.utils']);

// TODO change cachestore to cacheStore so that the directive is called as cache-store
// TODO remove unused modal dependency
  module.directive('cachestore', ['utils', '$modal', function (utils, modal) {
    var customStoreFields = ['is-new-node', 'store-original-type'];
    // These are the default fields which are loaded for each store in the order of the array
    var storeFields = {
      'binary-keyed-jdbc-store': ['datasource', 'dialect'],
      'file-store': ['max-entries', 'path', 'relative-to'],
      'leveldb-store': ['path', 'block-size', 'cache-size', 'clear-threshold'],
      'mixed-keyed-jdbc-store': ['datasource', 'dialect'],
      'remote-store': ['remote-servers', 'cache', 'hotrod-wrapping', 'socket-timeout', 'protocol-version', 'raw-values', 'tcp-no-delay'],
      'rest-store': ['remote-servers', 'path', 'append-cache-name-to-path'],
      'store': ['class'],
      'string-keyed-jdbc-store': ['datasource', 'dialect']
    };

    var storeTypes = ['None', 'string-keyed-jdbc-store','mixed-keyed-jdbc-store', 'binary-keyed-jdbc-store',
      'leveldb-store', 'file-store', 'remote-store', 'rest-store', 'store'];
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
            scope.initInternalcontroller();

            scope.resourceDescriptionMap = {};
            utils.makeResourceDescriptionMap(scope.resourceDescriptionMap);
            scope.metadata.storeTypes = storeTypes;
            scope.metadata.checkboxes = scope.getCommonStoreCheckboxes();

            if (utils.isNullOrUndefined(scope.data)){
              scope.data = {};
            }
            var storeType = scope.getStoreType();
            scope.data['store-type'] = storeType;
            scope.data['is-new-node'] = scope.isNoStoreSelected();
            scope.fields = storeFields[storeType];
            scope.metadata.currentStore = scope.isNoStoreSelected() ? {} : scope.resolveDescription(storeType);
            scope.store = scope.getStoreObject();
            scope.storeView = scope.getStoreView(storeType);

            // Create children meta objects as they are not in the metadata by default
            if (!utils.isEmptyObject(scope.store)) {
              scope.metadata.currentStore['write-behind'] = scope.getWriteBehindMetadata();
              if (utils.isNullOrUndefined(scope.store['write-behind'])) {
                scope.store['write-behind'] = {
                  'WRITE_BEHIND': {
                    'is-new-node': true
                  }
                };
              }
              scope.initLevelDbChildrenAndMeta(storeType, true);
            }

            if (scope.initDefaults) {
              scope.data['store-type'] = 'None';

              scope.metadata.checkboxes.forEach(function (attrName) {
                scope.store[attrName] = scope.metadata[attrName].default;
              });
            }

            scope.prevData = {};
            scope.cleanMetadataAndPrevValues();
          };

          scope.initInternalcontroller = function () {
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
            scope.internalController.requiresRestart = scope.requiresRestart;
            scope.internalController.cleanMetadata = scope.cleanMetadataAndPrevValues;
          };

          scope.getWriteBehindMetadata = function () {
            var meta = utils.resolveDescription(scope.metadata, scope.resourceDescriptionMap, 'write-behind', scope.cacheType);
            meta.description = 'Configures a cache store as write-behind instead of write-through.';
            // Do we need this?
            meta.type = {
              TYPE_MODEL_VALUE: 'OBJECT'
            };
            return meta;
          };

          scope.initLevelDbChildrenAndMeta = function (storeType, newNode) {
            if (storeType === 'leveldb-store') {
              var meta = utils.resolveDescription(scope.metadata, scope.resourceDescriptionMap, 'leveldb-children', scope.cacheType);
              delete meta['write-behind']; // Remove so we don't overwrite existing field on merge
              delete meta['property'];

              // Get the required meta and add to store meta
              var newMeta = {};
              for (var key in meta) {
                var objectKey = scope.getStoreObjectKey(key);
                var path = utils.createPath('.', [key, 'model-description', objectKey]);
                var innerMeta = utils.deepGet(meta, path);
                var description = innerMeta.description;
                innerMeta.attributes.description = innerMeta.description;
                newMeta[key] = innerMeta.attributes;

                // If no existing values for field, create empty objects
                var store = scope.store;
                if (utils.isNullOrUndefined(store[key]) || utils.isNullOrUndefined(store[key][objectKey])) {
                  scope.store[key] = {};
                  scope.store[key][objectKey] = {'is-new-node': true};
                }
              }
              angular.merge(scope.metadata.currentStore, newMeta);
            }
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
            scope.updateStoreAttributesAndMeta(storeType, previousType, storeTypeChanged);
            scope.data[storeType] = {};
            scope.data[storeType][storeKey] = utils.isNotNullOrUndefined(previousStore) ? previousStore : {};
            scope.data['is-new-node'] = storeTypeChanged;
            scope.store = scope.data[storeType][storeKey];
            scope.store['is-new-node'] = storeTypeChanged;
            // TODO, this should be true when WB doesn't already exist
            utils.deepSet(scope.store, 'write-behind.WRITE_BEHIND.is-new-node', true);
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

          scope.cleanMetadataAndPrevValues = function () {
            angular.forEach(scope.metadata.currentStore, function (value, key) {
              if (utils.isObject(value)) {
                scope.makeFieldClean(value);
                scope.prevData[key] = angular.copy(scope.store[key]);
              }
            });

            scope.prevData['write-behind'] = angular.copy(scope.store['write-behind']);
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

          scope.makeAllFieldsClean = function (metadata) {
            if (utils.isNotNullOrUndefined(metadata.uiModified)) {
              scope.makeFieldClean(metadata);
            }

            if (metadata.hasOwnProperty('value-type')) {
              angular.forEach(metadata['value-type'], function (value) {
                  scope.makeAllFieldsClean(value);
              });
            }
          };

          scope.isFieldValueModified = function (field) {
            var fieldMeta = scope.metadata.hasOwnProperty(field) ? scope.metadata[field] : scope.metadata.currentStore[field];
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

          scope.undoFieldChange = function (field) {
            scope.store[field] = angular.copy(scope.prevData[field]);
            var meta = scope.getFieldMetaObject(field);
            scope.makeFieldClean(meta, field, false);

            if (meta.type.TYPE_MODEL_VALUE === 'OBJECT') {
              scope.makeAllFieldsClean(meta);
            }
          };

          scope.undoTypeChange = function () {
            var currentStoreType = scope.data['store-type'];
            var originalStoreType = scope.prevData['store-type'];
            var originalStoreKey = scope.getStoreObjectKey(originalStoreType);

            scope.data[originalStoreType] = {};
            scope.data[originalStoreType][originalStoreKey] = originalStoreType === 'None' ? {} : scope.store;
            scope.data['store-type'] = originalStoreType;
            scope.data['is-new-node'] = false;
            scope.storeView = scope.getStoreView(originalStoreType);

            scope.updateStoreAttributesAndMeta(originalStoreType, currentStoreType);
            scope.makeFieldClean(scope.metadata['store-type'], 'store-type', true);
          };

          scope.updateStoreAttributesAndMeta = function (newStoreType, oldStoreType, storeTypeChanged) {
            var noPrevStore = utils.isNotNullOrUndefined(oldStoreType) && oldStoreType === 'None';
            var oldMeta = scope.metadata.currentStore;
            var newMeta = scope.resolveDescription(newStoreType);

            if (!noPrevStore) {
              angular.forEach(scope.store, function (value, key) {
                if (customStoreFields.indexOf(key) < 0) {
                  if (key !== 'write-behind' && !newMeta.hasOwnProperty(key)) {
                    delete scope.store[key];
                  } else if (utils.isNotNullOrUndefined(oldMeta)) {
                    newMeta[key] = oldMeta[key];
                  }
                }
              });
              scope.data[oldStoreType] = null;
            }
            scope.fields = storeFields[newStoreType];
            scope.metadata.currentStore = newMeta;

            // TODO is this irrelevant because of the loop above? It simply copies it across already?
            scope.metadata.currentStore['write-behind'] = scope.getWriteBehindMetadata();
            scope.initLevelDbChildrenAndMeta(newStoreType, storeTypeChanged);
          };

          scope.getStyle = function (field) {
            var fieldMeta = scope.metadata.hasOwnProperty(field) ? scope.metadata[field] : scope.metadata.currentStore[field];
            return utils.isNotNullOrUndefined(fieldMeta) ? fieldMeta.style : '';
          };

          scope.resolveFieldName = function (field) {
            return utils.convertCacheAttributeIntoFieldName(field);
          };

          scope.resolveFieldType = function (field) {
            return utils.resolveFieldType(scope.metadata.currentStore, field);
          };

          scope.resolveDescription = function (elementPath) {
            if (utils.isNotNullOrUndefined(elementPath) && elementPath !== 'None') {
              return utils.resolveDescription(scope.metadata, scope.resourceDescriptionMap, elementPath, scope.cacheType);
            }
          };

          scope.getFieldMetaObject = function (field) {
            return scope.metadata.currentStore[field];
          };

          scope.getFieldMetaValues = function (field) {
            return scope.getFieldMetaObject(field)['value-type'];
          };

          scope.isMultiValue = function (field) {
            var meta = scope.getFieldMetaObject(field);
            var hasField = utils.has(meta, 'allowed');
            return hasField ? utils.isNotNullOrUndefined(meta.allowed) : false;
          };


          // Initialise scope variables
          scope.init();
        }
      };
    }
  ]);
}());
