import { assertEquals } from "https://deno.land/std@0.187.0/testing/asserts.ts";
import { Typeof_Input } from "./typeof_input.ts";
Deno.test("Typeof_Input.isUrl", function isUrlTest() {
  assertEquals(
    Typeof_Input.isUrl("http://localhost:3000"),
    true,
    "'http://localhost:3000' could not be confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl("https://www.google.com"),
    true,
    "'https://www.google.com' could not be confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl("192.168.0.1"),
    true,
    "'192.168.1.01' could not be confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl("192.168.0.1:3000"),
    true,
    "'192.168.0.1:3000' could not be confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl("http://192.168.0.1:3000"),
    true,
    "'http://192.168.0.1:3000' could not be confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl("2192.168.0.1:3000"),
    false,
    "'2192.168.0.1:3000' was confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl("hello"),
    false,
    "'hello' was confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl(123),
    false,
    "'123' was confirmed as a valid URL"
  );
  assertEquals(
    Typeof_Input.isUrl(true),
    false,
    "'true' was confirmed as a valid URL"
  );
});

Deno.test("Typeof_Input.isEmail", function isEmailTest() {
  assertEquals(
    Typeof_Input.isEmail("user@example.com"),
    true,
    "'www.user@gmail.com' could not be confirmed as a valid email address"
  );
  assertEquals(
    Typeof_Input.isEmail("123.group@example.com"),
    true,
    "'123.group@example.com' could not be confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("user@subdomain.example.com"),
    true,
    "'user@subdomain.example.com' could not be confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("underscore_user123@example.com"),
    true,
    "'underscore_user123@example.com' could not be confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("hyphen-user@example.com"),
    true,
    "'hyphen-user@example.com' could not be confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("invalid!!exclamation_user@example.com"),
    false,
    "'invalid!!exclamation_user@example.com' was confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("invalid^^carrot_user@example.com"),
    false,
    "'invalid^^carrot_user@example.com' was confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("host@.com"),
    false,
    "'host@.com' was confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("host@example."),
    false,
    "'host@example.' was confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("host@.example."),
    false,
    "'host@.example.' was confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail("hello"),
    false,
    "'hello' was confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail(123),
    false,
    "'123' was confirmed as a valid email address"
  );

  assertEquals(
    Typeof_Input.isEmail(true),
    false,
    "'true' was confirmed as a valid email address"
  );
});
