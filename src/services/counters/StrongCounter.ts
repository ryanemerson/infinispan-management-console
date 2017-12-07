import {AbstractCounter} from "./AbstractCounter";
import {CounterService} from "./CounterService";

export class StrongCounter extends AbstractCounter {

  constructor(name: string, storage: string, initialValue: number, currentValue: number,
              protected lowerBound: number, protected upperBound: number) {
    super(name, storage, initialValue, currentValue);
  }

  getLowerBound(): number {
    return this.lowerBound;
  }

  getUpperBound(): number {
    return this.upperBound;
  }

  toString(): string {
    return CounterService.STRONG_COUNTER;
  }
}
