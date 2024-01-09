export const SECOND_AS_MS = 1000;
export const MINUTE_AS_MS = 60 * SECOND_AS_MS;
export const HOUR_AS_MS = 60 * MINUTE_AS_MS;
export const DAY_AS_MS = 24 * HOUR_AS_MS;

/**
 * Represents a duration of time.
 */
export class Time {
  /**
   * Creates a new Time instance.
   * @param timeInMilliseconds The time duration in milliseconds.
   */
  constructor(private readonly timeInMilliseconds: number) {}

  /**
   * Converts the time duration to milliseconds.
   * @returns The time duration in milliseconds.
   */
  toMilliseconds(): number {
    return this.timeInMilliseconds;
  }

  /**
   * Converts the time duration to seconds.
   * @returns The time duration in seconds.
   */
  toSeconds(): number {
    return this.timeInMilliseconds / SECOND_AS_MS;
  }

  /**
   * Converts the time duration to minutes.
   * @returns The time duration in minutes.
   */
  toMinutes(): number {
    return this.timeInMilliseconds / MINUTE_AS_MS;
  }

  /**
   * Converts the time duration to hours.
   * @returns The time duration in hours.
   */
  toHours(): number {
    return this.timeInMilliseconds / HOUR_AS_MS;
  }

  /**
   * Converts the time duration to days.
   * @returns The time duration in days.
   */
  toDays(): number {
    return this.timeInMilliseconds / DAY_AS_MS;
  }

  /**
   * Adds another Time instance to the current time duration.
   * @param time The Time instance to add.
   * @returns A new Time instance representing the sum of the two time durations.
   */
  add(time: Time): Time {
    return new Time(this.timeInMilliseconds + time.toMilliseconds());
  }

  /**
   * Subtracts another Time instance from the current time duration.
   * @param time The Time instance to subtract.
   * @returns A new Time instance representing the difference between the two time durations.
   */
  sub(time: Time): Time {
    return new Time(this.timeInMilliseconds - time.toMilliseconds());
  }

  /**
   * Multiplies the time duration by a factor.
   * @param factor The factor to multiply by.
   * @returns A new Time instance representing the multiplied time duration.
   */
  multiply(factor: number): Time {
    return new Time(this.timeInMilliseconds * factor);
  }

  /**
   * Divides the time duration by a divisor.
   * @param divisor The divisor to divide by.
   * @returns A new Time instance representing the divided time duration.
   */
  divide(divisor: number): Time {
    return new Time(this.timeInMilliseconds / divisor);
  }

  /**
   * Checks if the current time duration is equal to another Time instance.
   * @param time The Time instance to compare.
   * @returns True if the time durations are equal, false otherwise.
   */
  isEqual(time: Time): boolean {
    return this.timeInMilliseconds === time.toMilliseconds();
  }

  /**
   * Checks if the current time duration is greater than another Time instance.
   * @param time The Time instance to compare.
   * @returns True if the current time duration is greater, false otherwise.
   */
  isGreaterThan(time: Time): boolean {
    return this.timeInMilliseconds > time.toMilliseconds();
  }

  /**
   * Checks if the current time duration is greater than or equal to another Time instance.
   * @param time The Time instance to compare.
   * @returns True if the current time duration is greater than or equal, false otherwise.
   */
  isGreaterThanOrEqual(time: Time): boolean {
    return this.timeInMilliseconds >= time.toMilliseconds();
  }

  /**
   * Checks if the current time duration is less than another Time instance.
   * @param time The Time instance to compare.
   * @returns True if the current time duration is less, false otherwise.
   */
  isLessThan(time: Time): boolean {
    return this.timeInMilliseconds < time.toMilliseconds();
  }

  /**
   * Checks if the current time duration is less than or equal to another Time instance.
   * @param time The Time instance to compare.
   * @returns True if the current time duration is less than or equal, false otherwise.
   */
  isLessThanOrEqual(time: Time): boolean {
    return this.timeInMilliseconds <= time.toMilliseconds();
  }

  /**
   * Creates a new Time instance from a duration in milliseconds.
   * @param timeInMilliseconds The time duration in milliseconds.
   * @returns A new Time instance representing the given duration.
   */
  static fromMilliseconds(timeInMilliseconds: number): Time {
    return new Time(timeInMilliseconds);
  }

  /**
   * Creates a new Time instance from a duration in seconds.
   * @param timeInSeconds The time duration in seconds.
   * @returns A new Time instance representing the given duration.
   */
  static fromSeconds(timeInSeconds: number): Time {
    return new Time(timeInSeconds * SECOND_AS_MS);
  }

  /**
   * Creates a new Time instance from a duration in minutes.
   * @param timeInMinutes The time duration in minutes.
   * @returns A new Time instance representing the given duration.
   */
  static fromMinutes(timeInMinutes: number): Time {
    return new Time(timeInMinutes * MINUTE_AS_MS);
  }

  /**
   * Creates a new Time instance from a duration in hours.
   * @param timeInHours The time duration in hours.
   * @returns A new Time instance representing the given duration.
   */
  static fromHours(timeInHours: number): Time {
    return new Time(timeInHours * HOUR_AS_MS);
  }

  /**
   * Creates a new Time instance from a duration in days.
   * @param timeInDays The time duration in days.
   * @returns A new Time instance representing the given duration.
   */
  static fromDays(timeInDays: number): Time {
    return new Time(timeInDays * DAY_AS_MS);
  }
}

/**
 * Returns the time in milliseconds.
 * @param time The time object or number.
 * @returns The time in milliseconds.
 */
export function getTimeMilliseconds(time: Time | number) {
  if (typeof time === 'number') {
    return time;
  }
  return time.toMilliseconds();
}

/**
 * Converts the given time value to seconds.
 * @param time The time value to convert.
 * @returns The time value in seconds.
 */
export function getTimeSeconds(time: Time | number) {
  if (typeof time === 'number') {
    return time / 1000;
  }
  return time.toSeconds();
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('Time', () => {
    const time = new Time(1000);
    expect(time.toMilliseconds()).toBe(1000);
    expect(time.toSeconds()).toBe(1);
    expect(time.toMinutes()).toBe(1 / 60);
    expect(time.toHours()).toBe(1 / 60 / 60);
    expect(time.toDays()).toBe(1 / 60 / 60 / 24);
    expect(time.add(new Time(1000)).toMilliseconds()).toBe(2000);
    expect(time.sub(new Time(1000)).toMilliseconds()).toBe(0);
    expect(time.multiply(2).toMilliseconds()).toBe(2000);
    expect(time.divide(2).toMilliseconds()).toBe(500);
    expect(time.isEqual(new Time(1000))).toBe(true);
    expect(time.isGreaterThan(new Time(1000))).toBe(false);
    expect(time.isGreaterThanOrEqual(new Time(1000))).toBe(true);
    expect(time.isLessThan(new Time(1000))).toBe(false);
    expect(time.isLessThanOrEqual(new Time(1000))).toBe(true);

    expect(Time.fromMilliseconds(1000).toMilliseconds()).toBe(1000);
    expect(Time.fromSeconds(1).toMilliseconds()).toBe(1000);
    expect(Time.fromMinutes(1 / 60).toMilliseconds()).toBe(1000);
    expect(Time.fromHours(1 / 60 / 60).toMilliseconds()).toBe(1000);
    expect(Time.fromDays(1 / 60 / 60 / 24).toMilliseconds()).toBe(1000);
  });
}
