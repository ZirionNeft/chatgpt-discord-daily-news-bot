import { encode } from 'gpt-3-encoder';

type ILengthStrategy = (part: string) => number;

export const GptTokensStrategy: ILengthStrategy = (part) => encode(part).length;
export const StringStrategy: ILengthStrategy = (part) => part.length;

export class ChunkedData {
  private _size: number;
  private _strategy: ILengthStrategy = StringStrategy;
  private readonly _data: string[];

  private constructor(data: string[]) {
    this._data = data;
  }

  static of(data: string[]): ChunkedData {
    return new ChunkedData(data);
  }

  using(strategy: ILengthStrategy) {
    this._strategy = strategy;
    return this;
  }

  withSize(size: number) {
    this._size = size;
    return this;
  }

  split() {
    if (!this._size) {
      return this._data;
    }

    const result: string[] = [];
    let chunk = '';

    for (const part of this._data) {
      if (!chunk) {
        chunk = part;
      } else {
        if (chunk.length + this._strategy(part) > this._size) {
          result.push(chunk.trim());
          chunk = part;
        } else {
          chunk += part;
        }
      }
    }

    if (chunk.length > 0) {
      result.push(chunk.trim());
    }

    return result;
  }
}
