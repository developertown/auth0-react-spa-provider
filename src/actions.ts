import Auth0Client from "@auth0/auth0-spa-js/dist/typings/Auth0Client";
import actionCreatorFactory from "typescript-fsa";

import { TokenUser } from "./types";

const createAction = actionCreatorFactory("AUTH0_PROVIDER");

export type Auth0LoadedParams = {
  auth0Client: Auth0Client;
  user?: TokenUser;
  handleRedirectCallback: Auth0Client["handleRedirectCallback"];
  loginWithPopup: Auth0Client["loginWithPopup"];
};
export const auth0Loaded = createAction<Auth0LoadedParams>("LOADED");

export type LoginWithPopupActionResult = {
  user?: TokenUser;
};
export const loginWithPopupAction = createAction.async<void, LoginWithPopupActionResult>("LOGIN_WITH_POPUP");

export type HandleRedirectCallbackResult = {
  user?: TokenUser;
};
export const handleRedirectCallbackAction = createAction.async<void, HandleRedirectCallbackResult>(
  "HANDLE_REDIRECT_CALLBACK",
);

export type Auth0ProviderAction =
  | ReturnType<typeof auth0Loaded>
  | ReturnType<typeof loginWithPopupAction.started>
  | ReturnType<typeof loginWithPopupAction.done>
  | ReturnType<typeof loginWithPopupAction.failed>
  | ReturnType<typeof handleRedirectCallbackAction.started>
  | ReturnType<typeof handleRedirectCallbackAction.done>
  | ReturnType<typeof handleRedirectCallbackAction.failed>;
