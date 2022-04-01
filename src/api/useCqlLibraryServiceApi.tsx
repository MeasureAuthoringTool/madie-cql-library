import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import useOktaTokens from "../hooks/useOktaTokens";
import CqlLibrary from "../models/CqlLibrary";

export class CqlLibraryServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async fetchCqlLibraries(filterByCurrentUser: boolean): Promise<CqlLibrary[]> {
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
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch cql libraries`;
      console.error(message);
      console.error(err);
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
}

export default function useCqlLibraryServiceApi() {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.cqlLibraryService;

  return new CqlLibraryServiceApi(baseUrl, getAccessToken);
}
