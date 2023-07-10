// deno-lint-ignore-file no-explicit-any
export class TypeofPrimitive {
  public static isString(value: any): boolean {
    return typeof value === "string";
  }

  public static isNumber(value: any): boolean {
    return typeof value === "number";
  }

  public static isBoolean(value: any): boolean {
    return typeof value === "boolean";
  }

  public static isObject(value: any): boolean {
    return typeof value === "object";
  }

  public static isArray(value: any): boolean {
    return Array.isArray(value);
  }

  public static isFunction(value: any): boolean {
    return typeof value === "function";
  }

  public static isUndefined(value: any): boolean {
    return typeof value === "undefined";
  }

  public static isNull(value: any): boolean {
    return value === null;
  }

  public static isNullOrUndefined(value: any): boolean {
    return this.isNull(value) || this.isUndefined(value);
  }
}
