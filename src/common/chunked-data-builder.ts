import { encode } from 'gpt-3-encoder';

type ILengthStrategy = (part: string) => number;

export const GptTokensStrategy: ILengthStrategy = (part) => encode(part).length;
export const StringStrategy: ILengthStrategy = (part) => part.length;

export default class ChunkedData {
  #size!: number;
  #strategy: ILengthStrategy = StringStrategy;
  readonly #data: string[];

  private constructor(data: string[]) {
    this.#data = data;
  }

  static of(data: string[]): ChunkedData {
    return new ChunkedData(data);
  }

  using(strategy: ILengthStrategy) {
    this.#strategy = strategy;
    return this;
  }

  withSize(size: number) {
    this.#size = size;
    return this;
  }

  split() {
    if (!this.#size) {
      return this.#data;
    }

    const result: string[] = [];
    let chunk = '';

    for (const part of this.#data) {
      if (!chunk) {
        chunk = part;
      } else {
        if (chunk.length + this.#strategy(part) > this.#size) {
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
