/**
 * Utilities for working with type-safe paths in data schemas
 * Supports deep indexing with proper handling of arrays, Map and other types
 */

/**
 * Excludes functions and special types from path
 */
type Primitive = string | number | boolean | null | undefined | bigint;

type IsSpecialType<T> = T extends Function
  ? false
  : T extends Map<any, any>
    ? false
    : T extends Set<any>
      ? false
      : T extends Date
        ? false
        : T extends Primitive
          ? false
          : true;

/**
 * Gets all string paths to object properties recursively
 * Properly handles:
 * - Regular objects
 * - Nested objects
 * - Arrays of objects (indexes array elements via [0])
 * - Record types
 * - null and optional values
 */
export type PathsToStringProps<T, Depth = 0> = Depth extends 10
  ? never
  : T extends Primitive | Date | Map<any, any> | Set<any> | Function
    ? []
    : T extends Array<infer U>
      ? IsSpecialType<U> extends true
        ? [
            number,
            ...PathsToStringProps<
              U extends object ? U : never,
              [Depth, 1] extends [infer D, infer _]
                ? D extends number
                  ? 1
                  : never
                : never
            >
          ]
        : [number]
      : T extends object
        ? {
            [K in keyof T]-?: T[K] extends Primitive | Date | Map<any, any> | Set<any> | Function
              ? [K & string]
              : T[K] extends Array<infer U>
                ? [K & string] | [K & string, ...PathsToStringProps<U, Depth>]
                : T[K] extends object
                  ? [K & string] | [K & string, ...PathsToStringProps<T[K], Depth>]
                  : [K & string];
          }[keyof T]
        : [];

/**
 * Joins array of strings with separator
 */
export type Join<T extends (string | number)[], D extends string> = T extends []
  ? never
  : T extends [infer F extends string | number]
    ? `${F}`
    : T extends [infer F extends string | number, ...infer R extends (string | number)[]]
      ? `${F}${D}${Join<R, D>}`
      : string;

/**
 * Gets all type-safe paths to string values in an object
 * This is a combination of PathsToStringProps and Join for convenient use
 */
export type SchemaKey<T, D extends string = "."> = Join<
  PathsToStringProps<T>,
  D
> extends infer R
  ? string extends R
    ? string
    : R
  : never;

/**
 * Validates that a path is a valid schema key
 * Usage: type ValidKey = ValidateSchemaKey<GuildSchema, "settings.prefix">;
 */
export type ValidateSchemaKey<T, K extends string> = K extends SchemaKey<T>
  ? K
  : never;

/**
 * Gets the value type by path in the schema
 * Usage: type PrefixType = GetSchemaValueType<GuildSchema, "settings.prefix">;
 */
export type GetSchemaValueType<T, Path extends string> = Path extends keyof T
  ? T[Path & keyof T]
  : Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? T[K] extends object
        ? GetSchemaValueType<T[K], Rest>
        : never
      : never
    : never;


