import { ErrorToast } from "../component/Modal/AlertModal";
import ApiRequest from "../hooks/ApiHook";
import { ContentType } from "../types/Form.types";

export const AutoSaveQuestion = async (data: {
  data: Array<ContentType> | object;
  formId: string;
  type?: "save" | "edit";
  page?: number;
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

export const DeleteQuestionRequest = async (data: {
  id: string;
  formId: string;
}) => {
  const delreq = await ApiRequest({
    url: "/deletequestion",
    method: "DELETE",
    cookie: true,
    data,
  });

  if (!delreq.success) {
    ErrorToast({ title: "Failed", content: "Can't Delete" });
    return false;
  }
  return true;
};
