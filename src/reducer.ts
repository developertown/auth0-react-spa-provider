import { reducerWithoutInitialState } from "typescript-fsa-reducers";

import { auth0Loaded, handleRedirectCallbackAction, loginWithPopupAction } from "./actions";
import {
  Auth0ProviderState,
  AuthenticatedState,
  HandlingRedirectState,
  isHandlingRedirectState,
  isLoadedState,
  isLoadingState,
  UnauthenticatedState,
} from "./types";

export const auth0ProviderStateReducer = reducerWithoutInitialState<Auth0ProviderState>()
  .case(auth0Loaded, (state, { user, auth0Client }): AuthenticatedState | UnauthenticatedState => {
    if (!isLoadingState(state)) {
      throw new Error("Invalid state: auth0Loaded may only be applied when in the loading state.");
    }

    return {
      ...state,

      loading: false,
      auth0Client,
      popupOpen: false,

      loginWithPopup: auth0Client.loginWithPopup,
      loginWithRedirect: auth0Client.loginWithRedirect,
      getTokenWithPopup: auth0Client.getTokenWithPopup,
      getTokenSilently: auth0Client.getTokenSilently,
      getIdTokenClaims: auth0Client.getIdTokenClaims,
      handleRedirectCallback: auth0Client.handleRedirectCallback,
      logout: auth0Client.logout,

      user: user || undefined,
      isAuthenticated: Boolean(user),
    } as AuthenticatedState | UnauthenticatedState;
  })
  .case(loginWithPopupAction.started, (state) => {
    if (!isLoadedState(state)) {
      throw new Error("Invalid state: loginWithPopupAction.started may only be applied when in a loaded state.");
    }

    return {
      ...state,
      popupOpen: true,
    };
  })
  .case(loginWithPopupAction.done, (state, { result: user }): AuthenticatedState | UnauthenticatedState => {
    if (!isLoadedState(state)) {
      throw new Error("Invalid state: loginWithPopupAction.done may only be applied when in a loaded state.");
    }

    return {
      ...state,
      popupOpen: false,
      user: user || undefined,
      isAuthenticated: Boolean(user),
    } as AuthenticatedState | UnauthenticatedState;
  })
  .case(handleRedirectCallbackAction.started, (state) => {
    if (!isLoadedState(state)) {
      throw new Error(
        "Invalid state: handleRedirectCallbackAction.started may only be applied when in a loaded state.",
      );
    }

    return {
      ...state,
      handlingRedirect: true,
    } as HandlingRedirectState;
  })
  .case(handleRedirectCallbackAction.done, (state, { result: user }): AuthenticatedState | UnauthenticatedState => {
    if (!isHandlingRedirectState(state)) {
      throw new Error(
        "Invalid state: handleRedirectCallbackAction.done may only be applied when in the handlingRedirect state.",
      );
    }

    return {
      ...state,
      user,
      isAuthenticated: Boolean(user),
      handlingRedirect: false,
    } as AuthenticatedState | UnauthenticatedState;
  })
  .build();
