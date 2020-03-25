import { auth0Loaded, Auth0LoadedParams, handleRedirectCallbackAction, loginWithPopupAction } from "../actions";
import { auth0ProviderStateReducer } from "../reducer";
import {
  AuthenticatedState,
  HandlingRedirectState,
  isAuthenticatedState,
  isLoadedState,
  isUnauthenticatedState,
  LoadingState,
  TokenUser,
  UnauthenticatedState,
} from "../types";

const createInitialState = (): LoadingState => ({
  loading: true,
  isAuthenticated: false,
  popupOpen: false,
  user: undefined,
  auth0Client: undefined,
  handlingRedirect: false,
});

const createFakeUnauthenticatedState = (): UnauthenticatedState => ({
  isAuthenticated: false,
  loading: false,
  loginWithPopup: jest.fn(),
  handleRedirectCallback: jest.fn(),
  handlingRedirect: false,
  user: undefined,
  popupOpen: false,
  logout: jest.fn(),
  getIdTokenClaims: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  auth0Client: {}, // new Auth0Client({ domain: "xyz", client_id: "pdq" }),
  getTokenSilently: jest.fn(),
  getTokenWithPopup: jest.fn(),
  loginWithRedirect: jest.fn(),
});

const createFakeAuthenticatedState = (): AuthenticatedState => ({
  ...createFakeUnauthenticatedState(),
  isAuthenticated: true,
  user: jest.fn(),
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
        ).toThrowErrorMatchingSnapshot();
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
        ).toThrowErrorMatchingSnapshot();
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
        ).toThrowErrorMatchingSnapshot();
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
        ).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe("auth0Loaded", () => {
    it("throws an error if the state is not in the initial loading state", () => {
      const origState = createFakeAuthenticatedState();

      expect(() =>
        auth0ProviderStateReducer(origState, auth0Loaded({} as Auth0LoadedParams)),
      ).toThrowErrorMatchingSnapshot();
    });

    it("sets up the core values properly", () => {
      const origState = createInitialState();

      const user: TokenUser = {};
      const auth0Client = {};
      const handleRedirectCallback = jest.fn();
      const loginWithPopup = jest.fn();

      const newState = auth0ProviderStateReducer(
        origState,
        auth0Loaded({
          user,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          auth0Client,
          handleRedirectCallback,
          loginWithPopup,
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
      const auth0Client = {};
      const handleRedirectCallback = jest.fn();
      const loginWithPopup = jest.fn();

      const newState = auth0ProviderStateReducer(
        origState,
        auth0Loaded({
          user,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          auth0Client,
          handleRedirectCallback,
          loginWithPopup,
        }),
      );

      expect(isAuthenticatedState(newState)).toBeTruthy();
    });

    it("returns an unauthenticated state when appropriate", () => {
      const origState = createInitialState();

      const user = undefined;
      const auth0Client = {};
      const handleRedirectCallback = jest.fn();
      const loginWithPopup = jest.fn();

      const newState = auth0ProviderStateReducer(
        origState,
        auth0Loaded({
          user,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          auth0Client,
          handleRedirectCallback,
          loginWithPopup,
        }),
      );

      expect(isUnauthenticatedState(newState)).toBeTruthy();
    });
  });
});
