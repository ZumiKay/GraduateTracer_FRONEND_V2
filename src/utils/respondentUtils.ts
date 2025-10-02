export const getNameFromEmail = (email: string): string => {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  return parts[0] || "";
};

export const getResponseDisplayName = ({
  respondentEmail,
  respondentName,
}: {
  respondentName?: string;
  respondentEmail?: string;
}): string => {
  if (respondentName && respondentName.trim()) {
    return respondentName.trim();
  }

  if (respondentEmail) {
    const nameFromEmail = getNameFromEmail(respondentEmail);
    if (nameFromEmail) {
      return nameFromEmail;
    }
  }

  return "Anonymous";
};
