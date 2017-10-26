import {ICounter} from "./ICounter";
import {CounterService} from "./CounterService";
export class AbstractCounter implements ICounter {

  constructor(protected name: string, protected storage: string,
              protected initialValue: number, protected currentValue: number,
              protected dmr: any) {
  }

  public getName(): string {
    return this.name;
  }

  public getStorage(): string {
    return this.storage;
  }

  public getInitialValue(): number {
    return this.initialValue;
  }

  public getCurrentValue(): number {
    return this.currentValue;
  }

  public getDMR(): any {
    return this.dmr;
  }

  public getType(): string {
    return this.isStrong() ? CounterService.STRONG_COUNTER : CounterService.WEAK_COUNTER;
  }

  isStrong(): boolean {
    return false;
  }

  hasBounds(): boolean {
    return false;
  }

  isWeak(): boolean {
    return false;
  }

  getLowerBound(): number {
    return undefined;
  }

  getUpperBound(): number {
    return undefined;
  }
  getConcurrency(): number {
    return undefined;
  }
}
