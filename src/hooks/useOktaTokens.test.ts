import useOktaTokens from "./useOktaTokens";

const idTokenObj = {
  authorizeUrl: "authorize.url",
  claims: {
    sub: "testuser@test.com",
    name: "Test User",
  },
  idToken: "test.id.jwt",
};

const accessTokenObj = {
  authorizeUrl: "authorize.url",
  claims: {
    sub: "testuser@test.com",
  },
  accessToken: "test.access.jwt",
};

const okta_token_storage = {
  idToken: idTokenObj,
  accessToken: accessTokenObj,
};

describe("useOktaTokens", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify(okta_token_storage)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  beforeEach(() => {
    jest.resetAllMocks();
    (window.localStorage.getItem as jest.Mock).mockImplementation(() =>
      JSON.stringify(okta_token_storage)
    );
  });

  it("should return four functions", () => {
    const oktaTokens = useOktaTokens();
    expect(oktaTokens.getIdTokenObj).toBeTruthy();
    expect(oktaTokens.getIdToken).toBeTruthy();
    expect(oktaTokens.getAccessTokenObj).toBeTruthy();
    expect(oktaTokens.getAccessToken).toBeTruthy();
  });

  it("should return an idToken object", () => {
    const { getIdTokenObj } = useOktaTokens();
    expect(getIdTokenObj()).toEqual(idTokenObj);
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should return an idToken", () => {
    const { getIdToken } = useOktaTokens();
    expect(getIdToken()).toEqual("test.id.jwt");
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should return an accessToken object", () => {
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toEqual(accessTokenObj);
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should return an accessToken", () => {
    const { getAccessToken } = useOktaTokens();
    expect(getAccessToken()).toEqual("test.access.jwt");
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should gracefully handle a malformed item", () => {
    jest.resetAllMocks();
    (window.localStorage.getItem as jest.Mock).mockImplementation(
      () => "THIS IS NOT JSON!"
    );
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should gracefully handle a null storage item", () => {
    jest.resetAllMocks();
    (window.localStorage.getItem as jest.Mock).mockImplementation(() => null);
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should gracefully handle an undefined storage item", () => {
    jest.resetAllMocks();
    (window.localStorage.getItem as jest.Mock).mockImplementation(
      () => undefined
    );
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should gracefully handle an missing item field", () => {
    jest.resetAllMocks();
    (window.localStorage.getItem as jest.Mock).mockImplementation(() =>
      JSON.stringify({})
    );
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should use a provided storage key instead of the default", () => {
    const { getAccessTokenObj } = useOktaTokens("some-storage-key");
    expect(getAccessTokenObj()).toBeTruthy();
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "some-storage-key"
    );
  });
});
