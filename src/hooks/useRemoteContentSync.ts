import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setallquestion, setprevallquestion } from "../redux/formstore";
import { ContentType } from "../types/Form.types";
import { InfoToast } from "../component/Modal/AlertModal";
import queryClient from "./ReactQueryClient";
import {
  bumpRemoteRevision,
  getContentVersion,
  setContentVersion,
} from "../services/contentVersionService";
import { mergeRemoteContent } from "../utils/mergeRemoteContent";
import { hasArrayChange } from "../helperFunc";

/** A page saved by a collaborator, as pushed over the collaboration stream. */
export interface RemoteContentMessage {
  page: number;
  version: number;
  data: ContentType[];
  by?: { userId: string; name: string };
}

// Tabs whose editor state is the page's question list
const isContentTab = () => {
  const tab = new URLSearchParams(window.location.search).get("tab") ?? "question";
  return tab === "question" || tab === "solution";
};

/**
 * Applies collaborators' saved changes to this tab without a reload.
 *
 * Their version of the page is merged with any unsaved edits here; the page
 * version is only advanced when the merge was applied, so if it could not be
 * (both sides added or removed questions) the next save still gets a conflict
 * instead of overwriting them.
 */
const useRemoteContentSync = () => {
  const dispatch = useDispatch();
  const { allquestion, prevAllQuestion, page, formstate } = useSelector(
    (root: RootState) => root.allform,
  );

  // The stream handler must always see the newest editor state
  const latest = useRef({ allquestion, prevAllQuestion, page, formId: formstate._id });
  useEffect(() => {
    latest.current = { allquestion, prevAllQuestion, page, formId: formstate._id };
  }, [allquestion, prevAllQuestion, page, formstate._id]);

  const applyRemoteContent = useCallback(
    (message: RemoteContentMessage) => {
      const { allquestion, prevAllQuestion, page, formId } = latest.current;
      if (!formId || !Array.isArray(message.data)) return;
      // Other pages and tabs load fresh content when they are opened
      if (message.page !== page || !isContentTab()) return;

      const known = getContentVersion(formId, page);
      if (known !== undefined && message.version <= known) return;

      const result = mergeRemoteContent({
        mine: allquestion,
        base: prevAllQuestion,
        incoming: message.data,
      });
      if (!result) return;

      setContentVersion(formId, page, message.version);
      bumpRemoteRevision();
      latest.current = {
        ...latest.current,
        allquestion: result.merged,
        prevAllQuestion: result.base,
      };
      dispatch(setprevallquestion(result.base));
      dispatch(setallquestion(result.merged));

      InfoToast({
        toastid: "collab-remote-update",
        title: "Page updated",
        content: `${message.by?.name ?? "A collaborator"} saved changes to this page${
          result.keptLocalEdits > 0 ? ". Your unsaved edits were kept" : ""
        }`,
      });
    },
    [dispatch],
  );

  // Pages were added or removed by someone else
  const applyStructureChange = useCallback(() => {
    const { allquestion, prevAllQuestion } = latest.current;

    if (hasArrayChange(allquestion, prevAllQuestion)) {
      // Reloading now would discard unsaved work; the next save will ask
      InfoToast({
        toastid: "collab-structure-change",
        title: "Pages changed",
        content: "A collaborator added or removed a page. Reload to see the latest pages.",
      });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["FormInfo"] });
  }, []);

  return { applyRemoteContent, applyStructureChange };
};

export default useRemoteContentSync;
