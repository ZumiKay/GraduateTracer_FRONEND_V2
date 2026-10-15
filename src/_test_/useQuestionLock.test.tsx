import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as ReactRedux from "react-redux";
import useQuestionLock from "../hooks/useQuestionLock";
import CollaboratorPresence from "../component/Collaboration/CollaboratorPresence";
import {
  acquireQuestionLock,
  releaseQuestionLock,
} from "../services/collabService";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock("../services/collabService", () => ({
  LOCK_REFRESH_MS: 10_000,
  acquireQuestionLock: jest.fn(() => Promise.resolve(true)),
  releaseQuestionLock: jest.fn(() => Promise.resolve({ success: true })),
}));

type TestState = {
  allform: { formstate: { _id?: string } };
  usersession: { user: { _id: string } | null };
  collab?: {
    connectionId: string | null;
    users: Array<{ connectionId: string; userId: string; name: string }>;
    locks: Array<{
      questionId: string;
      connectionId: string;
      userId: string;
      name: string;
    }>;
  };
};

const baseState = (): TestState => ({
  allform: { formstate: { _id: "form-1" } },
  usersession: { user: { _id: "me" } },
  collab: { connectionId: "conn-me", users: [], locks: [] },
});

const useState = (state: TestState) =>
  (ReactRedux.useSelector as unknown as jest.Mock).mockImplementation(
    (selector: (s: TestState) => unknown) => selector(state),
  );

const Card = ({ questionId }: { questionId?: string }) => {
  const { lockedBy, onFocusCapture, onBlurCapture } = useQuestionLock(questionId);
  return (
    <div onFocusCapture={onFocusCapture} onBlurCapture={onBlurCapture}>
      <input aria-label="title" />
      <input aria-label="option" />
      <span data-testid="locked-by">{lockedBy?.name ?? "nobody"}</span>
    </div>
  );
};

describe("useQuestionLock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useState(baseState());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("takes the lock on focus and keeps refreshing it", () => {
    render(<Card questionId="q1" />);

    fireEvent.focus(screen.getByLabelText("title"));
    expect(acquireQuestionLock).toHaveBeenCalledWith("form-1", "conn-me", "q1");

    act(() => {
      jest.advanceTimersByTime(20_000);
    });
    expect(acquireQuestionLock).toHaveBeenCalledTimes(3);
  });

  it("keeps the lock when focus moves to another field of the same card", () => {
    render(<Card questionId="q1" />);
    const title = screen.getByLabelText("title");
    const option = screen.getByLabelText("option");

    fireEvent.focus(title);
    fireEvent.blur(title, { relatedTarget: option });
    fireEvent.focus(option);
    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(releaseQuestionLock).not.toHaveBeenCalled();
    expect(acquireQuestionLock).toHaveBeenCalledTimes(1);
  });

  it("releases the lock shortly after focus leaves the card", () => {
    render(<Card questionId="q1" />);
    const title = screen.getByLabelText("title");

    fireEvent.focus(title);
    fireEvent.blur(title);
    expect(releaseQuestionLock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1_500);
    });
    expect(releaseQuestionLock).toHaveBeenCalledWith("form-1", "conn-me", "q1");

    // And it stops refreshing
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(acquireQuestionLock).toHaveBeenCalledTimes(1);
  });

  it("releases the lock when the card is removed", () => {
    const { unmount } = render(<Card questionId="q1" />);
    fireEvent.focus(screen.getByLabelText("title"));

    unmount();

    expect(releaseQuestionLock).toHaveBeenCalledWith("form-1", "conn-me", "q1");
  });

  it("does nothing for an unsaved question or without a connection", () => {
    const { unmount } = render(<Card />);
    fireEvent.focus(screen.getByLabelText("title"));
    unmount();

    useState({ ...baseState(), collab: { connectionId: null, users: [], locks: [] } });
    render(<Card questionId="q1" />);
    fireEvent.focus(screen.getByLabelText("title"));

    expect(acquireQuestionLock).not.toHaveBeenCalled();
  });

  it("reports who holds the lock when it is another connection, not our own", () => {
    useState({
      ...baseState(),
      collab: {
        connectionId: "conn-me",
        users: [],
        locks: [
          { questionId: "q1", connectionId: "conn-me", userId: "me", name: "Me" },
          { questionId: "q2", connectionId: "conn-alex", userId: "alex", name: "Alex" },
        ],
      },
    });

    const { unmount } = render(<Card questionId="q1" />);
    expect(screen.getByTestId("locked-by")).toHaveTextContent("nobody");
    unmount();

    render(<Card questionId="q2" />);
    expect(screen.getByTestId("locked-by")).toHaveTextContent("Alex");
  });

  it("works with a store that has no collaboration state", () => {
    useState({ ...baseState(), collab: undefined });

    render(<Card questionId="q1" />);
    fireEvent.focus(screen.getByLabelText("title"));

    expect(screen.getByTestId("locked-by")).toHaveTextContent("nobody");
    expect(acquireQuestionLock).not.toHaveBeenCalled();
  });
});

describe("CollaboratorPresence", () => {
  const withAlex = () =>
    useState({
      ...baseState(),
      collab: {
        connectionId: "conn-me",
        locks: [],
        users: [
          { connectionId: "conn-me", userId: "me", name: "Me" },
          { connectionId: "conn-a", userId: "a", name: "Alex" },
        ],
      },
    });

  beforeEach(() => {
    localStorage.clear();
  });

  it("explains live collaboration by itself the first time someone joins, and only once", () => {
    withAlex();
    const first = render(<CollaboratorPresence />);

    expect(screen.getByRole("dialog", { name: "Live collaboration" })).toBeInTheDocument();
    expect(screen.getByText(/together with Alex/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Got it"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    first.unmount();

    render(<CollaboratorPresence />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("lets the user reopen the explanation and close it with Escape", () => {
    localStorage.setItem("collab_intro_seen", "1");
    withAlex();
    render(<CollaboratorPresence />);

    fireEvent.click(screen.getByLabelText("About live collaboration"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing when you are alone, even with several of your own tabs", () => {
    useState({
      ...baseState(),
      collab: {
        connectionId: "conn-me",
        locks: [],
        users: [
          { connectionId: "conn-me", userId: "me", name: "Me" },
          { connectionId: "conn-me-2", userId: "me", name: "Me" },
        ],
      },
    });

    const { container } = render(<CollaboratorPresence />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows one avatar per other person and a count beyond three", () => {
    const person = (id: string, name: string, tab = "") => ({
      connectionId: `conn-${id}${tab}`,
      userId: id,
      name,
    });
    useState({
      ...baseState(),
      collab: {
        connectionId: "conn-me",
        locks: [],
        users: [
          person("me", "Me"),
          person("a", "Alex"),
          person("a", "Alex", "-2"),
          person("b", "Bea"),
          person("c", "Cy"),
          person("d", "Dee"),
        ],
      },
    });

    localStorage.setItem("collab_intro_seen", "1");
    render(<CollaboratorPresence />);

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Also editing: Alex, Bea, Cy, Dee",
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("4 others here")).toBeInTheDocument();
  });
});
