import * as React from "react";
import { CqlLibraryServiceApi } from "./useCqlLibraryServiceApi";
import axios from "axios";
import { CqlLibrary, Model } from "@madie/madie-models";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const cqlLibrary: CqlLibrary = {
  id: "test",
  cqlLibraryName: "test",
  cqlErrors: true,
  cql: "test",
  model: Model.QICORE,
  version: "test",
  draft: true,
  groupId: "test",
  createdAt: "test",
  createdBy: "test",
  lastModifiedAt: "test",
  lastModifiedBy: "test",
  publisher: "test",
  description: "test",
  experimental: true,
};
jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

describe("useCqlLibraryServiceApi", () => {
  let cqlLibraryService: CqlLibraryServiceApi;
  beforeEach(() => {
    const getAccessToken = jest.fn();
    cqlLibraryService = new CqlLibraryServiceApi("test.url", getAccessToken);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetchCqlLibraries success", async () => {
    const resp = { status: 200, data: [] };
    mockedAxios.get.mockResolvedValue(resp);
    await cqlLibraryService.fetchCqlLibraries(false);
    expect(mockedAxios.get).toBeCalledTimes(1);
  });

  it("fetchCqlLibraries failure", async () => {
    const resp = { status: 404, data: [] };
    mockedAxios.get.mockRejectedValue(resp);

    try {
      await cqlLibraryService.fetchCqlLibraries(false);
    } catch (error) {
      expect(error.message).toEqual("Unable to fetch cql libraries");
    }
  });

  it("createVersion success", async () => {
    const resp = { status: 200 };
    mockedAxios.put.mockResolvedValue(resp);
    await cqlLibraryService.createVersion("test", false);
    expect(mockedAxios.put).toBeCalledTimes(1);
  });

  it("createDraft success", async () => {
    const resp = { status: 200 };
    mockedAxios.post.mockResolvedValue(resp);
    await cqlLibraryService.createDraft(cqlLibrary);
    expect(mockedAxios.post).toBeCalledTimes(1);
  });
});
