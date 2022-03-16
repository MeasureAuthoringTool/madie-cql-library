import { Model } from "./Model";

export default interface CqlLibrary {
  id: string;
  cqlLibraryName: string;
  model: Model | "";
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
}
