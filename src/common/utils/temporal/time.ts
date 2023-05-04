export const SECOND_AS_MS = 1000;
export const MINUTE_AS_MS = 60 * SECOND_AS_MS;
export const HOUR_AS_MS = 60 * MINUTE_AS_MS;
export const DAY_AS_MS = 24 * HOUR_AS_MS;

export class Time {
  constructor(private readonly timeInMilliseconds: number) {}

  toMilliseconds(): number {
    return this.timeInMilliseconds;
  }

  toSeconds(): number {
    return this.timeInMilliseconds / SECOND_AS_MS;
  }

  toMinutes(): number {
    return this.timeInMilliseconds / MINUTE_AS_MS;
  }

  toHours(): number {
    return this.timeInMilliseconds / HOUR_AS_MS;
  }

  toDays(): number {
    return this.timeInMilliseconds / DAY_AS_MS;
  }

  add(time: Time): Time {
    return new Time(this.timeInMilliseconds + time.toMilliseconds());
  }

  sub(time: Time): Time {
    return new Time(this.timeInMilliseconds - time.toMilliseconds());
  }

  multiply(factor: number): Time {
    return new Time(this.timeInMilliseconds * factor);
  }

  divide(divisor: number): Time {
    return new Time(this.timeInMilliseconds / divisor);
  }

  isEqual(time: Time): boolean {
    return this.timeInMilliseconds === time.toMilliseconds();
  }

  isGreaterThan(time: Time): boolean {
    return this.timeInMilliseconds > time.toMilliseconds();
  }

  isGreaterThanOrEqual(time: Time): boolean {
    return this.timeInMilliseconds >= time.toMilliseconds();
  }

  isLessThan(time: Time): boolean {
    return this.timeInMilliseconds < time.toMilliseconds();
  }

  isLessThanOrEqual(time: Time): boolean {
    return this.timeInMilliseconds <= time.toMilliseconds();
  }

  static fromMilliseconds(timeInMilliseconds: number): Time {
    return new Time(timeInMilliseconds);
  }

  static fromSeconds(timeInSeconds: number): Time {
    return new Time(timeInSeconds * SECOND_AS_MS);
  }

  static fromMinutes(timeInMinutes: number): Time {
    return new Time(timeInMinutes * MINUTE_AS_MS);
  }

  static fromHours(timeInHours: number): Time {
    return new Time(timeInHours * HOUR_AS_MS);
  }

  static fromDays(timeInDays: number): Time {
    return new Time(timeInDays * DAY_AS_MS);
  }
}

export function getTimeMilliseconds(time: Time | number) {
  if (typeof time === 'number') {
    return time;
  }
  return time.toMilliseconds();
}

export function getTimeSeconds(time: Time | number) {
  if (typeof time === 'number') {
    return time / 1000;
  }
  return time.toSeconds();
}
