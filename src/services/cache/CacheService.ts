import {App} from "../../ManagementConsole";
import {DmrService} from "../dmr/DmrService";
import {ICache} from "./ICache";
import {LaunchTypeService} from "../launchtype/LaunchTypeService";
import {IDmrRequest} from "../dmr/IDmrRequest";
import {Cache} from "./Cache";
import {ICacheConfiguration} from "../cache-config/ICacheConfiguration";
import {isNullOrUndefined, convertCacheAttributeIntoFieldName} from "../../common/utils/Utils";
import {CacheConfigService, CACHE_TYPES} from "../cache-config/CacheConfigService";
import {ITemplate} from "../container-config/ITemplate";

const module: ng.IModule = App.module("managementConsole.services.cache", []);

export class CacheService {
  static $inject: string[] = ["$q", "dmrService", "launchType", "cacheConfigService"];

  constructor(private $q: ng.IQService,
              private dmrService: DmrService,
              private launchType: LaunchTypeService,
              private cacheConfigService: CacheConfigService) {
  }

  getAllCachesInContainer(container: string, profile?: string): ng.IPromise<ICache[]> {
    let deferred: ng.IDeferred<ICache[]> = this.$q.defer<ICache[]>();
    let request: IDmrRequest = {
      address: this.generateAddress(container, profile),
      recursive: true,
      "recursive-depth": 1
    };

    let caches: ICache[] = [];
    this.dmrService.readResource(request)
      .then(response => {
        for (let cacheType of CACHE_TYPES) {
          if (isNullOrUndefined(response[cacheType])) {
            continue; // Do nothing as no caches of this type exist
          }

          for (let cacheName of Object.keys(response[cacheType])) {
            let cache: any = response[cacheType][cacheName];
            caches.push(new Cache(cacheName, cacheType, cache.configuration));
          }
        }
        return caches;
      })
      .then(caches => {
        // Get config object for all caches
        return this.$q.all(caches.map(cache => {
          return this.cacheConfigService.getCacheConfiguration(cache.name, cache.type, container, profile);
        }));
      })
      .then(configurations => {
        // Add config object to all caches
        for (let cacheIndex in caches) {
          caches[cacheIndex].configModel = <ICacheConfiguration> configurations[cacheIndex];
        }
        deferred.resolve(caches);
      });
    return deferred.promise;
  }

  getAllCachesByType(): ICache[] {
    return [];
  }

  getCache(name: string, type: string, container: string, profile?: string): ng.IPromise<ICache> {
    let typeKey: string = convertCacheAttributeIntoFieldName(type);
    let deferred: ng.IDeferred<ICache> = this.$q.defer<ICache>();
    let request: IDmrRequest = {
      address: this.generateAddress(container, profile).concat(typeKey, type)
    };
    this.dmrService.readResource(request).then((response) => deferred.resolve(new Cache(name, type, response.configuration)));
    return deferred.promise;
  }

  createCacheFromTemplate(container: string, name: string, template: ITemplate): ng.IPromise<void> {
    // TODO
    return null;
  }

  createCache(container: string, name: string): ng.IPromise<void> {
    // TODO
    return null;
  }

  private generateAddress(container: string, profile?: string): string[] {
    let address: string[] = this.launchType.isStandaloneMode() ? [] : [].concat("profile", profile);
    return address.concat("subsystem", "datagrid-infinispan", "cache-container", container);
  }
}

module.service("cacheService", CacheService);
