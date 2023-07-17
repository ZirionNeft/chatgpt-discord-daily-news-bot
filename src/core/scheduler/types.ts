export type ScheduleTime = `${number | '*'} ${number | '*'} ${number | '*'} ${
  | number
  | '*'} ${number | '*'}`;

export type SchedulerTask = {
  time: ScheduleTime;
  handler: () => Promise<void>;
};
