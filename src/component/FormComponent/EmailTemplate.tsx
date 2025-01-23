const EmailTemplate = () => {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: "#333",
        backgroundColor: "#ffffff",
        padding: "20px",
        margin: "0 auto",
        maxWidth: "600px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          color: "#000000",
          width: "100%",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        Graduate Tracer Study
      </h1>
      <h1 style={{ color: "#555", marginBottom: "20px" }}>
        Your Verification Code
      </h1>
      <p style={{ marginBottom: "20px" }}>
        Please use the following code to verify your account:
      </p>

      <div
        style={{
          display: "inline-block",
          backgroundColor: "#f9f9f9",
          color: "#222",
          padding: "10px 20px",
          fontSize: "18px",
          fontWeight: "bold",
          border: "1px solid #ddd",
          borderRadius: "4px",
          letterSpacing: "1px",
        }}
      >
        $code$
      </div>

      <p style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        If you didn’t request this, please ignore this email.
      </p>
    </div>
  );
};

export default EmailTemplate;
