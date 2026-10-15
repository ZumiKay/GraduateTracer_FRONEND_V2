import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  resetCollab,
  setCollabConnection,
  setCollabPresence,
} from "../redux/collab.store";
import useRemoteContentSync from "./useRemoteContentSync";

/**
 * Keeps this tab connected to the form's collaboration stream while the editor
 * is open: mirrors who else is here and which questions they are editing into
 * the store, and applies the changes they save to this tab as they happen.
 * The browser reconnects the stream on its own; each (re)connection gets a
 * fresh connection id from the server.
 */
const useFormCollaboration = (formId?: string, enabled: boolean = true) => {
  const dispatch = useDispatch();
  const { applyRemoteContent, applyStructureChange } = useRemoteContentSync();

  useEffect(() => {
    if (!formId || !enabled || typeof EventSource === "undefined") return;

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/v0/api";
    const source = new EventSource(
      `${apiUrl}/form/${formId}/collab/stream?ngrok-skip-browser-warning=true`,
      { withCredentials: true },
    );

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "connected") {
          dispatch(setCollabConnection(message.connectionId));
        } else if (message.type === "state") {
          dispatch(
            setCollabPresence({
              users: message.users ?? [],
              locks: message.locks ?? [],
            }),
          );
        } else if (message.type === "content") {
          applyRemoteContent(message);
        } else if (message.type === "structure") {
          applyStructureChange();
        }
      } catch (error) {
        console.error("[Collab] Bad stream message:", error);
      }
    };

    // Connection lost: our locks are gone server-side until we reconnect
    source.onerror = () => {
      dispatch(setCollabConnection(null));
    };

    return () => {
      source.close();
      dispatch(resetCollab());
    };
  }, [formId, enabled, dispatch, applyRemoteContent, applyStructureChange]);
};

export default useFormCollaboration;
