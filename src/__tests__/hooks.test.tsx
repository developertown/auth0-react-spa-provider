import { render } from "@testing-library/react";
import React from "react";
import { useLog } from "../hooks";

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
});
