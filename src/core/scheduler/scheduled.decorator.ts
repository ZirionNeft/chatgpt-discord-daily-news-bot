import { DIController, InjectScope } from '../framework';
import { SchedulerService } from './scheduler.service';
import { ScheduleTime } from './types';

export function Scheduled(time: ScheduleTime) {
  return function actualDecorator(
    originalMethod: (...args: any[]) => any,
    { addInitializer }: ClassMethodDecoratorContext,
  ) {
    addInitializer(() => {
      SchedulerService.addTask({
        time,
        handler: () => {
          const scope = DIController.getScope(this.prototype);
          if (scope !== InjectScope.SINGLETONE) {
            throw new Error(
              `Scheduled decorator is possible only on request-scoped provider methods, but provider of '${this.prototype.name}' have '${scope}'`,
            );
          }

          return originalMethod.bind(this);
        },
      });
    });
  };
}
