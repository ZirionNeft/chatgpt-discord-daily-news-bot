type Entry = number | '*' | `*/${number}`;

export type ScheduleTime = `${Entry} ${Entry} ${Entry} ${
Entry} ${Entry}`;

export type SchedulerTask = {
  time: ScheduleTime;
  handler: () => Promise<void>;
};
