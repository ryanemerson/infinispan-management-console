import {isNotNullOrUndefined, isNullOrUndefined, deepGet} from "../../common/utils/Utils";
import {IConfigurationCallback} from "../../common/configuration/IConfigurationCallback";
import {
  isFieldValueModified,
  fieldChangeRequiresRestart,
  convertListToJson,
  makeFieldClean
} from "../../common/configuration/ConfigUtil";

export class ConfigurationSectionCtrl implements IConfigurationCallback {

  data: any;
  meta: any;
  prevData: any;
  fields: {name: string, fields: string[], dataPath: string, metaPath: string}[];
  initDefaults: boolean;
  readOnly: boolean;
  readOnlyFields: string[];
  configCallbacks: IConfigurationCallback[];
  removable: boolean;
  placeholders: any;
  loadedWithData: boolean;
  createdOrDestroyedFromUI: boolean = false;

  constructor() {
    if (isNullOrUndefined(this.data)) {
      this.data = {};
    }
    if (isNotNullOrUndefined(this.configCallbacks)) {
      this.configCallbacks.push(this);
    }
    this.prevData = {};
    let hasFieldsWithData: boolean = this.hasAnyFieldPreviousData();
    this.loadedWithData = hasFieldsWithData;
    this.data["is-new-node"] = !hasFieldsWithData;
    this.cleanMetadata();
    this.createPlaceholders();
  }

  hasAnyFieldPreviousData(): boolean {
    let result:boolean = this.fields.some(group => {
      let dataObject: any = this.resolveObject(this.data, group.dataPath);
      if (isNotNullOrUndefined(dataObject)) {
        return group.fields.some(attr => isNotNullOrUndefined([attr]), this);
      } else {
        return false;
      }
    });
    return result;
  }

  isAnyFieldModified(): boolean {
    return this.createdOrDestroyedFromUI || this.fields.some(group => {
      return group.fields.some(attrName => {
        let meta: any = this.resolveObject(this.meta, group.metaPath);
        return isNotNullOrUndefined(meta) && isFieldValueModified(meta[attrName]);
      }, this);
    });
  }

  isRestartRequired(): boolean {
    return this.fields.some(group => {
      return group.fields.some(attrName => {
        let meta: any = this.resolveObject(this.meta, group.metaPath);
        return isFieldValueModified(meta[attrName]) && fieldChangeRequiresRestart(meta[attrName]);
      }, this);
    });
  }

  cleanMetadata(): void {
    this.fields.forEach(group => {
      group.fields.forEach(attrName => {
        let data: any = this.resolveObject(this.data, group.dataPath);
        let meta: any = this.resolveObject(this.meta, group.metaPath);
        convertListToJson(data, meta, attrName);
        this.cleanFieldMeta(meta, attrName);
        if (isNotNullOrUndefined(data)) {
          this.prevData[attrName] = isNotNullOrUndefined(data[attrName]) ? angular.copy(data[attrName]) : "";
        } else {
          console.log("Could not resolve data object for attribute " +
            attrName + " check the data path specified in HTML which is " +
            group.dataPath + " while the root data object is ", this.data);
        }
      }, this);
    });
  }

  isReadOnly(field: string): boolean {
    if (isNotNullOrUndefined(this.readOnlyFields)) {
      return this.readOnlyFields.some(readOnlyField => readOnlyField === field);
    }
    return false;
  }

  createNewDefault(): void {
    // initialize all fields with default values, make fields dirty
    this.iterateFields((group: any, att: string) => {
      let data: any = this.resolveObject(this.data, group.dataPath);
      let meta: any = this.resolveObject(this.meta, group.metaPath);
      data[att] = meta[att].default;
      this.prevData[att] = meta[att].default;
    });
    this.data["is-new-node"] = !this.loadedWithData;
    this.data["is-removed"] = false;
    this.createdOrDestroyedFromUI = true;
  }

  isNewNode(): boolean {
    return this.data["is-new-node"];
  }

  destroy(): void {
    this.data = {};
    this.prevData = {};
    this.data["is-new-node"] = !this.loadedWithData;
    this.data["is-removed"] = this.loadedWithData;
    this.cleanMetadata();
    this.createdOrDestroyedFromUI = true;
  }

  iterateFields(callback: (group: any, attribute: string) => void): void {
    this.fields.forEach((group) => {
      group.fields.forEach((attrName) => {
        if (this.meta[attrName].hasOwnProperty("default")) {
          callback(group, attrName);
        }
      });
    });
  }

  isRemovable: Function = () => isNotNullOrUndefined(this.removable) ? this.removable : false;

  findGroupForAttribute(name: string): any {
    let result: any = null;
    this.fields.forEach(group => {
      group.fields.forEach(attributeName => {
        if (attributeName === name) {
          result = group;
        }
      });
    });
    return result;
  }

  resolveMeta(attributeName: string): any {
    let meta: any;
    let group: any = this.findGroupForAttribute(attributeName);
    if(isNotNullOrUndefined(group)) {
      meta = this.resolveObject(this.meta, group.metaPath);
    }
    if (isNotNullOrUndefined(meta) && isNotNullOrUndefined(attributeName)) {
      if (isNotNullOrUndefined(meta[attributeName])) {
        return meta[attributeName];
      } else if (isNotNullOrUndefined(group.metaPath)) {
        let metaRoot: any = deepGet(meta, group.metaPath);
        if (isNotNullOrUndefined(metaRoot)){
          return metaRoot[attributeName];
        } else {
          console.log("Could not resolve meta for attribute " + attributeName + " in group " + group);
        }
      }
    } else {
      console.log("Could not resolve meta for attribute " + attributeName + " in group " + group);
    }
  }

  resolveData(group: any): any {
    let data: any;
    if(isNotNullOrUndefined(group)) {
      data = this.resolveObject(this.data, group.dataPath);
    }
    return data;
  }

  resolveObject(root: any, path: string): any {
    let result: any;
    if (isNotNullOrUndefined(root)) {
      if (isNotNullOrUndefined(path)) {
        result = deepGet(root, path)
      } else {
        result = root;
      }
    }
    return result;
  }

  private createPlaceholders(): void {
    if (!this.initDefaults) {
      return;
    }
    this.placeholders = {};
    this.fields.forEach((group) => {
      group.fields.forEach((attrName) => {
        let meta: any = this.resolveObject(this.meta, group.metaPath);
        if (meta[attrName].hasOwnProperty("default")) {
          this.placeholders[attrName] = meta[attrName].default;
        }
      });
    });
  }

  private cleanFieldMeta(meta: any, field: string): void {
    if (isNotNullOrUndefined(meta[field])) {
      makeFieldClean(meta[field]);
    }
  }
}
