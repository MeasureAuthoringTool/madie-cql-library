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

  it("should lock library successfully", async () => {
    const response = {
      locked: false,
      lockedBy: "test.user",
      lockedId: "libraryId",
    };
    axios.put = jest.fn().mockResolvedValueOnce({ data: response });

    const result = await service.lockLibrary("libraryId");

    expect(axios.put).toBeCalledTimes(1);
    expect(axios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/libraryId/lock`,
      null,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      }
    );
    expect(result).toBe(response);
  });

  it("should handle lock library failure", async () => {
    const response = {
      status: 400,
      error: "Bad Request",
      message: "Error",
    };

    axios.put = jest.fn().mockRejectedValueOnce({ error: response });

    try {
      const result = await service.lockLibrary("libraryId");
      expect(axios.put).toBeCalledTimes(1);
      expect(axios.put).toHaveBeenCalledWith(
        `${mockBaseUrl}/cql-libraries/libraryId/lock`,
        null,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).not.toBe(response);
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  it("should unlock library successfully", async () => {
    const response = {
      locked: false,
    };
    axios.delete = jest.fn().mockResolvedValueOnce({ data: response });

    const result = await service.unlockLibrary("libraryId");
    expect(axios.delete).toBeCalledTimes(1);
    expect(axios.delete).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/libraryId/lock`,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      }
    );
    expect(result).toBe(response);
  });

  it("should handle lock library failure", async () => {
    const response = {
      status: 400,
      error: "Bad Request",
      message: "Error",
    };

    axios.delete = jest.fn().mockRejectedValueOnce({ error: response });

    try {
      const result = await service.unlockLibrary("libraryId");
      expect(axios.delete).toBeCalledTimes(1);
      expect(axios.delete).toHaveBeenCalledWith(
        `${mockBaseUrl}/cql-libraries/libraryId/lock`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).not.toBe(response);
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  it("should transfer library successfully", async () => {
    mockedAxios.put.mockResolvedValueOnce({
      status: 200,
      data: [],
    });

    const result = await service.transferLibraries(
      ["libraryId"],
      "harpId",
      true
    );

    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/transfer`,
      ["libraryId"],
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          harpId: `harpId`,
        },
        params: {
          retainShareAccess: true,
        },
      }
    );

    expect(result.status).toBe(200);
    expect(result.data).toEqual([]);
  });

  it("should handle partial transfer (206 Partial Content) response", async () => {
    const partialResponse = {
      data: ["library1"],
      status: 206,
    };

    axios.put = jest.fn().mockResolvedValueOnce(partialResponse);

    const result = await service.transferLibraries(
      ["library1", "library2"],
      "harpId",
      true
    );

    expect(axios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/transfer`,
      ["library1", "library2"],
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          harpId: `harpId`,
        },
        params: {
          retainShareAccess: true,
        },
      }
    );

    expect(result.status).toBe(206);
    expect(result.data).toEqual(["library1"]);
  });

  it("should throw an error when transferLibraries fails", async () => {
    axios.put = jest.fn().mockRejectedValueOnce(new Error("Network Error"));

    await expect(
      service.transferLibraries(["libraryId"], "harpId", true)
    ).rejects.toThrow("Error: Network Error");

    expect(axios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/transfer`,
      ["libraryId"],
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          harpId: `harpId`,
        },
        params: {
          retainShareAccess: true,
        },
      }
    );
  });

  it("should fetch library history successfully", async () => {
    const mockLibrary = { id: "123" };
    const mockData = [
      {
        actionType: "CREATE",
        additionalActionMessage: "Initial creation",
        performedAt: "2025-10-01T12:00:00Z",
        performedBy: "user123",
      },
    ];

    axios.get = jest.fn().mockResolvedValueOnce({ data: mockData });

    const result = await service.getLibraryHistory(mockLibrary);

    expect(axios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/123/history`,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      }
    );
    expect(result).toEqual(mockData);
  });

  it("should throw error when fetching library history fails", async () => {
    const mockLibrary = { id: "123" };
    const errorMessage = "Network Error";

    axios.get = jest.fn().mockRejectedValueOnce({ message: errorMessage });

    await expect(service.getLibraryHistory(mockLibrary)).rejects.toThrow(
      errorMessage
    );
  });

  it("should throw default error message if error has no message", async () => {
    const mockLibrary = { id: "123" };

    axios.get = jest.fn().mockRejectedValueOnce({});

    await expect(service.getLibraryHistory(mockLibrary)).rejects.toThrow(
      "Failed to fetch library history"
    );
  });
});
