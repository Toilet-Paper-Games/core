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
