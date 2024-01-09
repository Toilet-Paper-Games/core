/**
 * Represents a 2D vector with x and y components.
 */
export class Vector2 {
  /**
   * Creates a Vector2 from an object with x and y properties.
   * @param obj - The object containing x and y properties.
   * @returns A new Vector2 instance.
   */
  static fromObject(obj: { x: number; y: number }): Vector2 {
    return new Vector2(obj.x, obj.y);
  }

  /**
   * Creates a Vector2 with both x and y components set to 0.
   * @returns A new Vector2 instance.
   */
  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  /**
   * Creates a Vector2 with x component set to 0 and y component set to 1.
   * @returns A new Vector2 instance.
   */
  static top(): Vector2 {
    return new Vector2(0, 1);
  }

  /**
   * Creates a Vector2 with x component set to 0 and y component set to -1.
   * @returns A new Vector2 instance.
   */
  static bottom(): Vector2 {
    return new Vector2(0, -1);
  }

  /**
   * Creates a Vector2 with x component set to -1 and y component set to 0.
   * @returns A new Vector2 instance.
   */
  static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  /**
   * Creates a Vector2 with x component set to 1 and y component set to 0.
   * @returns A new Vector2 instance.
   */
  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  /**
   * Creates a random Vector2 on a circle with the given radius.
   * @param radius - The radius of the circle.
   * @returns A new Vector2 instance.
   */
  static randomOnCircle(radius: number): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    return new Vector2(x, y);
  }

  /**
   * Creates a random Vector2 inside a circle with the given radius.
   * @param radius - The radius of the circle.
   * @returns A new Vector2 instance.
   */
  static randomInCircle(radius: number): Vector2 {
    const r = Math.sqrt(Math.random()) * radius;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    return new Vector2(x, y);
  }

  /**
   * Creates a Vector2 from an angle in radians.
   * @param angle - The angle in radians.
   * @returns A new Vector2 instance.
   */
  static fromAngle(angle: number): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  /**
   * Creates a Vector2 from an angle in degrees.
   * @param angle - The angle in degrees.
   * @returns A new Vector2 instance.
   */
  static fromAngleDeg(angle: number): Vector2 {
    return Vector2.fromAngle((angle * Math.PI) / 180);
  }

  /**
   * Creates a Vector2 from a tuple of numbers representing x and y components.
   * @param tuple - The tuple containing x and y components.
   * @returns A new Vector2 instance.
   */
  static fromTuple([x, y]: [x: number, y: number]): Vector2 {
    return new Vector2(x, y);
  }

  /**
   * Creates a new Vector2 instance.
   * @param x - The x component.
   * @param y - The y component.
   */
  constructor(public x: number, public y: number) {}

  /**
   * Creates a copy of the Vector2 instance.
   * @returns A new Vector2 instance with the same x and y components.
   */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * Adds another Vector2 to this Vector2.
   * @param v - The Vector2 to add.
   * @returns A new Vector2 instance representing the sum of the two vectors.
   */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtracts another Vector2 from this Vector2.
   * @param v - The Vector2 to subtract.
   * @returns A new Vector2 instance representing the difference between the two vectors.
   */
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiplies this Vector2 by another Vector2 component-wise.
   * @param v - The Vector2 to multiply.
   * @returns A new Vector2 instance representing the component-wise product of the two vectors.
   */
  mult(v: Vector2): Vector2 {
    return new Vector2(this.x * v.x, this.y * v.y);
  }

  /**
   * Calculates the dot product between this Vector2 and another Vector2.
   * @param v - The Vector2 to calculate the dot product with.
   * @returns The dot product of the two vectors.
   */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Scales this Vector2 by a scalar value.
   * @param scaler - The scalar value to scale by.
   * @returns A new Vector2 instance representing the scaled vector.
   */
  scale(scaler: number): Vector2 {
    return new Vector2(this.x * scaler, this.y * scaler);
  }

  /**
   * Limits the length of this Vector2 to a specified value.
   * @param length - The maximum length of the vector.
   * @returns A new Vector2 instance with the same direction but a length no greater than the specified value.
   */
  limitLength(length = 1): Vector2 {
    return this.length <= length ? this.clone() : this.asLength(length);
  }

  /**
   * Sets the length of this Vector2 to a specified value.
   * @param length - The new length of the vector.
   * @returns A new Vector2 instance with the same direction but the specified length.
   */
  asLength(length: number): Vector2 {
    return this.normalized.scale(length);
  }

  /**
   * Gets the squared magnitude (length^2) of this Vector2.
   * @returns The squared magnitude of the vector.
   */
  get squaredMagnitude(): number {
    return this.x ** 2 + this.y ** 2;
  }

  /**
   * Gets the magnitude (length) of this Vector2.
   * @returns The magnitude of the vector.
   */
  get length(): number {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Gets the normalized version of this Vector2.
   * @returns A new Vector2 instance with the same direction but a length of 1.
   */
  get normalized(): Vector2 {
    return new Vector2(this.x / this.length, this.y / this.length);
  }

  /**
   * Gets the components of this Vector2 as a tuple.
   * @returns A tuple containing the x and y components of the vector.
   */
  get asTuple(): [x: number, y: number] {
    return [this.x, this.y];
  }

  /**
   * Gets the components of this Vector2 as an object with x and y properties.
   * @returns An object containing the x and y components of the vector.
   */
  get asObject(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Gets the angle (in radians) of this Vector2.
   * @returns The angle of the vector in radians.
   */
  get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Gets the angle (in degrees) of this Vector2.
   * @returns The angle of the vector in degrees.
   */
  get angleDeg(): number {
    return (this.angle * 180) / Math.PI;
  }

  /**
   * Checks if this Vector2 is equal to another Vector2.
   * @param v - The Vector2 to compare.
   * @returns True if the vectors are equal, false otherwise.
   */
  equals(v: Vector2): boolean {
    return this.x === v.x && this.y === v.y;
  }

  /**
   * Checks if this Vector2 is equal to the zero vector (0, 0).
   * @returns True if the vector is the zero vector, false otherwise.
   */
  get isZero(): boolean {
    return this.x === 0 && this.y === 0;
  }

  /**
   * Checks if this Vector2 has finite components.
   * @returns True if the vector has finite components, false otherwise.
   */
  get isFinite(): boolean {
    return Number.isFinite(this.x) && Number.isFinite(this.y);
  }

  /**
   * Checks if this Vector2 has NaN components.
   * @returns True if the vector has NaN components, false otherwise.
   */
  get isNan(): boolean {
    return Number.isNaN(this.x) || Number.isNaN(this.y);
  }

  /**
   * Negates this Vector2.
   * @returns A new Vector2 instance with the negated components.
   */
  negate(): Vector2 {
    return new Vector2(-this.x, -this.y);
  }

  /**
   * Rotates this Vector2 by a specified angle (in radians).
   * @param angle - The angle to rotate by.
   * @returns A new Vector2 instance representing the rotated vector.
   */
  rotate(angle: number): Vector2 {
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);
    const rotatedX = this.x * cosTheta - this.y * sinTheta;
    const rotatedY = this.x * sinTheta + this.y * cosTheta;

    return new Vector2(rotatedX, rotatedY);
  }

  /**
   * Rotates this Vector2 around a specified center point by a specified angle (in radians).
   * @param center - The center point to rotate around.
   * @param angle - The angle to rotate by.
   * @returns A new Vector2 instance representing the rotated vector.
   */
  rotateAround(center: Vector2, angle: number): Vector2 {
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);

    const translatedX = this.x - center.x;
    const translatedY = this.y - center.y;

    const rotatedX = translatedX * cosTheta - translatedY * sinTheta;
    const rotatedY = translatedX * sinTheta + translatedY * cosTheta;

    const x = rotatedX + center.x;
    const y = rotatedY + center.y;

    return new Vector2(x, y);
  }

  /**
   * Calculates the angle (in radians) between this Vector2 and another Vector2.
   * @param v - The Vector2 to calculate the angle to.
   * @returns The angle between the two vectors in radians.
   */
  angleTo(v: Vector2): number {
    const dx = v.x - this.x;
    const dy = v.y - this.y;

    return Math.atan2(dy, dx);
  }

  /**
   * Calculates the distance between this Vector2 and another Vector2.
   * @param v - The Vector2 to calculate the distance to.
   * @returns The distance between the two vectors.
   */
  distanceTo(v: Vector2): number {
    const sub = this.sub(v);
    return Math.hypot(sub.x, sub.y);
  }

  /**
   * Performs linear interpolation between this Vector2 and another Vector2.
   * @param v - The Vector2 to interpolate towards.
   * @param t - The interpolation factor (between 0 and 1).
   * @returns A new Vector2 instance representing the interpolated vector.
   */
  lerp(v: Vector2, t: number): Vector2 {
    const { x: dx, y: dy } = v.sub(this);
    return new Vector2(this.x + dx * t, this.y + dy * t);
  }

  /**
   * Returns a string representation of this Vector2.
   * @returns A string representation of the vector in the format "(x, y)".
   */
  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('Vector2', () => {
    const v2 = new Vector2(1, 2);
    expect(v2.x).toBe(1);
    expect(v2.y).toBe(2);
    expect(v2.length).toBe(Math.sqrt(5));
    expect(v2.angle).toBe(Math.atan2(2, 1));
    expect(v2.angleDeg).toBe((Math.atan2(2, 1) * 180) / Math.PI);
    expect(v2.asTuple).toEqual([1, 2]);
    expect(v2.asObject).toEqual({ x: 1, y: 2 });
    expect(v2.toString()).toBe('(1, 2)');
    expect(v2.clone()).toEqual(v2);
    expect(v2.add(new Vector2(2, 3))).toEqual(new Vector2(3, 5));
    expect(v2.sub(new Vector2(2, 3))).toEqual(new Vector2(-1, -1));
    expect(v2.mult(new Vector2(2, 3))).toEqual(new Vector2(2, 6));
    expect(v2.dot(new Vector2(2, 3))).toBe(8);
    expect(v2.scale(2)).toEqual(new Vector2(2, 4));
    expect(v2.limitLength(1)).toEqual(
      new Vector2(0.4472135954999579, 0.8944271909999159),
    );
    expect(v2.asLength(1)).toEqual(new Vector2(0.4472135954999579, 0.8944271909999159));
    expect(v2.squaredMagnitude).toBe(5);
    expect(v2.normalized).toEqual(new Vector2(0.4472135954999579, 0.8944271909999159));
    expect(v2.angleTo(new Vector2(2, 3))).toBe(0.7853981633974483);
    expect(v2.distanceTo(new Vector2(2, 3))).toBe(Math.sqrt(2));
    expect(v2.lerp(new Vector2(2, 3), 0.5)).toEqual(new Vector2(1.5, 2.5));
    expect(v2.equals(new Vector2(1, 2))).toBe(true);
    expect(v2.equals(new Vector2(2, 3))).toBe(false);
    expect(v2.negate()).toEqual(new Vector2(-1, -2));
    expect(v2.rotate(Math.PI / 2).x).closeTo(-2, 0.0000001);
    expect(v2.rotate(Math.PI / 2).y).closeTo(1, 0.0000001);
    expect(v2.rotateAround(new Vector2(1, 1), Math.PI / 2)).toEqual(new Vector2(0, 1));
    expect(v2.isZero).toBe(false);
    expect(v2.isFinite).toBe(true);
    expect(v2.isNan).toBe(false);

    expect(Vector2.fromAngle(Math.PI / 2).x).closeTo(0, 0.0000001);
    expect(Vector2.fromAngle(Math.PI / 2).y).closeTo(1, 0.0000001);
    expect(Vector2.fromAngleDeg(90).x).closeTo(0, 0.0000001);
    expect(Vector2.fromAngleDeg(90).y).closeTo(1, 0.0000001);
    expect(Vector2.fromTuple([1, 2])).toEqual(new Vector2(1, 2));
    expect(Vector2.fromObject({ x: 1, y: 2 })).toEqual(new Vector2(1, 2));
    expect(Vector2.top()).toEqual(new Vector2(0, 1));
    expect(Vector2.bottom()).toEqual(new Vector2(0, -1));
    expect(Vector2.left()).toEqual(new Vector2(-1, 0));
    expect(Vector2.right()).toEqual(new Vector2(1, 0));
    expect(Vector2.zero()).toEqual(new Vector2(0, 0));
  });
}
