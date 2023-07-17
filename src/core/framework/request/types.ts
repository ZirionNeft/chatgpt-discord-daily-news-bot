export type ActionIdFactory<Request extends InstanceType<any>> = (
  request: Request,
) => MaybePromise<string>;
