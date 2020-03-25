import * as index from "../index";

describe("index", () => {
  it("doesn't over-export", () => {
    const allowedExports = [
      "useAuth0",
      "Auth0Provider",
      "isAuthenticatedState",
      "isHandlingRedirectState",
      "isLoadedState",
      "isLoadingState",
      "isUnauthenticatedState",
    ];

    expect(Object.keys(index).sort()).toEqual(allowedExports.sort());
  });
});
