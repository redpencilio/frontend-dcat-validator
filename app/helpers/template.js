import { helper } from '@ember/component/helper';

/**
 * Equality comparison helper: a === b
 */
export const eq = helper(([a, b]) => a === b);

/**
 * Inequality comparison helper: a !== b
 */
export const notEq = helper(([a, b]) => a !== b);

/**
 * Greater-than comparison helper: a > b
 */
export const gt = helper(([a, b]) => a > b);

/**
 * Greater-than-or-equal comparison helper: a >= b
 */
export const gte = helper(([a, b]) => a >= b);

/**
 * Less-than comparison helper: a < b
 */
export const lt = helper(([a, b]) => a < b);

/**
 * Less-than-or-equal comparison helper: a <= b
 */
export const lte = helper(([a, b]) => a <= b);

/**
 * Logical AND helper: returns true if all positional arguments are truthy.
 */
export const and = helper((args) => args.every(Boolean));

/**
 * Logical OR helper: returns true if at least one positional argument is truthy.
 */
export const or = helper((args) => args.some(Boolean));

/**
 * Logical NOT helper: returns true if value is falsy.
 */
export const not = helper(([val]) => !val);

/**
 * Dynamic object property access: obj[key]
 */
export const get = helper(([obj, key]) => obj?.[key]);

/**
 * Array index check: returns true if index is not the last item of array.
 */
export const isNotLast = helper(
  ([index, array]) => Boolean(array && index < array.length - 1),
);
