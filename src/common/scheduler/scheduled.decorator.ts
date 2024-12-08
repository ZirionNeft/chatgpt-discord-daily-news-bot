import schedulerService from './scheduler.service.js';
import type { ScheduleTime } from './types.js';

export function Scheduled(time: ScheduleTime) {
  return function actualDecorator(
    originalMethod: (...args: any[]) => any,
    { addInitializer }: ClassMethodDecoratorContext,
  ) {
    addInitializer(() => {
      schedulerService.addTask({
        time,
        handler: originalMethod.bind(this),
      });
    });
  };
}
