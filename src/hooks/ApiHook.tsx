import axios, { AxiosError, AxiosRequestConfig } from "axios";

interface ApiRequestProps {
  method: "GET" | "PUT" | "DELETE" | "POST";
  cookie?: boolean;
  url: string;
  data?: Record<string, unknown>;
  refreshtoken?: boolean;
}

const RefreshToken = async () => {
  try {
    await axios({
      method: "POST",
      baseURL: "",
      url: "/refreshtoken",
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { success: true };
  } catch (error) {
    console.log("Refresh Token", error);
    return { success: false };
  }
};

const ApiRequest = async ({
  method,
  cookie,
  url,
  data,
  refreshtoken,
}: ApiRequestProps): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> => {
  const accessToken = localStorage.getItem("accessToken");
  // Function to handle API requests
  const config: AxiosRequestConfig = {
    baseURL: "",
    url,
    method,
    withCredentials: !!cookie,
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : undefined, // Add token if exists
    },
    timeout: 3000,
    timeoutErrorMessage: "Request Timeout",
    data,
  };
  try {
    const response = await axios(config);

    return { success: true, data: response.data };
  } catch (error) {
    console.log("Api Request Error", error);
    const err = error as AxiosError;

    // Handle timeout error
    if (err.code === "ECONNABORTED" || err.message === "Request Timeout") {
      console.error("Request timed out. Please try again later.");
      return {
        success: false,
        error: "Request timed out. Please try again later",
      };
    }

    if (err?.status === 401 && refreshtoken) {
      //Referesh Token
      const newAccesstoken = await RefreshToken();
      if (!newAccesstoken.success) {
        return { success: false, error: "Login session expired" };
      }
      const header = {
        ...config.headers,
        Authorization: `Bearer ${newAccesstoken}`,
      };
      //retry request
      try {
        const retryResponse = await axios({ ...config, headers: header });
        return { success: true, data: retryResponse.data };
      } catch (retryError) {
        console.error("Retry request failed", retryError);
        return { success: false, error: (retryError as AxiosError).message };
      }
    }
    return { success: false, error: err.message };
  }
};

export default ApiRequest;
