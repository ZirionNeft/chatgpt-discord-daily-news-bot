export class WeakRefCounter<T extends object = object> extends WeakSet<T> {
  private _counter = 0;

  constructor() {
    super();
  }

  get count() {
    return this._counter;
  }

  override add(value: T): this {
    super.add(value);

    this._counter++;

    return this;
  }

  override delete(value: T): boolean {
    if (super.delete(value)) {
      this._counter--;
      return true;
    }

    return false;
  }
}
