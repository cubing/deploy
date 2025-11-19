import { expect, test } from "bun:test";
import { deploy } from "./deploy";

test("Username in target URL is rejected", async () => {
  expect(() => deploy("https://me@example.com")).toThrow(
    "URL must not contain a username.",
  );
});

test("Password in target URL is rejected", async () => {
  expect(() => deploy("https://:hunter2@example.com")).toThrow(
    "URL must not contain a password.",
  );
});
