import { InternalErrorException } from '../common';
import { DIController, InjectScope } from '../framework';
import { SchedulerService } from './scheduler.service';
import { ScheduleTime } from './types';

export function Scheduled(target: Type, time: ScheduleTime) {
  return function actualDecorator(
    originalMethod: (...args: any[]) => any,
    _context: ClassMethodDecoratorContext,
  ) {
    SchedulerService.addTask({
      time,
      handler: () => {
        const scope = DIController.getScope(target);
        if (scope !== InjectScope.SINGLETONE) {
          throw new InternalErrorException(
            `Scheduled decorator is possible only on request-scoped provider methods, but provider of '${target.name}' have '${scope}'`,
          );
        }

        const context = DIController.getInstanceOf(null, target);

        return originalMethod.bind(context);
      },
    });
  };
}
