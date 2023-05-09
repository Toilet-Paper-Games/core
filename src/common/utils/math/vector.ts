export class Vector2 {
  static fromObject(obj: { x: number; y: number }): Vector2 {
    return new Vector2(obj.x, obj.y);
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static top(): Vector2 {
    return new Vector2(0, 1);
  }

  static bottom(): Vector2 {
    return new Vector2(0, -1);
  }

  static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  static randomOnCircle(radius: number): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    return new Vector2(x, y);
  }

  static randomInCircle(radius: number): Vector2 {
    const r = Math.sqrt(Math.random()) * radius;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    return new Vector2(x, y);
  }

  static fromAngle(angle: number): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  static fromAngleDeg(angle: number): Vector2 {
    return Vector2.fromAngle((angle * Math.PI) / 180);
  }

  static fromTuple([x, y]: [x: number, y: number]): Vector2 {
    return new Vector2(x, y);
  }

  constructor(public x: number, public y: number) {}

  clone() {
    return new Vector2(this.x, this.y);
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mult(v: Vector2): Vector2 {
    return new Vector2(this.x * v.x, this.y * v.y);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  scale(scaler: number): Vector2 {
    return new Vector2(this.x * scaler, this.y * scaler);
  }

  limitLength(length = 1): Vector2 {
    return this.length <= length ? this.clone() : this.asLength(length);
  }

  asLength(length: number): Vector2 {
    return this.normalized.scale(length);
  }

  get squaredMagnitude(): number {
    return this.x ** 2 + this.y ** 2;
  }

  get length(): number {
    return Math.hypot(this.x, this.y);
  }

  get normalized(): Vector2 {
    return new Vector2(this.x / this.length, this.y / this.length);
  }

  get asTuple(): [x: number, y: number] {
    return [this.x, this.y];
  }

  get asObject(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  get angleDeg(): number {
    return (this.angle * 180) / Math.PI;
  }

  get isZero(): boolean {
    return this.x === 0 && this.y === 0;
  }

  get isFinite(): boolean {
    return Number.isFinite(this.x) && Number.isFinite(this.y);
  }

  get isNan(): boolean {
    return Number.isNaN(this.x) || Number.isNaN(this.y);
  }

  negate(): Vector2 {
    return new Vector2(-this.x, -this.y);
  }

  /** In radians */
  rotate(angle: number): Vector2 {
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);
    const rotatedX = this.x * cosTheta - this.y * sinTheta;
    const rotatedY = this.x * sinTheta + this.y * cosTheta;

    return new Vector2(rotatedX, rotatedY);
  }

  /** In radians */
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

  /** In radians */
  angleTo(v: Vector2): number {
    const dx = v.x - this.x;
    const dy = v.y - this.y;

    return Math.atan2(dy, dx);
  }

  distanceTo(v: Vector2): number {
    const sub = this.sub(v);
    return Math.hypot(sub.x, sub.y);
  }

  lerp(v: Vector2, t: number): Vector2 {
    const { x: dx, y: dy } = v.sub(this);
    return new Vector2(this.x + dx * t, this.y + dy * t);
  }

  equals(v: Vector2): boolean {
    return this.x === v.x && this.y === v.y;
  }

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
