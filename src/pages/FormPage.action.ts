import ApiRequest from "../hooks/APIHook/ApiHook";
import { ContentType } from "../types/Form.types";

/**Saving request for both manual and auto save function */
export const AutoSaveQuestion = async (data: {
  data: Array<ContentType> | object;
  formId: string;
  type?: "save" | "edit";
  page?: number;
  title?: string;
  // Page content version this save is based on (see contentVersionService)
  version?: number;
  // This tab's collaboration connection, so the server doesn't echo the save back to it
  connectionId?: string;
}) => {
  const url = data.type === "save" ? "/savecontent" : "/editform";
  const response = ApiRequest({
    url,
    method: "PUT",
    cookie: true,
    data,
  });
  return response;
};

