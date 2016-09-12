import {IConfigurationCallback} from "../../common/configuration/IConfigurationCallback";
import {RESOURCE_DESCRIPTION_MAP} from "../../common/configuration/ConfigUtil";
import {deepGet, isNotNullOrUndefined} from "../../common/utils/Utils";

export class CacheConfigurationCtrl {

  cacheType: string;
  data: any;
  meta: any;
  initDefaults: boolean;
  readOnly: boolean;
  configCallbacks: IConfigurationCallback[];
  editMode: boolean;

  readOnlyFields: string[];

  constructor() {
    if (this.editMode) {
      this.readOnlyFields = ["type", "template-name"];
    }
  }

  getTemplateUrl(): string {
    return "components/cache-configuration/view/" + this.cacheType + ".html";
  }

  getMetaForResource(resource: string): any {
    let resourcePath: string = RESOURCE_DESCRIPTION_MAP[resource];
    return deepGet(this.meta, resourcePath);
  }
}
