import {IProtocolConnector} from "./IProtocolConnector";
import {ISocketBinding} from "../socket-binding/ISocketBinding";

export interface IEndpoint {
  getName(): string;
  getType(): string;
  getCacheContainer(): string;
  getSocketBindingName(): string;
  setSocketBinding(binding: ISocketBinding): void;
  getEncryption(): any;
  getSocketBinding(): ISocketBinding;
  isMultiTenant(): boolean;
  getObject(path: string): any;
}
