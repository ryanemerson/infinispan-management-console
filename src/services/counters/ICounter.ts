
export interface ICounter {
  getName(): string;
  getStorage(): string;
  getType(): string;
  getInitialValue(): number;
  getCurrentValue(): number;
  getLowerBound(): number;
  getUpperBound(): number;
  getConcurrency(): number;
  isStrong(): boolean;
  hasBounds(): boolean;
  isWeak(): boolean;
  getDMR(): any;

}
