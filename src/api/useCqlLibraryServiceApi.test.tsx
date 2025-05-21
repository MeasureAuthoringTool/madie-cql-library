import axios from "./axios-instance";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "../api/useCqlLibraryServiceApi";
import { CqlLibrary } from "@madie/madie-models";

jest.mock("./axios-instance");
jest.mock("../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "mocked-token",
}));

jest.mock("./useServiceConfig", () => () => ({
  cqlLibraryService: {
    baseUrl: "http://localhost/api",
  },
}));

describe("CqlLibraryServiceApi - fetchCqlLibraries", () => {
  let service: CqlLibraryServiceApi;

  beforeEach(() => {
    service = useCqlLibraryServiceApi();
    jest.clearAllMocks();
  });

  it("should fetch CQL libraries with expected query params", async () => {
    const mockData = {
      libraries: [{ id: "lib1", name: "Test Library" }],
      total: 1,
    };
    (axios.get as jest.Mock).mockResolvedValue({ data: mockData });

    const result = await service.fetchCqlLibraries(
      true,
      10,
      0,
      "",
      "",
      undefined
    );

    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost/api/cql-libraries",
      {
        headers: { Authorization: "Bearer mocked-token" },
        params: {
          currentUser: true,
          limit: 10,
          page: 0,
          searchCriteria: undefined,
          sortInfo: undefined,
        },
        signal: undefined,
      }
    );

    expect(result).toEqual(mockData);
  });

  it("should throw an error when axios fails", async () => {
    (axios.get as jest.Mock).mockRejectedValue(
      new Error("Something went wrong")
    );

    await expect(
      service.fetchCqlLibraries(true, 10, 0, "", "", undefined)
    ).rejects.toThrow("Unable to fetch Cql Libraries");
  });

  it("should rethrow if the error is 'canceled'", async () => {
    const error = new Error("canceled");
    (axios.get as jest.Mock).mockRejectedValue(error);

    await expect(
      service.fetchCqlLibraries(true, 10, 0, "", "", undefined)
    ).rejects.toThrow("canceled");
  });
});
