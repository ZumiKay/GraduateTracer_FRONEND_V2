import ApiRequest from "../../hooks/ApiHook";

export default function RecaptchaButton() {
  const handleVerify = async () => {
    // Ensure the global grecaptcha object is available
    const wins = window as unknown as {
      grecaptcha: { execute: (key: string, object: object) => void };
    };
    if (wins.grecaptcha) {
      const token = await wins.grecaptcha?.execute(
        import.meta.env.VITE_RECAPTCHA_KEY,
        {
          action: "submit",
        }
      );

      // Pass the token to your backend for verification
      const verify = await ApiRequest({
        method: "POST",
        url: "/recaptchaverify",
        data: {
          token,
        },
      });
      if (!verify.success) {
        //not successfull

        return false;
      }
      //successfull
      return true;
    } else {
      console.error("reCAPTCHA not loaded");
    }
  };

  return { handleVerify };
}
