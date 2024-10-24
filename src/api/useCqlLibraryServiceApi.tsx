import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { CqlLibrary } from "@madie/madie-models";
import useOktaTokens from "../hooks/useOktaTokens";

export class CqlLibraryServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async fetchCqlLibraries(
    filterByCurrentUser: boolean,
    signal
  ): Promise<CqlLibrary[]> {
    try {
      const response = await axios.get<CqlLibrary[]>(
        `${this.baseUrl}/cql-libraries`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            currentUser: filterByCurrentUser,
          },
          signal: signal,
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch cql libraries`;
      throw new Error(message);
    }
  }

  async fetchCqlLibrary(id: string): Promise<CqlLibrary> {
    try {
      const response = await axios.get<CqlLibrary>(
        `${this.baseUrl}/cql-libraries/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch cql library`;
      throw new Error(message);
    }
  }

  async createCqlLibrary(cqlLibrary: CqlLibrary): Promise<void> {
    return await axios.post(`${this.baseUrl}/cql-libraries`, cqlLibrary, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async updateCqlLibrary(cqlLibrary: CqlLibrary): Promise<any> {
    return await axios.put(
      `${this.baseUrl}/cql-libraries/${cqlLibrary.id}`,
      cqlLibrary,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async createVersion(id: string, isMajor: boolean): Promise<void> {
    return await axios.put(
      `${this.baseUrl}/cql-libraries/version/${id}?isMajor=${isMajor}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async createDraft(
    cqlLibraryId: string,
    cqlLibraryName: string
  ): Promise<void> {
    return await axios.post(
      `${this.baseUrl}/cql-libraries/draft/${cqlLibraryId}`,
      { cqlLibraryName: cqlLibraryName },
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async deleteDraft(id: string): Promise<CqlLibrary> {
    return await axios.delete(`${this.baseUrl}/cql-libraries/${id}`, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }
}

export default function useCqlLibraryServiceApi() {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.cqlLibraryService;

  return new CqlLibraryServiceApi(baseUrl, getAccessToken);
}
