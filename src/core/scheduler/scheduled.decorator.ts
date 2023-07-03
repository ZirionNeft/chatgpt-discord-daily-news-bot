import { SchedulerService } from './scheduler.service';
import { ScheduleTime } from './types';

export function Scheduled(time: ScheduleTime) {
  return function actualDecorator(
    originalMethod: (...args: any[]) => any,
    _context: ClassMethodDecoratorContext,
  ) {
    SchedulerService.addTask({
      time,
      handler: originalMethod,
    });
  };
}
