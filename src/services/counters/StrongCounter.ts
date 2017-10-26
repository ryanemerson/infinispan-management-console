import {isNotNullOrUndefined} from "../../common/utils/Utils";
import {AbstractCounter} from "./AbstractCounter";
export class StrongCounter extends AbstractCounter {

  constructor(name: string, storage: string,
              initialValue: number, currentValue: number,
              protected lowerBound: number, protected upperBound: number, dmr: any) {
    super(name, storage, initialValue, currentValue, dmr);
  }

  isStrong(): boolean {
    return true;
  }

  hasBounds(): boolean {
    return isNotNullOrUndefined(this.getLowerBound()) || isNotNullOrUndefined(this.getUpperBound());
  }

  getLowerBound(): number {
    return this.lowerBound;
  }

  getUpperBound(): number {
    return this.upperBound;
  }
}
