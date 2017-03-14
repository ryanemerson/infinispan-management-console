import IModalService = angular.ui.bootstrap.IModalService;
import {IMap} from "../../../common/utils/IMap";
import {IServerGroup} from "../../../services/server-group/IServerGroup";
import {IEndpoint} from "../../../services/endpoint/IEndpoint";
import {AddEndpointModalCtrl} from "./AddEndpointModalCtrl";
import {isNotNullOrUndefined} from "../../../common/utils/Utils";

export class EndpointsCtrl {
  static $inject: string[] = ["$uibModal", "serverGroup", "endpoints"];

  constructor(private $uibModal: IModalService,
              private serverGroup: IServerGroup,
              private endpoints: IEndpoint[]){
    console.log(endpoints)
  }

  execute(): void{

  }

  isEndpointEnabled(endpoint: IEndpoint): boolean {
    return true;
  }

  isEndpointDisabled(endpoint: IEndpoint): boolean {
    return !this.isEndpointEnabled(endpoint);
  }

  isMultiTenantRouter(endpoint: IEndpoint): boolean {
    return isNotNullOrUndefined(endpoint) &&
      (isNotNullOrUndefined(endpoint["hotrod-socket-binding"]) || isNotNullOrUndefined(endpoint["rest-socket-binding"]));
  }

  createEndpointModal(): void {
    this.$uibModal.open({
      templateUrl: "module/server-group/endpoints/view/add-endpoint-modal.html",
      controller: AddEndpointModalCtrl,
      controllerAs: "ctrl",
      resolve: {
        //container: (): ICacheContainer => this.container,
        //templates: (): ITemplate[] => this.templates
      }
    });
  }

}
