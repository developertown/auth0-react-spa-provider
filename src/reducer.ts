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
  .case(auth0Loaded, (state, params): AuthenticatedState | UnauthenticatedState => {
    if (!isLoadingState(state)) {
      throw new Error("Invalid state: auth0Loaded may only be applied when in the loading state.");
    }

    const commonValues = {
      ...state,

      loading: false,
      auth0Client: params.auth0Client,
      popupOpen: false,

      loginWithPopup: params.auth0Client.loginWithPopup,
      loginWithRedirect: params.auth0Client.loginWithRedirect,
      getTokenWithPopup: params.auth0Client.getTokenWithPopup,
      getTokenSilently: params.auth0Client.getTokenSilently,
      getIdTokenClaims: params.auth0Client.getIdTokenClaims,
      handleRedirectCallback: params.auth0Client.handleRedirectCallback,
      logout: params.auth0Client.logout,
    };

    if (params.user) {
      return {
        ...commonValues,
        user: params.user,
        isAuthenticated: true,
      } as AuthenticatedState;
    } else {
      return {
        ...commonValues,
        user: undefined,
        isAuthenticated: false,
      } as UnauthenticatedState;
    }
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
  .case(loginWithPopupAction.done, (state, r): AuthenticatedState | UnauthenticatedState => {
    if (!isLoadedState(state)) {
      throw new Error("Invalid state: loginWithPopupAction.done may only be applied when in a loaded state.");
    }

    const { user } = r.result;
    if (user) {
      return {
        ...state,
        popupOpen: false,
        user,
        isAuthenticated: true,
      };
    } else {
      return {
        ...state,
        popupOpen: false,
        user,
        isAuthenticated: false,
      };
    }
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
  .case(handleRedirectCallbackAction.done, (state, r): AuthenticatedState | UnauthenticatedState => {
    if (!isHandlingRedirectState(state)) {
      throw new Error(
        "Invalid state: handleRedirectCallbackAction.done may only be applied when in the handlingRedirect state.",
      );
    }

    const { user } = r.result;

    if (user) {
      return {
        ...state,
        user,
        isAuthenticated: true,
        handlingRedirect: false,
      };
    } else {
      return {
        ...state,
        user: undefined,
        isAuthenticated: false,
        handlingRedirect: false,
      };
    }
  })
  .build();
