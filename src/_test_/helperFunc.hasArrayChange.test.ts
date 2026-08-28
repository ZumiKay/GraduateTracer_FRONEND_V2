import { hasArrayChange } from "../helperFunc";

describe("hasArrayChange", () => {
  test("returns false when arrays are deeply equal", () => {
    const a = [
      { _id: "1", score: 0, nested: { x: 1 } },
      { _id: "2", score: 5, title: { text: "Hi" } },
    ];
    const b = [
      { _id: "1", score: 0, nested: { x: 1 } },
      { _id: "2", score: 5, title: { text: "Hi" } },
    ];
    expect(hasArrayChange(a, b)).toBe(false);
  });

  test("returns true when array lengths differ", () => {
    const a = [{ _id: "1" }];
    const b = [{ _id: "1" }, { _id: "2" }];
    expect(hasArrayChange(a, b)).toBe(true);
  });

  test("returns true when nested property differs", () => {
    const a = [{ _id: "1", nested: { x: 1, y: 2 } }];
    const b = [{ _id: "1", nested: { x: 1, y: 3 } }];
    expect(hasArrayChange(a, b)).toBe(true);
  });

  test("treats undefined and 0 as different for score", () => {
    const a = [{ _id: "1", score: 0 }];
    const b = [{ _id: "1" }];
    expect(hasArrayChange(a, b)).toBe(true);
  });

  test("returns true when any element differs", () => {
    const a = [
      { _id: "1", score: 1 },
      { _id: "2", score: 2 },
    ];
    const b = [
      { _id: "1", score: 1 },
      { _id: "2", score: 3 },
    ];
    expect(hasArrayChange(a, b)).toBe(true);
  });
});
