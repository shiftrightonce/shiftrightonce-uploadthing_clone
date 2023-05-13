import { assertEquals } from "https://deno.land/std@0.187.0/testing/asserts.ts";
import { TypeofPrimitive } from "./typeof_primitive.ts";

Deno.test("TypeofPrimitive.isString", function isStringTest() {
  assertEquals(TypeofPrimitive.isString("hello"), true);
  assertEquals(TypeofPrimitive.isString(123), false);
});

Deno.test("TypeofPrimitive.isNumber", function isNumberTest() {
  assertEquals(TypeofPrimitive.isNumber(123), true);
  assertEquals(TypeofPrimitive.isNumber("hello"), false);
});

Deno.test("TypeofPrimitive.isBoolean", function isBooleanTest() {
  assertEquals(TypeofPrimitive.isBoolean(true), true);
  assertEquals(TypeofPrimitive.isBoolean("hello"), false);
});

Deno.test("TypeofPrimitive.isObject", function isObjectTest() {
  assertEquals(TypeofPrimitive.isObject({}), true);
  assertEquals(TypeofPrimitive.isObject("hello"), false);
});

Deno.test("TypeofPrimitive.isArray", function isArrayTest() {
  assertEquals(TypeofPrimitive.isArray([]), true);
  assertEquals(TypeofPrimitive.isArray("hello"), false);
});

Deno.test("TypeofPrimitive.isFunction", function isFunctionTest() {
  assertEquals(
    TypeofPrimitive.isFunction(() => {}),
    true
  );
  assertEquals(TypeofPrimitive.isFunction("hello"), false);
});

Deno.test("TypeofPrimitive.isUndefined", function isUndefinedTest() {
  assertEquals(TypeofPrimitive.isUndefined(undefined), true);
  assertEquals(TypeofPrimitive.isUndefined("hello"), false);
});

Deno.test("TypeofPrimitive.isNull", function isNullTest() {
  assertEquals(TypeofPrimitive.isNull(null), true);
  assertEquals(TypeofPrimitive.isNull("hello"), false);
});

Deno.test(
  "TypeofPrimitive.isNullOrUndefined",
  function isNullOrUndefinedTest() {
    assertEquals(TypeofPrimitive.isNullOrUndefined(null), true);
    assertEquals(TypeofPrimitive.isNullOrUndefined(undefined), true);
    assertEquals(TypeofPrimitive.isNullOrUndefined("hello"), false);
  }
);
