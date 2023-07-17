export type RequestWrapper<T extends object = object> = T & {
  get requestId(): string;

  get actionId(): string;
};
