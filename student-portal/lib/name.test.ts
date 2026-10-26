import { describe, expect, it } from "vitest";
import { splitName } from "./name";

describe("splitName", () => {
  it("splits a two-word name", () => {
    expect(splitName("Jason Miller")).toEqual({ firstName: "Jason", lastName: "Miller" });
  });

  it("splits on the last space so the surname stays intact", () => {
    expect(splitName("Mary Anne Smith")).toEqual({ firstName: "Mary Anne", lastName: "Smith" });
  });

  it("treats a single word as the first name", () => {
    expect(splitName("Cher")).toEqual({ firstName: "Cher", lastName: "" });
  });
});
