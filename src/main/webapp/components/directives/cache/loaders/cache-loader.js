(function () {
  'use strict';

  var module = angular.module('ispn.directives.cache.cacheLoader', ['ispn.services.utils']);

  module.component('cacheLoader', {
    bindings: {
      data: '=',
      metadata: '=',
      readOnly: '=',
      outsideController: '='
    },
    templateUrl: 'components/directives/cache/loaders/cache-loader.html',
    controller: function (utils) {
      var vm = this;

      vm.init = function () {
        vm.fields = ['preload', 'shared'];
        vm.allFields = vm.fields.concat(vm.fields, 'class');
        vm.cacheLoaders = [
          {
            class: 'None',
            label: 'No Cache Loader'
          },
          {
            class: 'org.infinispan.persistence.async.AsyncCacheLoader',
            label: 'Async Cache Loader'
          },
          {
            class: 'org.infinispan.persistence.async.AdvancedAsyncCacheLoader',
            label: 'Advanced Async Cache Loader'
          },
          {
            class: 'org.infinispan.persistence.jdbc.binary.JdbcBinaryStore',
            label: 'Binary Based JDBC Store'
          },
          {
            class: 'org.infinispan.persistence.cluster.ClusterLoader',
            label: 'Cluster Loader'
          },
          {
            class: '',
            label: 'Custom Loader'
          },
          {
            class: 'org.infinispan.persistence.jpa.JpaStore',
            label: 'JPA Store'
          },
          {
            class: 'org.infinispan.persistence.leveldb.LevelDBStore',
            label: 'LevelDB Store'
          },
          {
            class: 'org.infinispan.persistence.jdbc.mixed.JdbcMixedStore',
            label: 'Mixed JDBC Store'
          },
          {
            class: 'org.infinispan.persistence.remote.RemoteStore',
            label: 'Remote Store'
          },
          {
            class: 'org.infinispan.persistence.rest.RestStore',
            label: 'Rest Store'
          },
          {
            class: 'org.infinispan.persistence.file.SingleFileStore',
            label: 'Single File Store'
          },
          {
            class: 'org.infinispan.persistence.sifs.SoftIndexFileStore',
            label: 'Soft Index File Store'
          },
          {
            class: 'org.infinispan.persistence.jdbc.stringbased.JdbcStringBasedStore',
            label: 'String Based JDBC Store'
          }
        ];
        vm.initInternalController();
        vm.initPrevDataAndDefaults();
        vm.cleanMetadata();
      };

      vm.initInternalController = function () {
        if (utils.isNotNullOrUndefined(vm.outsideController)) {
          if (utils.isArray(vm.outsideController)) {
            var handle = {};
            vm.outsideController.push(handle);
            vm.internalController = handle;
          } else {
            vm.internalController = vm.outsideController;
          }
        } else {
          vm.internalController = {};
        }

        vm.internalController.requiresRestart = vm.requiresRestart;
        vm.internalController.cleanMetadata = vm.cleanMetadata;
        vm.internalController.isAnyFieldModified = vm.isAnyFieldModified;
      };

      vm.initPrevDataAndDefaults = function () {
        vm.prevData = {};
        //if not initializing to defaults then make root node in the model tree (if not existing already)
        if (!utils.isNotNullOrUndefined(vm.data)) {
          vm.data = {};
        }

        vm.data['is-new-node'] = utils.isNullOrUndefined(vm.data['class']);
        vm.type = {
          type: vm.getStoreType(vm.data.class, vm.cacheLoaders)
        }
      };

      vm.cleanFieldMetadata = function (field) {
        if (utils.isNotNullOrUndefined(vm.metadata[field])) {
          utils.makeFieldClean(vm.metadata[field]);
        } else {
          console.log("Cleaning metadata for configuration field " + field + ", that field does not exist in DMR model")
        }
      };

      vm.cleanMetadata = function () {
        vm.allFields.forEach(function (attrName) {
          vm.cleanFieldMetadata(attrName);
          if (utils.isNotNullOrUndefined(vm.data[attrName])) {
            vm.prevData[attrName] = angular.copy(vm.data[attrName]);
          } else {
            vm.prevData[attrName] = '';
          }
        });
        vm.prevData['type'] = vm.type.type;
        vm.cleanFieldMetadata('class');
      };

      vm.undoFieldChange = function (field) {
        vm.data[field] = vm.prevData[field];
        utils.makeFieldClean(vm.metadata[field]);
      };

      vm.resolveFieldType = function (field) {
        return utils.resolveFieldType(vm.metadata, field);
      };

      vm.isAnyFieldModified = function () {
        return vm.allFields.some(function (attrName) {
          return utils.isFieldValueModified(vm.metadata[attrName]);
        });
      };

      vm.requiresRestart = function () {
        return vm.allFields.some(function (attrName) {
          return utils.isFieldValueModified(vm.metadata[attrName]) && (utils.fieldChangeRequiresRestart(vm.metadata[attrName]));
        });
      };

      vm.fieldValueModified = function (field) {
        var meta = vm.metadata[field];
        var original = vm.prevData[field];
        var latest = vm.data[field];

        if (((utils.isNullOrUndefined(original) || original === '') && !latest) || original === latest) {
          utils.makeFieldClean(meta, field, true, vm);
        } else {
          utils.makeFieldDirty(meta, field, true, vm);
        }
      };

      vm.changeLoaderClass = function () {
        vm.data['class'] = utils.isNullOrUndefined(vm.type.type) ? null : angular.copy(vm.type.type);
        vm.fieldValueModified('class');
      };

      vm.undoClassChange = function () {
        vm.undoFieldChange('class');
        vm.type.type = vm.getStoreType(vm.data['class'], vm.cacheLoaders);
      };

      vm.getStyle = function (field) {
        return utils.isNotNullOrUndefined(vm.metadata[field]) ? vm.metadata[field].style : '';
      };

      vm.getStoreType = function (classValue, cacheLoaders) {
        if (utils.isNullOrUndefined(classValue)) {
          return 'None';
        } else {
          var nonCustomStore = cacheLoaders.some(function (loader) {
            return loader.class === classValue;
          });
          return nonCustomStore ? classValue : '';
        }
      };

      vm.isCustomLoader = function () {
        if (utils.isNotNullOrUndefined(vm.type.type) && vm.type.type.length == 0) {
          return true;
        } else {
          return !vm.cacheLoaders.some(function (loader) {
            return loader.class !== vm.data.class;
          });
        }
      };

      vm.init();
    }
  });
}());
