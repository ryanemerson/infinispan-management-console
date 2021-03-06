import {App} from "../../../ManagementConsole";
import {ContainerConfigCtrl} from "./ContainerConfigCtrl";
import {IRedirectState} from "../../../common/IRedirectState";
import {SchemaConfigCtrl} from "./schemas/SchemaConfigCtrl";
import {TransportConfigCtrl} from "./transport/TransportConfigCtrl";
import {ThreadPoolsCtrl} from "./thread-pools/ThreadPoolsCtrl";
import {TemplatesCtrl} from "./templates/TemplatesCtrl";

const module: ng.IModule = App.module("managementConsole.cache-container.config", []);

// @ngInject
module.config(($stateProvider: ng.ui.IStateProvider) => {
  $stateProvider.state("container-config", <IRedirectState>{
    parent: "root",
    url: "containers/:profileName/:containerName/config",
    templateUrl: "module/cache-container/config/view/config.html",
    controller: ContainerConfigCtrl,
    controllerAs: "ctrl",
    redirectTo: "container-config.schemas",
    resolve: {
      container: ["$stateParams", "containerService", ($stateParams, containerService) => {
        return containerService.getContainer($stateParams.containerName, $stateParams.profileName);
      }]
    }
  });

  $stateProvider.state("container-config.schemas", {
    url: "/schemas",
    templateUrl: "module/cache-container/config/schemas/view/schemas.html",
    controller: SchemaConfigCtrl,
    controllerAs: "schemaCtrl",
    resolve: {
      availableSchemas: ["container", "schemaService", (container, schemaService) => {
        return schemaService.getProtoSchemaNames(container);
      }]
    }
  });

  $stateProvider.state("container-config.transport", {
    url: "/transport",
    templateUrl: "module/cache-container/config/transport/view/transport.html",
    controller: TransportConfigCtrl,
    controllerAs: "transCtrl",
    resolve: {
      transport: ["container", "containerConfigService", (container, containerConfigService) => {
        return containerConfigService.getTransportConfig(container);
      }],
      meta: ["container", "containerConfigService", (container, containerConfigService) => {
        return containerConfigService.getTransportMeta(container);
      }]
    }
  });

  $stateProvider.state("container-config.thread-pools", {
    url: "/thread-pools",
    templateUrl: "module/cache-container/config/thread-pools/view/thread-pools.html",
    controller: ThreadPoolsCtrl,
    controllerAs: "poolCtrl",
    resolve: {
      threadPools: ["container", "containerConfigService", (container, containerConfigService) => {
        return containerConfigService.getThreadPoolsConfig(container);
      }],
      meta: ["container", "containerConfigService", (container, containerConfigService) => {
        return containerConfigService.getContainerMeta(container);
      }]
    }
  });

  $stateProvider.state("container-config.templates", {
    url: "/templates",
    templateUrl: "module/cache-container/config/templates/view/templates.html",
    controller: TemplatesCtrl,
    controllerAs: "tmpCtrl",
    resolve: {
      templates: ["container", "cacheConfigService", (container, cacheConfigService) => {
        return cacheConfigService.getAllContainerTemplates(container);
      }]
    }
  });
});
