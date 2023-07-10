// deno-lint-ignore-file no-explicit-any
import { TypeofPrimitive } from "./typeof_primitive.ts";

export class Typeof_Input {
  public static isUrl(value: any): boolean {
    if (TypeofPrimitive.isString(value)) {
      const string: string = value;
      const prefixHttp = string.includes("http://");
      const prefixHttps = string.includes("https://");
      if (prefixHttp) {
        return string.slice(0, 7) == "http://";
      } else if (prefixHttps) {
        return string.slice(0, 8) == "https://";
      }
      const ipAddressPattern =
        /^((?:[0-9]{1,3}\.){3}[0-9]{1,3})(?::([0-9]{1,5}))?$/;
      if (string.match(ipAddressPattern)) {
        return true;
      }
    }
    return false;
  }
  public static isEmail(value: any): boolean {
    if (TypeofPrimitive.isString(value)) {
      const string: string = value;
      const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}(?:\.[\w-]{2,})?$/;
      if (string.match(emailPattern)) {
        return true;
      }
    }
    return false;
  }
}
