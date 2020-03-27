import createAuth0Client from "@auth0/auth0-spa-js";
import Auth0Client from "@auth0/auth0-spa-js/dist/typings/Auth0Client";
import React, { Dispatch, Reducer, useEffect, useReducer } from "react";
import { useAsync, useAsyncFn, useLocation } from "react-use";

import { auth0Loaded, Auth0ProviderAction, handleRedirectCallbackAction, loginWithPopupAction } from "./actions";
import { useLog } from "./hooks";
import { auth0ProviderStateReducer } from "./reducer";
import {
  Auth0ProviderContext,
  Auth0ProviderProps,
  Auth0ProviderState,
  isHandlingRedirectState,
  isLoadedState,
  isLoadingState,
  LoadingState,
  RouteState,
  TokenUser,
} from "./types";

const InitialReducerState: LoadingState = {
  loading: true,
  isAuthenticated: false,
  popupOpen: false,
  user: undefined,
  auth0Client: undefined,
  handlingRedirect: false,
};

const buildHandleRedirectCallback = (
  dispatch: Dispatch<Auth0ProviderAction>,
  log: typeof console.log,
  auth0Client: Auth0Client,
) => async (url?: string): Promise<RedirectLoginResult> => {
  dispatch(handleRedirectCallbackAction.started());

  const response = await auth0Client.handleRedirectCallback(url);
  const user = await auth0Client.getUser();
  log("handleRedirectCallback(): got response:", response);
  log("handleRedirectCallback(): got user:", user);

  dispatch(handleRedirectCallbackAction.done({ result: { user } }));

  return response;
};

const buildLoginWithPopup = (dispatch: Dispatch<Auth0ProviderAction>, auth0Client: Auth0Client) => async (
  options?: PopupLoginOptions,
  config?: PopupConfigOptions,
): Promise<void> => {
  dispatch(loginWithPopupAction.started());

  try {
    await auth0Client.loginWithPopup(options, config);
  } catch (error) {
    console.error(error);
  }

  const user = await auth0Client.getUser();

  dispatch(loginWithPopupAction.done({ result: { user } }));
};

export const Auth0Provider: React.FC<Auth0ProviderProps> = ({
  children,
  history,
  enableDebugLogging,
  renderLoading,
  ...initOptions
}) => {
  const log = useLog(enableDebugLogging);

  const [state, dispatch] = useReducer<Reducer<Auth0ProviderState, Auth0ProviderAction>>(
    auth0ProviderStateReducer,
    InitialReducerState,
  );

  const location = useLocation();

  const { loading: initLoading, value: initValue } = useAsync(async () => {
    log("Beginning auth0 initialization");

    dispatch(auth0Loaded.started());

    const auth0Client = await createAuth0Client(initOptions);

    const handleRedirectCallback = buildHandleRedirectCallback(dispatch, log, auth0Client);

    const loginWithPopup = buildLoginWithPopup(dispatch, auth0Client);

    const isAuthenticated = await auth0Client.isAuthenticated();

    const user: TokenUser | undefined = (isAuthenticated && (await auth0Client.getUser())) || undefined;

    return {
      user,
      auth0Client,
      handleRedirectCallback,
      loginWithPopup,
    };
  }, []);

  const [handleRedirAsyncState, handleRedirAsync] = useAsyncFn(async () => {
    if (!isLoadedState(state)) {
      return;
    }

    log("Handling redirect");
    const { appState: s } = await state.handleRedirectCallback();
    const appState: RouteState = s;
    log("Back from redirect, replacing state to ", appState);
    history.replace(appState.targetUrl);
  }, ["handleRedirectCallback" in state && state.handleRedirectCallback, log, history.replace]);

  useEffect(() => {
    if (!isLoadedState(state) || handleRedirAsyncState.loading) {
      return;
    }

    if (location.search?.includes("code=") && location.search?.includes("state=")) {
      handleRedirAsync().then(() => {
        /* no-op */
      });
    }
  }, [location.search, state, handleRedirAsyncState.loading, handleRedirAsync]);

  useEffect(() => {
    if (isLoadingState(state) && !initLoading && initValue) {
      log("auth0 initialization complete");
      dispatch(auth0Loaded.done({ result: initValue }));
    }
  }, [state, dispatch, initLoading, log, initValue]);

  if (isLoadingState(state)) {
    log("Rendering loading view due to auth0Client still loading");
    return (renderLoading && renderLoading(state)) || <></>;
  }

  if (isHandlingRedirectState(state)) {
    log("Rendering loading view due to handling redirect");
    return (renderLoading && renderLoading(state)) || <></>;
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
