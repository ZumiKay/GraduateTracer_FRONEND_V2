import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ApiRequest, { ApiRequestReturnType } from "../../../hooks/ApiHook";
import { FormDataType, ContentType } from "../../../types/Form.types";

export const useFormData = () => {
  const { formId, token } = useParams<{ formId: string; token?: string }>();
  const [form, setForm] = useState<FormDataType | null>(null);
  const [questions, setQuestions] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) return;

      try {
        setLoading(true);
        const url = token
          ? `response/form/${formId}?token=${token}`
          : `response/form/${formId}`;

        const result = (await ApiRequest({
          url,
          method: "GET",
        })) as ApiRequestReturnType;

        if (result.success && result.data) {
          const formData = result.data as FormDataType & {
            contentIds: ContentType[];
          };
          setForm(formData);

          // Cast to ContentType array since the backend populates it
          const questions = (formData.contentIds || []) as ContentType[];
          setQuestions(questions);
        } else {
          setError("Form not found or access denied");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, token]);

  return { form, questions, loading, error };
};
