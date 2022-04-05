import { Model } from "./Model";

export default interface CqlLibrary {
  id: string;
  cqlLibraryName: string;
  model: Model | "";
  cql: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
}
