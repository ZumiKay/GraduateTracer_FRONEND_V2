import ApiRequest from "../hooks/APIHook/ApiHook";
import { ContentType } from "../types/Form.types";

/**Saving request for both manual and auto save function */
export const AutoSaveQuestion = async (data: {
  data: Array<ContentType> | object;
  formId: string;
  type?: "save" | "edit";
  page?: number;
  title?: string;
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

