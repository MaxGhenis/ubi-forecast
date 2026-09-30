import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The social preview image shows the headline; it must be the paper's current headline.
const og = JSON.parse(readFileSync(new URL("../og/og.json", import.meta.url), "utf8"));
const vars = Object.fromEntries([...readFileSync(new URL("../../paper/_variables.yml", import.meta.url), "utf8")
  .matchAll(/^(\w+): "([^"]*)"$/gm)].map((m) => [m[1], m[2]]));

describe("social preview image", () => {
  it("shows the paper's current US headline", () => expect(og.usa_2040).toBe(vars.usa_2040));
  it("exists under the name the pages point to", () => {
    expect(() => readFileSync(new URL(`../og/${og.file}`, import.meta.url))).not.toThrow();
    expect(readFileSync(new URL("../src/template.html", import.meta.url), "utf8")).toContain("{{OG_IMAGE}}");
  });
});
