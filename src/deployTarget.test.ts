import { expect, test } from "bun:test";
import { deployTarget } from "./deployTarget";

test("Username in target URL is rejected", async () => {
  expect(() => deployTarget("https://me@example.com")).toThrow(
    "URL must not contain a username.",
  );
});

test("Password in target URL is rejected", async () => {
  expect(() => deployTarget("https://:hunter2@example.com")).toThrow(
    "URL must not contain a password.",
  );
});
