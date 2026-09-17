//App mock for testing

import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SessionState } from "../redux/user.store";
import { ROLE } from "../types/User.types";
import React, { ComponentType, ReactNode } from "react";

export const mockUserSession: SessionState = {
  user: {
    _id: "Unique ID",
    name: "TestUser",
    email: "testuser@example.com",
    role: ROLE.USER,
  },
  isAuthenticated: true,
};

const defaultUserSession: SessionState = {
  user: null,
  isAuthenticated: false,
};

export interface componentToBeTestType {
  path: string;
  component: ReactNode | ComponentType;
}

/**
 * Mock root app component requires
 * ReactQuery (QueryClient)
 * ReactRedux (usersession redux state)
 * Using MemoryRouter to store the route inside the memory
 * @param routeToBeTest-string
 * @param initialReduxState-usersession
 * @returns renderComponent
 * */
const AppWrapperMock = ({
  componentToBeTest,
  initialReduxState = { usersession: defaultUserSession },
  initialEntries,
}: {
  componentToBeTest: Array<componentToBeTestType>;
  initialReduxState?: Record<string, unknown>;
  initialEntries?: string[];
}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const ProviderMock = configureStore({
    reducer: {
      usersession: (state = initialReduxState.usersession) => state,
    },
  });

  const entries =
    initialEntries || (componentToBeTest.length > 0 ? [componentToBeTest[0].path] : ["/"]);

  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={ProviderMock}>
        <MemoryRouter initialEntries={entries}>
          <Routes>
            <Route
              path="/notfound"
              Component={() => <div data-testid="notfound">NotFoundPage</div>}
            />
            {componentToBeTest.map((com, idx) => (
              <Route
                key={idx}
                path={com.path}
                element={
                  React.isValidElement(com.component)
                    ? com.component
                    : React.createElement(com.component as ComponentType)
                }
              />
            ))}
          </Routes>
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>,
  );
};

export default AppWrapperMock;
