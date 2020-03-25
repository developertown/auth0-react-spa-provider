import createAuth0Client from "@auth0/auth0-spa-js";
import React, { Reducer, useReducer } from "react";
import { useAsync, useLocation } from "react-use";

import { auth0Loaded, Auth0ProviderActions, handleRedirectCallbackAction, loginWithPopupAction } from "./actions";
import { useLog } from "./hooks";
import { auth0ProviderStateReducer } from "./reducer";
import {
  Auth0ProviderContext,
  Auth0ProviderProps,
  Auth0ProviderState,
  isHandlingRedirectState,
  isLoadingState,
  LoadingState,
  RouteState,
  TokenUser,
} from "./types";

const DefaultRedirectCallback = (state: RouteState): void => {
  window.history.replaceState(state, document.title, window.location.pathname);
};

const InitialReducerState: LoadingState = {
  loading: true,
  isAuthenticated: false,
  popupOpen: false,
  user: undefined,
  auth0Client: undefined,
};

export const Auth0Provider: React.FC<Auth0ProviderProps> = ({
  children,
  onRedirectCallback = DefaultRedirectCallback,
  enableDebugLogging,
  ...initOptions
}) => {
  const log = useLog(enableDebugLogging);

  const [state, dispatch] = useReducer<Reducer<Auth0ProviderState, Auth0ProviderActions>>(
    auth0ProviderStateReducer,
    InitialReducerState,
  );

  const location = useLocation();

  useAsync(async () => {
    if (!state.loading && !state.auth0Client) {
      return;
    }

    log("Running initAuth0");

    const auth0Client = await createAuth0Client(initOptions);

    const handleRedirectCallback = async (url?: string): Promise<RedirectLoginResult> => {
      if (isLoadingState(state)) {
        throw new Error("Unable to loginWithRedirect until the auth0 client is loaded");
      }

      const { auth0Client } = state;

      dispatch(handleRedirectCallbackAction.started());

      const response = await auth0Client.handleRedirectCallback(url);
      const user = await auth0Client.getUser();

      dispatch(handleRedirectCallbackAction.done({ result: { user } }));

      return response;
    };

    const loginWithPopup = async (options?: PopupLoginOptions, config?: PopupConfigOptions): Promise<void> => {
      if (isLoadingState(state)) {
        throw new Error("Unable to loginWithPopup until the auth0 client is loaded");
      }

      const { auth0Client } = state;

      dispatch(loginWithPopupAction.started());

      try {
        await auth0Client.loginWithPopup(options, config);
      } catch (error) {
        console.error(error);
      }

      const user = await auth0Client.getUser();

      dispatch(loginWithPopupAction.done({ result: { user } }));
    };

    if (location.search?.includes("code=") && location.search?.includes("state=")) {
      log("Handling redirect");
      const { appState } = await handleRedirectCallback();
      onRedirectCallback(appState);
    }

    const isAuthenticated = await auth0Client.isAuthenticated();

    const user: TokenUser | undefined = (isAuthenticated && (await auth0Client.getUser())) || undefined;

    dispatch(
      auth0Loaded({
        user,
        auth0Client,
        handleRedirectCallback,
        loginWithPopup,
      }),
    );

    return auth0Client;
  }, [state, dispatch, onRedirectCallback, log, location.search]);

  if (isLoadingState(state)) {
    return <div>Loading auth0...</div>;
  }

  if (isHandlingRedirectState(state)) {
    return <div>Handling redirect...</div>;
  }

  return (
    <Auth0ProviderContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </Auth0ProviderContext.Provider>
  );
};
