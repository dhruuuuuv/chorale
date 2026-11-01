import { describe, expect, it } from "vitest";
import type { IndexEntry } from "../types";
import { fold, searchChorales } from "./search";

const entry = (over: Partial<IndexEntry>): IndexEntry => ({
  id: "x",
  bwv: "1",
  riemenschneider: 1,
  title: "",
  firstLine: "",
  translation: "",
  source: "",
  key: "C major",
  timeSig: "4/4",
  lengthBeats: 64,
  phrases: 8,
  startHere: null,
  ...over,
});

const LIST = [
  entry({ id: "a", bwv: "244.54", riemenschneider: 74, title: "O Haupt voll Blut und Wunden", firstLine: "O Haupt voll Blut und Wunden" }),
  entry({ id: "b", bwv: "267", riemenschneider: 5, title: "An Wasserflüssen Babylon", firstLine: "An Wasserflüssen Babylon" }),
  entry({ id: "c", bwv: "302", riemenschneider: 20, title: "Ein’ feste Burg ist unser Gott", firstLine: "Ein' feste Burg ist unser Gott" }),
];

describe("searchChorales", () => {
  it("returns everything for an empty query", () => {
    expect(searchChorales(LIST, "  ")).toHaveLength(3);
  });

  it("finds by title without umlauts or apostrophes", () => {
    expect(searchChorales(LIST, "wasserflusse").map((c) => c.id)).toEqual(["b"]);
    expect(searchChorales(LIST, "ein feste").map((c) => c.id)).toEqual(["c"]);
  });

  it("finds by BWV number, whole or by work", () => {
    expect(searchChorales(LIST, "BWV 244.54").map((c) => c.id)).toEqual(["a"]);
    expect(searchChorales(LIST, "244").map((c) => c.id)).toEqual(["a"]);
  });

  it("finds by Riemenschneider number", () => {
    expect(searchChorales(LIST, "R 20").map((c) => c.id)).toEqual(["c"]);
    expect(searchChorales(LIST, "74").map((c) => c.id)).toEqual(["a"]);
  });

  it("folds German letters", () => {
    expect(fold("Größe")).toBe("grosse");
  });
});
