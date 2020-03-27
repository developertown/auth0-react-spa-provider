import * as Auth0 from "@auth0/auth0-spa-js";
import { auth0Loaded, handleRedirectCallbackAction, loginWithPopupAction } from "../actions";
import { auth0ProviderStateReducer } from "../reducer";
import {
  HandlingRedirectState,
  isAuthenticatedState,
  isLoadedState,
  isUnauthenticatedState,
  LoadingState,
  TokenUser,
  UnauthenticatedState,
} from "../types";

jest.mock("@auth0/auth0-spa-js");

const createFakeAuth0Client = (): Auth0.Auth0Client =>
  new Auth0.Auth0Client({
    domain: "",
    // eslint-disable-next-line @typescript-eslint/camelcase
    client_id: "",
  });

const createInitialState = (): LoadingState => ({
  loading: true,
  isAuthenticated: false,
  popupOpen: false,
  user: undefined,
  auth0Client: undefined,
  handlingRedirect: false,
});

const createFakeUnauthenticatedState = (
  auth0Client: Auth0.Auth0Client = createFakeAuth0Client(),
): UnauthenticatedState => ({
  isAuthenticated: false,
  loading: false,
  loginWithPopup: jest.fn(),
  handleRedirectCallback: jest.fn(),
  handlingRedirect: false,
  user: undefined,
  popupOpen: false,
  auth0Client,
  loginWithRedirect: auth0Client.loginWithRedirect.bind(auth0Client),
  getTokenWithPopup: auth0Client.getTokenWithPopup.bind(auth0Client),
  getTokenSilently: auth0Client.getTokenSilently.bind(auth0Client),
  getIdTokenClaims: auth0Client.getIdTokenClaims.bind(auth0Client),
  logout: auth0Client.logout.bind(auth0Client),
});

const createHandlingRedirectState = (): HandlingRedirectState =>
  ({
    ...createFakeUnauthenticatedState(),
    handlingRedirect: true,
  } as HandlingRedirectState);

describe("reducer", () => {
  describe("loginWithPopupAction", () => {
    describe("started", () => {
      it("flips the popupOpen flag to true", () => {
        const origState = createFakeUnauthenticatedState();
        const newState = auth0ProviderStateReducer(origState, loginWithPopupAction.started());
        expect(newState.popupOpen).toBeTruthy();
      });

      it("throws an error if the auth0 state is not yet fully loaded", () => {
        const origState = createInitialState();
        expect(() =>
          auth0ProviderStateReducer(origState, loginWithPopupAction.started()),
        ).toThrowErrorMatchingInlineSnapshot(
          `"Invalid state: loginWithPopupAction.started may only be applied when in a loaded state."`,
        );
      });
    });

    describe("done", () => {
      it("flips the popupOpen flag to false", () => {
        const origState = {
          ...createFakeUnauthenticatedState(),
          popupOpen: true,
        };
        const newState = auth0ProviderStateReducer(
          origState,
          loginWithPopupAction.done({ result: { user: undefined } }),
        );
        expect(newState.popupOpen).toBeFalsy();
      });

      it("gets back an authenticated state if a user is provided", () => {
        const origState = {
          ...createFakeUnauthenticatedState(),
          popupOpen: true,
        };
        const newState = auth0ProviderStateReducer(origState, loginWithPopupAction.done({ result: { user: {} } }));
        expect(isAuthenticatedState(newState)).toBeTruthy();
      });

      it("throws an error if the auth0 state is not yet fully loaded", () => {
        const origState = createInitialState();
        expect(() =>
          auth0ProviderStateReducer(origState, loginWithPopupAction.done({ result: { user: undefined } })),
        ).toThrowErrorMatchingInlineSnapshot(
          `"Invalid state: loginWithPopupAction.done may only be applied when in a loaded state."`,
        );
      });
    });
  });

  describe("handleRedirectCallbackAction", () => {
    describe("started", () => {
      it("flips the handlingRedirect flag to true", () => {
        const origState = createFakeUnauthenticatedState();
        const newState = auth0ProviderStateReducer(origState, handleRedirectCallbackAction.started());

        expect(isLoadedState(newState) && newState.handlingRedirect).toBeTruthy();
      });

      it("throws an error if the auth0 state is not yet fully loaded", () => {
        const origState = createInitialState();
        expect(() =>
          auth0ProviderStateReducer(origState, handleRedirectCallbackAction.started()),
        ).toThrowErrorMatchingInlineSnapshot(
          `"Invalid state: handleRedirectCallbackAction.started may only be applied when in a loaded state."`,
        );
      });
    });

    describe("done", () => {
      it("flips the handlingRedirect flag to false", () => {
        const origState = createHandlingRedirectState();
        const newState = auth0ProviderStateReducer(
          origState,
          handleRedirectCallbackAction.done({ result: { user: undefined } }),
        );
        expect(newState.handlingRedirect).toBeFalsy();
      });

      it("gets back an authenticated state if a user is provided", () => {
        const origState = createHandlingRedirectState();
        const newState = auth0ProviderStateReducer(
          origState,
          handleRedirectCallbackAction.done({ result: { user: {} } }),
        );
        expect(isAuthenticatedState(newState)).toBeTruthy();
      });

      it("throws an error if the auth0 state is not in the handling redirect state", () => {
        const origState = createFakeUnauthenticatedState();
        expect(() =>
          auth0ProviderStateReducer(origState, handleRedirectCallbackAction.done({ result: { user: undefined } })),
        ).toThrowErrorMatchingInlineSnapshot(
          `"Invalid state: handleRedirectCallbackAction.done may only be applied when in the handlingRedirect state."`,
        );
      });
    });
  });

  describe("auth0Loaded", () => {
    it("sets up the core values properly", () => {
      const origState = createInitialState();

      const user: TokenUser = {};
      const auth0Client = createFakeAuth0Client();
      const handleRedirectCallback = jest.fn();
      const loginWithPopup = jest.fn();

      const newState = auth0ProviderStateReducer(
        origState,
        auth0Loaded.done({
          result: {
            user,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            auth0Client,
            handleRedirectCallback,
            loginWithPopup,
          },
        }),
      );

      expect(isLoadedState(newState)).toBeTruthy();
      expect(newState.handlingRedirect).toBeFalsy();
      expect(newState.popupOpen).toBeFalsy();
      expect(newState.handlingRedirect).toBeFalsy();
      expect(newState.loading).toBeFalsy();

      expect(isLoadedState(newState) && newState.auth0Client).toEqual(auth0Client);
      expect(isLoadedState(newState) && newState.handleRedirectCallback).toEqual(handleRedirectCallback);
      expect(isLoadedState(newState) && newState.loginWithPopup).toEqual(loginWithPopup);
    });

    it("returns an authenticated state when appropriate", () => {
      const origState = createInitialState();

      const user: TokenUser = {};
      const auth0Client = createFakeAuth0Client();
      const handleRedirectCallback = jest.fn();
      const loginWithPopup = jest.fn();

      const newState = auth0ProviderStateReducer(
        origState,
        auth0Loaded.done({
          result: {
            user,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            auth0Client,
            handleRedirectCallback,
            loginWithPopup,
          },
        }),
      );

      expect(isAuthenticatedState(newState)).toBeTruthy();
    });

    it("returns an unauthenticated state when appropriate", () => {
      const origState = createInitialState();

      const user = undefined;
      const auth0Client = createFakeAuth0Client();
      const handleRedirectCallback = jest.fn();
      const loginWithPopup = jest.fn();

      const newState = auth0ProviderStateReducer(
        origState,
        auth0Loaded.done({
          result: {
            user,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            auth0Client,
            handleRedirectCallback,
            loginWithPopup,
          },
        }),
      );

      expect(isUnauthenticatedState(newState)).toBeTruthy();
    });
  });
});
