import axios from "./axios-instance";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "../api/useCqlLibraryServiceApi";
import { ViewScope } from "@madie/madie-models";

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
    (axios.put as jest.Mock).mockResolvedValue({ data: mockData });

    const criteriaWithSearch = {
      searchField: "Heart Failure",
      optionalSearchProperties: ["Status"],
    };

    const result = await service.fetchCqlLibraries(
      ViewScope.OWNED,
      10,
      0,
      criteriaWithSearch,
      "",
      undefined
    );

    expect(axios.put).toHaveBeenCalledWith(
      "http://localhost/api/cql-libraries/searches",
      criteriaWithSearch,
      {
        headers: { Authorization: "Bearer mocked-token" },
        params: {
          viewScope: ViewScope.OWNED,
          limit: 10,
          page: 0,
          sortInfo: undefined,
        },
        signal: undefined,
      }
    );

    expect(result).toEqual(mockData);
  });

  it("should throw an error when axios fails", async () => {
    (axios.put as jest.Mock).mockRejectedValue(
      new Error("Something went wrong")
    );

    await expect(
      service.fetchCqlLibraries(ViewScope.OWNED, 10, 0, "", "", undefined)
    ).rejects.toThrow("Unable to fetch Cql Libraries");
  });

  it("should rethrow if the error is 'canceled'", async () => {
    const error = new Error("canceled");
    (axios.put as jest.Mock).mockRejectedValue(error);

    await expect(
      service.fetchCqlLibraries(ViewScope.OWNED, 10, 0, "", "", undefined)
    ).rejects.toThrow("canceled");
  });
});
