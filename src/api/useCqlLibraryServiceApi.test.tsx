import axios from "./axios-instance";
import { CqlLibraryServiceApi } from "./useCqlLibraryServiceApi";
import { OwnershipType } from "@madie/madie-models";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "mocked-token",
}));

jest.mock("./useServiceConfig", () => () => ({
  cqlLibraryService: {
    baseUrl: "http://localhost/api",
  },
}));

describe("useCqlLibraryServiceApi", () => {
  const mockBaseUrl = "http://localhost/api";
  const mockToken = "mocked-token";
  const mockGetAccessToken = jest.fn().mockReturnValue(mockToken);

  const service = new CqlLibraryServiceApi(mockBaseUrl, mockGetAccessToken);

  afterEach(() => {
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
      OwnershipType.OWNED,
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
          ownershipType: OwnershipType.OWNED,
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
      service.fetchCqlLibraries(OwnershipType.OWNED, 10, 0, "", "", undefined)
    ).rejects.toThrow("Unable to fetch Cql Libraries");
  });

  it("should rethrow if the error is 'canceled'", async () => {
    const error = new Error("canceled");
    (axios.put as jest.Mock).mockRejectedValue(error);

    await expect(
      service.fetchCqlLibraries(OwnershipType.OWNED, 10, 0, "", "", undefined)
    ).rejects.toThrow("canceled");
  });

  it("should return data when getLibrariesByLibrarySetId is successful", async () => {
    const mockResponse = {
      data: [{ id: "lib1", name: "Library One" }],
    };

    mockedAxios.put.mockResolvedValue(mockResponse as any);

    const result = await service.getLibrariesByLibrarySetId(
      "set-id-123",
      true,
      {
        searchField: "Diabetes",
      }
    );

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/byLibrarySetId`,
      { searchField: "Diabetes" },
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
        params: {
          librarySetId: "set-id-123",
          sortByLatestVersion: true,
        },
      }
    );

    expect(result).toEqual(mockResponse.data);
  });

  it("should handle missing optional params", async () => {
    const mockResponse = {
      data: [{ id: "lib2", name: "No Criteria Library" }],
    };

    mockedAxios.put.mockResolvedValue(mockResponse as any);

    const result = await service.getLibrariesByLibrarySetId("set-id-456");

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/byLibrarySetId`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
        params: {
          librarySetId: "set-id-456",
          sortByLatestVersion: undefined,
        },
      }
    );

    expect(result).toEqual(mockResponse.data);
  });

  it("should throw error when axios.put fails", async () => {
    const mockError = new Error("Network Error");
    mockedAxios.put.mockRejectedValue(mockError);

    await expect(
      service.getLibrariesByLibrarySetId("error-id")
    ).rejects.toThrow("Network Error");

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/byLibrarySetId`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
        params: {
          librarySetId: "error-id",
          sortByLatestVersion: undefined,
        },
      }
    );
  });
});
