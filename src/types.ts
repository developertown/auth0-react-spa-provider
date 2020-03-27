import { Auth0Client, Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { History } from "history";
import { createContext, Dispatch, ReactElement } from "react";

import { Auth0ProviderAction } from "./actions";

export interface TokenUser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface RouteState {
  targetUrl: string;
}

export interface Auth0ProviderProps extends Auth0ClientOptions {
  enableDebugLogging?: boolean;
  history: History;
  renderLoading?: (state: LoadingState | HandlingRedirectState) => ReactElement;
}

export type ProviderStateCallbacks = {
  loginWithPopup: Auth0Client["loginWithPopup"];
  handleRedirectCallback: Auth0Client["handleRedirectCallback"];
  getIdTokenClaims: Auth0Client["getIdTokenClaims"];
  loginWithRedirect: Auth0Client["loginWithRedirect"];
  getTokenSilently: Auth0Client["getTokenSilently"];
  getTokenWithPopup: Auth0Client["getTokenWithPopup"];
  logout: Auth0Client["logout"];
};

export type LoadingState = {
  loading: true;
  isAuthenticated: false;
  popupOpen: false;
  user: undefined;
  auth0Client: undefined;
  handlingRedirect: false;
};

export type UnauthenticatedState = ProviderStateCallbacks & {
  loading: boolean;
  isAuthenticated: false;
  popupOpen: boolean;
  user: undefined;
  auth0Client: Auth0Client;
  handlingRedirect: false;
};

export type AuthenticatedState = ProviderStateCallbacks & {
  loading: boolean;
  isAuthenticated: true;
  popupOpen: boolean;
  user: TokenUser;
  auth0Client: Auth0Client;
  handlingRedirect: false;
};

export type HandlingRedirectState = (UnauthenticatedState | AuthenticatedState) & {
  handlingRedirect: true;
};

export type Auth0ProviderState = LoadingState | UnauthenticatedState | AuthenticatedState | HandlingRedirectState;

export const isLoadingState = (state: Auth0ProviderState): state is LoadingState => state.loading;

export const isUnauthenticatedState = (state: Auth0ProviderState): state is LoadingState =>
  !state.loading && !state.isAuthenticated;

export const isAuthenticatedState = (state: Auth0ProviderState): state is LoadingState =>
  !state.loading && state.isAuthenticated;

export const isLoadedState = (state: Auth0ProviderState): state is AuthenticatedState | UnauthenticatedState =>
  isUnauthenticatedState(state) || isAuthenticatedState(state);

export const isHandlingRedirectState = (state: Auth0ProviderState): state is HandlingRedirectState =>
  isLoadedState(state) && "handlingRedirect" in state && state.handlingRedirect;

interface Auth0ProviderValues {
  state: Auth0ProviderState;
  dispatch: Dispatch<Auth0ProviderAction>;
}

export const Auth0ProviderContext = createContext<Auth0ProviderValues | undefined>(undefined);
