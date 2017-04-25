import {App} from "../../ManagementConsole";
import {DmrService} from "../dmr/DmrService";
import {IEndpoint} from "./IEndpoint";
import {IDmrRequest} from "../dmr/IDmrRequest";
import {SocketBindingService} from "../socket-binding/SocketBindingService";
import {ISocketBinding} from "../socket-binding/ISocketBinding";
import IQService = angular.IQService;
import {LaunchTypeService} from "../launchtype/LaunchTypeService";
import {isNotNullOrUndefined, traverse, deepValue} from "../../common/utils/Utils";
import {ICacheContainer} from "../container/ICacheContainer";
import {IServerGroup} from "../server-group/IServerGroup";
import {IServerAddress} from "../server/IServerAddress";

const module: ng.IModule = App.module("managementConsole.services.endpoint", []);

export class EndpointService {
  static $inject: string[] = ["$q", "dmrService", "socketBindingService", "launchType"];

  static parseEndpoint(namePath: string [], object: any, socketBinding?: ISocketBinding): IEndpoint {
    return <IEndpoint> {
      name: isNotNullOrUndefined(object.name) ? object.name : isNotNullOrUndefined(namePath) && namePath.length > 0 ? namePath[0] : "",
      "cache-container": object["cache-container"],
      "encryption": (object.encryption != null && object.encryption !== undefined) ? object.encryption : "",
      "socket-binding-name": object["socket-binding"],
      "socket-binding": socketBinding,
      "hotrod-socket-binding": object["hotrod-socket-binding"],
      "rest-socket-binding": object["rest-socket-binding"],
      "worker-threads": object["worker-threads"],
      "idle-timeout": object["idle-timeout"],
      "tcp-nodelay": object["tcp-nodelay"],
      "send-buffer-size": object["end-buffer-size"],
      "receive-buffer-size": object["receive-buffer-size"]
    };
  }

  constructor(private $q: IQService, private dmrService: DmrService,
              private socketBindingService: SocketBindingService, private launchType: LaunchTypeService) {
  }

  getAllEndpoints(cacheContainer: ICacheContainer): ng.IPromise<IEndpoint[]> {
    let request: IDmrRequest = <IDmrRequest>{
      address: this.getEndpointAddress(cacheContainer.profile),
      recursive: true
    };
    let deferred: ng.IDeferred<IEndpoint[]> = this.$q.defer<IEndpoint[]>();

    this.dmrService.readResource(request)
      .then((endpointResponse: any): IEndpoint[] => {
        let endpoints: IEndpoint[] = [];
        let trail: String [] = [];
        traverse(endpointResponse, (key: string, value: string, trail: string []) => {
          let traversedObject: any = deepValue(endpointResponse, trail);
          let isEndpoint: boolean = isNotNullOrUndefined(traversedObject) && key === "cache-container";
          let isMultiRouterEndpoint: boolean = (isNotNullOrUndefined(traversedObject) && key === "hotrod-socket-binding");
          if (isEndpoint) {
            let endpoint: IEndpoint = EndpointService.parseEndpoint(trail, traversedObject);
            if (endpoint["cache-container"] === cacheContainer.name) {
              endpoints.push(endpoint);
            }
          } else if (isMultiRouterEndpoint) {
            let endpoint: IEndpoint = EndpointService.parseEndpoint(trail, traversedObject);
            endpoints.push(endpoint);
          }
        }, trail);
        return endpoints;
      })
      .then((endpoints) => {
        return this.socketBindingService.getAllSocketBindingsInGroup(cacheContainer.serverGroup["socket-binding-group"]).then((socketBindings) => {
          this.addSocketBindingToEndpoint(socketBindings, endpoints);
          deferred.resolve(endpoints);
        });
      });
    return deferred.promise;
  }

  getEndpoint(serverGroup: IServerGroup, endpointType: string, name: string): ng.IPromise<IEndpoint> {
    let resolvedName: string = isNotNullOrUndefined(name) ? name : endpointType;
    let request: IDmrRequest = <IDmrRequest>{
      address: this.getEndpointAddress(serverGroup.profile).concat(endpointType).concat(resolvedName),
      recursive: true,
    };
    return this.dmrService.readResource(request);
  }

  getAllClusterEndpoints(serverGroup: IServerGroup): ng.IPromise<IEndpoint[]> {
    let request: IDmrRequest = <IDmrRequest>{
      address: this.getEndpointAddress(serverGroup.profile),
      recursive: true
    };
    let deferred: ng.IDeferred<IEndpoint[]> = this.$q.defer<IEndpoint[]>();

    this.dmrService.readResource(request)
      .then((endpointResponse: any): IEndpoint[] => {
        let endpoints: IEndpoint[] = [];
        let trail: String [] = [];
        traverse(endpointResponse, (key: string, value: string, trail: string []) => {
          let traversedObject: any = deepValue(endpointResponse, trail);
          let isEndpoint: boolean = isNotNullOrUndefined(traversedObject) && key === "cache-container";
          let isMultiRouterEndpoint: boolean = (isNotNullOrUndefined(traversedObject) && key === "hotrod-socket-binding");
          if (isEndpoint) {
            let endpoint: IEndpoint = EndpointService.parseEndpoint(trail, traversedObject);
            endpoints.push(endpoint);
          } else if (isMultiRouterEndpoint) {
            let endpoint: IEndpoint = EndpointService.parseEndpoint(trail, traversedObject);
            endpoints.push(endpoint);
          }
        }, trail);
        return endpoints;
      })
      .then((endpoints) => {
        return this.socketBindingService.getAllSocketBindingsInGroup(serverGroup["socket-binding-group"]).then((socketBindings) => {
          this.addSocketBindingToEndpoint(socketBindings, endpoints);
          deferred.resolve(endpoints);
        });
      });
    return deferred.promise;
  }

  getConfigurationMeta(profile: string, endpointType: string, endpointName: string): ng.IPromise<any> {
    let deferred: ng.IDeferred<any> = this.$q.defer();
    let address: string[] = this.getEndpointAddress(profile).concat(endpointType).concat(endpointType);
    this.dmrService.readResourceDescription({
      address: address,
      recursive: true
    }).then(
      response => {
        //TODO perhaps inspect and adjust the response
        deferred.resolve(response);
      },
      error => deferred.reject(error));
    return deferred.promise;
  }

  private addSocketBindingToEndpoint(socketBindings: ISocketBinding[], endpoints: IEndpoint[]): void {
    for (let endpoint of endpoints) {
      for (let socketBinding of socketBindings) {
        if (endpoint["socket-binding-name"] === socketBinding.name) {
          endpoint["socket-binding"] = socketBinding;
        } if (endpoint["hotrod-socket-binding"] === socketBinding.name) {
          endpoint["hotrod-socket-binding"] = socketBinding;
        } if (endpoint["rest-socket-binding"] === socketBinding.name) {
          endpoint["rest-socket-binding"] = socketBinding;
        }
      }
    }
  }

  private getEndpointAddress(profile: string): string[] {
    let endpointPath: string[] = ["subsystem", "datagrid-infinispan-endpoint"];
    return this.launchType.getProfilePath(profile).concat(endpointPath);
  }
}

module.service("endpointService", EndpointService);
