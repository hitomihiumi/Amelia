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
 * Gets all LITERAL string paths to object properties recursively (excluding dynamic keys)
 * Used for type-safe indexed access like Schema[Path]
 */
export type LiteralPathsToStringProps<T, Depth = 0> = Depth extends 10
  ? never
  : T extends Primitive | Date | Map<any, any> | Set<any> | Function
    ? []
    : T extends Array<infer U>
      ? never // Exclude arrays from literal paths
      : T extends object
        ? {
            [K in keyof T]-?: K extends string
              ? string extends K
                ? never // Exclude Record/index signatures
                : T[K] extends Primitive | Date | Map<any, any> | Set<any> | Function
                  ? [K]
                  : T[K] extends Array<infer U>
                    ? [K] // Include array itself but not elements
                    : T[K] extends object
                      ? [K] | [K, ...LiteralPathsToStringProps<T[K], Depth>]
                      : [K]
              : never;
          }[keyof T]
        : [];

/**
 * Gets all string paths to object properties recursively (including dynamic keys)
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
              [Depth, 1] extends [infer D, infer _] ? (D extends number ? 1 : never) : never
            >,
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
 * Gets all literal type-safe paths (can be used as index for Schema[Path])
 */
export type LiteralSchemaKey<T, D extends string = "."> = Join<
  LiteralPathsToStringProps<T>,
  D
> extends infer R
  ? string extends R
    ? never
    : R
  : never;

/**
 * Gets all type-safe paths to string values in an object (including dynamic paths)
 * This is a combination of PathsToStringProps and Join for convenient use
 */
export type SchemaKey<T, D extends string = "."> = Join<PathsToStringProps<T>, D> extends infer R
  ? string extends R
    ? string
    : R
  : never;

/**
 * Validates that a path is a valid schema key
 * Usage: type ValidKey = ValidateSchemaKey<GuildSchema, "settings.prefix">;
 */
export type ValidateSchemaKey<T, K extends string> = K extends SchemaKey<T> ? K : never;

/**
 * Gets the value type by path in the schema with support for dynamic paths
 * Usage: type PrefixType = GetSchemaValueType<GuildSchema, "settings.prefix">;
 */
export type GetSchemaValueType<T, Path extends string> = Path extends keyof T // First try direct key access
  ? T[Path & keyof T]
  : // Then try nested path
    Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? T[K] extends object
        ? GetSchemaValueType<T[K], Rest>
        : never
      : // Handle dynamic keys (Records)
        K extends string
        ? T extends { [key: string]: infer V }
          ? Rest extends keyof V
            ? V[Rest & keyof V]
            : Rest extends `${infer K2}.${infer Rest2}`
              ? K2 extends keyof V
                ? V[K2] extends object
                  ? GetSchemaValueType<V[K2], Rest2>
                  : never
                : never
              : never
          : never
        : never
    : never;
