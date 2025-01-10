import AuthenticationPage from "../pages/Authentication";
import { render, screen } from "@testing-library/react";

describe("AuthenticationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the login form by default", () => {
    render(<AuthenticationPage />);
    expect(
      screen.getByPlaceholderText(/enter your email/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });
});
