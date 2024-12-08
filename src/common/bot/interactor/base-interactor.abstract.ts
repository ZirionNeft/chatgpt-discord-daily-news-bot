export abstract class BaseInteractor<Request extends object = object> {
  abstract bootstrap(request: Request): Promise<void>;

  abstract handle(request: Request): Promise<void>;
}
