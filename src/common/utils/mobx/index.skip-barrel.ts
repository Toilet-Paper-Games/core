import {
  $mobx,
  action,
  AnnotationsMap,
  CreateObservableOptions,
  isObservable,
  isObservableArray,
  isObservableObject,
  makeObservable,
} from 'mobx';

export function* result<T>(promise: Promise<T>) {
  return (yield promise) as T;
}

const annotationsSymbol = Symbol('annotationsSymbol');
const objectPrototype = Object.prototype;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type NoInfer<T> = [T][T extends any ? 0 : never];

/**
 * A purposefully-limited version of `makeAutoObservable` that supports subclasses.
 *
 * There is valid complexity in supporting `makeAutoObservable` across disparate/edge-casey
 * class hierarchies, and so mobx doesn't support it out of the box. See:
 * https://github.com/mobxjs/mobx/discussions/2850#discussioncomment-1203102
 *
 * So this implementation adds a few limitations that lets us get away with it. Specifically:
 *
 * - We always auto-infer a key's action/computed/observable, and don't support user-provided config values
 * - Subclasses should not override parent class methods (although this might? work)
 * - Only the "most child" subclass should call `makeSimpleAutoObservable`, to avoid each constructor in
 *   the inheritance chain potentially re-decorating keys.
 *
 * See https://github.com/mobxjs/mobx/discussions/2850
 */
export function MOBX_makeSimpleAutoObservable<
  T extends object,
  AdditionalKeys extends PropertyKey = never,
>(
  target: T,
  overrides?: AnnotationsMap<T, NoInfer<AdditionalKeys>>,
  options?: CreateObservableOptions,
): T {
  // Make sure nobody called makeObservable/etc. previously (eg in parent constructor)
  if (isObservable(target)) {
    throw new Error('Target must not be observable');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let annotations = (target as any)[annotationsSymbol];
  if (!annotations) {
    annotations = {};
    let current = target;
    while (current && current !== objectPrototype) {
      Reflect.ownKeys(current).forEach((key) => {
        if (key === $mobx || key === 'constructor') return;
        annotations[key] = !overrides
          ? true
          : key in overrides
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (overrides as any)[key]
            : true;
      });
      current = Object.getPrototypeOf(current);
    }
    // Cache if class
    const proto = Object.getPrototypeOf(target);
    if (proto && proto !== objectPrototype) {
      Object.defineProperty(proto, annotationsSymbol, { value: annotations });
    }
  }

  return makeObservable(target, annotations, options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObject = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(obj: any): obj is AnyObject {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

export const smartUpdate = action(<T extends AnyObject>(current: T, dto: T): T => {
  for (const key of Object.keys(dto)) {
    const currentValue = current[key as keyof T];
    const newValue = dto[key as keyof T];

    if (isObject(currentValue) && isObject(newValue)) {
      if (isObservableObject(currentValue)) {
        // Recursively update observable nested objects
        smartUpdate(currentValue, newValue);
      } else {
        // Replace non-observable objects entirely
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (current as any)[key] = newValue;
      }
    } else if (isObservableArray(currentValue) && Array.isArray(newValue)) {
      // Handle observable arrays
      currentValue.replace(newValue); // MobX-specific method to replace array contents
    } else if (currentValue !== newValue) {
      // Update primitive values or references if changed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (current as any)[key] = newValue;
    }
  }
  return current;
});
