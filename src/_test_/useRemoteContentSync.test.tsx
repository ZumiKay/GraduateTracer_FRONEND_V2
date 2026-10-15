import { renderHook, act } from "@testing-library/react";
import * as ReactRedux from "react-redux";
import useRemoteContentSync from "../hooks/useRemoteContentSync";
import { setallquestion, setprevallquestion } from "../redux/formstore";
import { ContentType, QuestionType } from "../types/Form.types";
import {
  getContentVersion,
  getRemoteRevision,
  resetContentVersions,
  setContentVersion,
} from "../services/contentVersionService";
import { InfoToast } from "../component/Modal/AlertModal";
import queryClient from "../hooks/ReactQueryClient";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

const q = (id: string | undefined, overrides: Partial<ContentType> = {}): ContentType =>
  ({
    _id: id,
    type: QuestionType.Text,
    formId: "form-1",
    qIdx: 0,
    page: 1,
    ...overrides,
  }) as ContentType;

describe("useRemoteContentSync", () => {
  const base = [q("a"), q("b", { qIdx: 1 })];
  const dispatch = jest.fn();

  const setup = (state: {
    allquestion?: ContentType[];
    prevAllQuestion?: ContentType[];
    page?: number;
  } = {}) => {
    const allform = {
      allquestion: base,
      prevAllQuestion: base,
      page: 1,
      formstate: { _id: "form-1" },
      ...state,
    };
    (ReactRedux.useSelector as unknown as jest.Mock).mockImplementation(
      (selector: (s: { allform: typeof allform }) => unknown) => selector({ allform }),
    );
    return renderHook(() => useRemoteContentSync()).result;
  };

  const message = (overrides: Record<string, unknown> = {}) => ({
    page: 1,
    version: 5,
    data: [q("a", { require: true }), q("b", { qIdx: 1 })],
    by: { userId: "alex", name: "Alex" },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetContentVersions();
    (ReactRedux.useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
    window.history.replaceState({}, "", "/form/form-1?tab=question");
    setContentVersion("form-1", 1, 4);
  });

  it("applies a collaborator's saved page, advances the version and tells the user", () => {
    const result = setup();

    act(() => result.current.applyRemoteContent(message()));

    expect(dispatch).toHaveBeenCalledWith(setprevallquestion(message().data));
    expect(dispatch).toHaveBeenCalledWith(setallquestion(message().data));
    expect(getContentVersion("form-1", 1)).toBe(5);
    expect(getRemoteRevision()).toBe(1);
    expect(InfoToast).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Alex saved changes to this page",
      }),
    );
  });

  it("keeps my unsaved edit and says so", () => {
    const mine = [q("a"), q("b", { qIdx: 1, require: true })];
    const result = setup({ allquestion: mine });

    act(() => result.current.applyRemoteContent(message()));

    const merged = dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === setallquestion.type).payload;
    expect(merged[0].require).toBe(true); // theirs
    expect(merged[1].require).toBe(true); // mine, still unsaved
    expect(InfoToast).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Alex saved changes to this page. Your unsaved edits were kept",
      }),
    );
  });

  it("ignores updates for another page, another tab, or a version it already has", () => {
    const result = setup();

    act(() => result.current.applyRemoteContent(message({ page: 2 })));
    act(() => result.current.applyRemoteContent(message({ version: 4 })));
    window.history.replaceState({}, "", "/form/form-1?tab=setting");
    act(() => result.current.applyRemoteContent(message()));

    expect(dispatch).not.toHaveBeenCalled();
    expect(getContentVersion("form-1", 1)).toBe(4);
  });

  it("leaves the version alone when the merge is not possible, so the next save conflicts", () => {
    const mine = [...base, q(undefined, { qIdx: 2 })];
    const result = setup({ allquestion: mine });

    act(() =>
      result.current.applyRemoteContent(
        message({ data: [...base, q("c", { qIdx: 2 })] }),
      ),
    );

    expect(dispatch).not.toHaveBeenCalled();
    expect(getContentVersion("form-1", 1)).toBe(4);
  });

  it("reloads the form when pages changed and nothing is unsaved", () => {
    const invalidate = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const result = setup();

    act(() => result.current.applyStructureChange());

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["FormInfo"] });
    invalidate.mockRestore();
  });

  it("does not reload over unsaved work when pages changed; it tells the user instead", () => {
    const invalidate = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const result = setup({ allquestion: [q("a", { require: true }), base[1]] });

    act(() => result.current.applyStructureChange());

    expect(invalidate).not.toHaveBeenCalled();
    expect(InfoToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Pages changed" }),
    );
    invalidate.mockRestore();
  });
});
