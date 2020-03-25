import { render } from "@testing-library/react";
import React, { Dispatch } from "react";
import { Auth0ProviderAction } from "../actions";
import * as hooks from "../hooks";
import { useAuth0, useLog } from "../hooks";
import { Auth0ProviderState, Auth0ProviderContext } from "../types";

const TestComponent: React.FC<{ debug?: boolean; logMessage?: string }> = ({ debug, logMessage }) => {
  const log = useLog(debug);
  log(logMessage || "Logging!");
  return <div />;
};

describe("hooks", () => {
  describe("useLog", () => {
    let origConsole: Pick<typeof window.console, "log" | "warn" | "error">;

    beforeEach(() => {
      origConsole = {
        log: window.console.log,
        warn: window.console.warn,
        error: window.console.error,
      };

      window.console.log = jest.fn();
      window.console.warn = jest.fn();
      window.console.error = jest.fn();
    });

    afterEach(() => {
      window.console.log = origConsole.log;
      window.console.warn = origConsole.warn;
      window.console.error = origConsole.error;
    });

    it("Does not log anything if no arguments are provided", () => {
      render(<TestComponent />);
      expect(window.console.log).not.toHaveBeenCalled();
    });

    it("Does not log anything if the debug flag is set to false", () => {
      render(<TestComponent debug={false} />);
      expect(window.console.log).not.toHaveBeenCalled();
    });

    it("Logs if the debug flag is set to true", () => {
      const logString = "test";
      render(<TestComponent debug={true} logMessage={logString} />);
      expect(window.console.log).toBeCalledWith(logString);
    });
  });

  describe("useAuth0", () => {
    it("throws an error if the auth0 context is not present", async () => {
      const FakeFC: React.FC = () => {
        const auth0 = useAuth0();

        return <div data-testid="username">{auth0.user?.name}</div>;
      };

      expect(() => render(<FakeFC />)).toThrowErrorMatchingSnapshot();
    });

    it("returns the context values if the auth0 context is present", async () => {
      const mockState = ({ user: { name: "foo" } } as unknown) as Auth0ProviderState;
      const mockDispatch = {} as Dispatch<Auth0ProviderAction>;

      jest.spyOn(hooks, "useAuth0").mockImplementation(() => mockState);

      const FakeFC: React.FC = () => {
        const auth0 = useAuth0();

        return <div data-testid="username">{auth0.user?.name}</div>;
      };

      const App: React.FC = () => {
        return (
          <Auth0ProviderContext.Provider value={{ state: mockState, dispatch: mockDispatch }}>
            <FakeFC />
          </Auth0ProviderContext.Provider>
        );
      };

      const { getByTestId } = await render(<App />);
      const el = getByTestId("username");

      expect(el.textContent).toEqual(mockState.user?.name);
    });
  });
});
