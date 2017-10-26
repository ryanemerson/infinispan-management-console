import {AbstractCounter} from "./AbstractCounter";
export class WeakCounter extends AbstractCounter {

  constructor(name: string, storage: string,
              initialValue: number, currentValue: number,
              protected concurrency: number, dmr: any) {
    super(name, storage, initialValue, currentValue, dmr);
  }

  getConcurrency(): number {
    return this.concurrency;
  }

  isWeak(): boolean {
    return true;
  }
}
