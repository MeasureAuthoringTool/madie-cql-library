import { Model } from "./Model";

export default interface CqlLibrary {
  id: string;
  cqlLibraryName: string;
  model: Model | "";
  cql: string;
  version: string;
  draft: boolean;
  groupId: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  publisher?: string;
  description?: string;
  experimental?: boolean;
}
