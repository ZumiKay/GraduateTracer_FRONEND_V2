import { mergeRemoteContent } from "../utils/mergeRemoteContent";
import { ContentType, QuestionType } from "../types/Form.types";

const q = (id: string | undefined, overrides: Partial<ContentType> = {}): ContentType =>
  ({
    _id: id,
    type: QuestionType.Text,
    formId: "form-1",
    qIdx: 0,
    page: 1,
    title: { type: "doc", content: [{ type: "text", text: id ?? "new" }] },
    ...overrides,
  }) as ContentType;

const titled = (text: string) => ({ type: "doc", content: [{ type: "text", text }] });

describe("mergeRemoteContent", () => {
  const base = [q("a", { qIdx: 0 }), q("b", { qIdx: 1 }), q("c", { qIdx: 2 })];

  it("takes their edits when I have changed nothing", () => {
    const incoming = [base[0], q("b", { qIdx: 1, title: titled("theirs") }), base[2]];

    const result = mergeRemoteContent({ mine: base, base, incoming })!;

    expect(result.merged[1].title).toEqual(titled("theirs"));
    expect(result.keptLocalEdits).toBe(0);
    expect(result.base).toEqual(incoming);
  });

  it("keeps my unsaved edit and takes their edit to a different question", () => {
    const mine = [q("a", { qIdx: 0, title: titled("mine") }), base[1], base[2]];
    const incoming = [base[0], q("b", { qIdx: 1, title: titled("theirs") }), base[2]];

    const result = mergeRemoteContent({ mine, base, incoming })!;

    expect(result.merged[0].title).toEqual(titled("mine"));
    expect(result.merged[1].title).toEqual(titled("theirs"));
    expect(result.keptLocalEdits).toBe(1);
    // My edit still differs from the new saved snapshot, so it stays "unsaved"
    expect(result.base[0].title).toEqual(base[0].title);
  });

  it("my edit wins when we both changed the same question", () => {
    const mine = [q("a", { qIdx: 0, title: titled("mine") }), base[1], base[2]];
    const incoming = [q("a", { qIdx: 0, title: titled("theirs") }), base[1], base[2]];

    const result = mergeRemoteContent({ mine, base, incoming })!;

    expect(result.merged[0].title).toEqual(titled("mine"));
    expect(result.base[0].title).toEqual(titled("theirs"));
  });

  it("keeps a question I added while taking their edits", () => {
    const mine = [...base, q(undefined, { qIdx: 3 })];
    const incoming = [q("a", { qIdx: 0, require: true }), base[1], base[2]];

    const result = mergeRemoteContent({ mine, base, incoming })!;

    expect(result.merged).toHaveLength(4);
    expect(result.merged[0].require).toBe(true);
    expect(result.merged[3]._id).toBeUndefined();
  });

  it("keeps my deletion while taking their edits", () => {
    const mine = [base[0], base[2]];
    const incoming = [base[0], base[1], q("c", { qIdx: 2, require: true })];

    const result = mergeRemoteContent({ mine, base, incoming })!;

    expect(result.merged.map((x) => x._id)).toEqual(["a", "c"]);
    expect(result.merged[1].require).toBe(true);
  });

  it("follows their added and removed questions, re-placing my edit at its new position", () => {
    const mine = [base[0], base[1], q("c", { qIdx: 2, title: titled("mine") })];
    // They deleted "a" and added "d": "c" moved up
    const incoming = [
      q("b", { qIdx: 0, questionId: "1" }),
      q("c", { qIdx: 1, questionId: "2" }),
      q("d", { qIdx: 2, questionId: "3" }),
    ];

    const result = mergeRemoteContent({ mine, base, incoming })!;

    expect(result.merged.map((x) => x._id)).toEqual(["b", "c", "d"]);
    expect(result.merged[1].title).toEqual(titled("mine"));
    expect(result.merged[1].qIdx).toBe(1);
    expect(result.merged[1].questionId).toBe("2");
  });

  it("drops my edit to a question they deleted", () => {
    const mine = [q("a", { qIdx: 0, title: titled("mine") }), base[1], base[2]];
    const incoming = [q("b", { qIdx: 0 }), q("c", { qIdx: 1 })];

    const result = mergeRemoteContent({ mine, base, incoming })!;

    expect(result.merged.map((x) => x._id)).toEqual(["b", "c"]);
    expect(result.keptLocalEdits).toBe(0);
  });

  it("refuses to merge when both sides added or removed questions", () => {
    const mine = [...base, q(undefined, { qIdx: 3 })];
    const incoming = [...base, q("d", { qIdx: 3 })];

    expect(mergeRemoteContent({ mine, base, incoming })).toBeNull();
  });

  it("refuses to merge when I reordered and they removed a question", () => {
    const mine = [base[1], base[0], base[2]];
    const incoming = [base[0], base[1]];

    expect(mergeRemoteContent({ mine, base, incoming })).toBeNull();
  });

  it("does not treat editor-only fields or key order as an edit", () => {
    const mine = [
      // Same question with its keys in a different order plus editor-only state
      { ...Object.fromEntries(Object.entries(q("a", { qIdx: 0 })).reverse()), isVisible: true, validationIssues: [] } as unknown as ContentType,
      base[1],
      base[2],
    ];
    const incoming = [q("a", { qIdx: 0, require: true }), base[1], base[2]];

    const result = mergeRemoteContent({ mine, base, incoming })!;

    expect(result.keptLocalEdits).toBe(0);
    expect(result.merged[0].require).toBe(true);
    // Editor-only state survives the replacement
    expect(result.merged[0].isVisible).toBe(true);
  });

  it("is idempotent: applying the same incoming page twice changes nothing more", () => {
    const mine = [q("a", { qIdx: 0, title: titled("mine") }), base[1], base[2]];
    const incoming = [base[0], q("b", { qIdx: 1, title: titled("theirs") }), base[2]];

    const first = mergeRemoteContent({ mine, base, incoming })!;
    const second = mergeRemoteContent({
      mine: first.merged,
      base: first.base,
      incoming,
    })!;

    expect(second.merged).toEqual(first.merged);
    expect(second.base).toEqual(first.base);
  });
});
