import { useCallback, useContext } from "react";

import { Auth0ProviderContext, Auth0ProviderState } from "./types";

export const useAuth0 = (): Auth0ProviderState => {
  const context = useContext(Auth0ProviderContext);

  if (!context) {
    throw new Error("useAuth0 may only be used within the context of an <Auth0Provider />");
  }

  return context.state;
};

export const useLog = (enableDebugLogging = false): typeof console.log => {
  return useCallback<typeof console.log>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (message?: any, ...optionalParams: any[]) => {
      if (enableDebugLogging) {
        console.log(message, ...optionalParams);
      }
    },
    [enableDebugLogging],
  );
};
