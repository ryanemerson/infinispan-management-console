import {IStateService} from "angular-ui-router";
import {AbstractConfigurationCtrl} from "../../../../common/configuration/AbstractConfigurationCtrl";
import IModalService = angular.ui.bootstrap.IModalService;
import {LaunchTypeService} from "../../../../services/launchtype/LaunchTypeService";
import {ServerGroupService} from "../../../../services/server-group/ServerGroupService";
import {IServerGroup} from "../../../../services/server-group/IServerGroup";
import {IEndpoint} from "../../../../services/endpoint/IEndpoint";
import {openConfirmationModal, openErrorModal} from "../../../../common/dialogs/Modals";

export class EndpointConfigCtrl extends AbstractConfigurationCtrl {
  static $inject: string[] = ["$state", "$scope", "$uibModal", "serverGroupService", "launchType",
    "serverGroup", "endpoint", "endpointMeta", "endpointType", "endpointName"];

  readOnlyFields: string[];

  private typeChangeCancelled: boolean = false;

  constructor(private $state: IStateService,
              private $scope: ng.IScope,
              private $uibModal: IModalService,
              private serverGroupService: ServerGroupService,
              private launchType: LaunchTypeService,
              private serverGroup: IServerGroup,
              private endpoint: IEndpoint,
              private endpointMeta: any,
              private endpointType: string,
              private endpointName: string) {
    super();
    /*if (!this.isEditMode()) {
      setIsNewNodeRecursively(this.template);
    }*/
  }

  goToContainerCachesView(): void {
    this.$state.go("container.caches", {
      //profileName: this.profile,
      //containerName: this.containerName
    });
  }

  goToEndpointsView(): void {
    this.$state.go("server-group.endpoints", {});
  }

  isEditMode(): boolean {
    //return this.$state.current.name === "edit-cache-config";
    return true;
  }

  isTemplateNameEmpty(): boolean {
    //let templateName: string = this.template["template-name"];
    //return !(isNotNullOrUndefined(templateName) && isNonEmptyString(templateName));
    return true;
  }

  createEndpoint(): void {
    /*openConfirmationModal(this.$uibModal, "Create " + this.endpoint.name + " endpoint?")
     .result.then(() => {
     this.endpointService.createEndpoint(this.container, this.template.type, this.template["template-name"], this.template)
     .then(() => this.goToEndpointsView(), error => openErrorModal(this.$uibModal, error));
     });*/
  }

  updateEndpoint(): void {
    /*openConfirmationModal(this.$uibModal, "Update " + this.endpoint.name + " endpoint?")
      .result.then(() => {
      this.endpointService.updateEndpoint(this.container, this.template.type, this.template["template-name"], this.template)
        .then(() => this.goToEndpointsView(), error => openErrorModal(this.$uibModal, error));
    });*/
  }

  private reloadMetaAndDataOnTypeChange(newType: string, oldType: string): void {

  }
}
