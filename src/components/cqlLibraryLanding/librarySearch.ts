import { camelCase, trim } from "lodash";

export enum LibrarySource {
  ALL = "ALL",
  EXTERNAL = "EXTERNAL",
  MADIE = "MADIE",
}

export interface LibrarySearchCriteria {
  searchField?: string;
  optionalSearchProperties?: string[];
  model?: string;
  draft?: boolean;
  librarySource?: LibrarySource;
}

export function getLibrarySearchCriteria(
  criteria: LibrarySearchCriteria = {},
  activeTab: number,
  librarySource: LibrarySource
): LibrarySearchCriteria {
  const { librarySource: _source, ...searchCriteria } = criteria;
  let properties = (criteria.optionalSearchProperties ?? [])
    .map((property) => trim(property))
    .filter((property) => property && property !== "-")
    .map((property) => camelCase(property));

  if (activeTab === 2 && librarySource === LibrarySource.EXTERNAL) {
    properties = properties.filter((property) => property !== "model");
    if (!properties.length && searchCriteria.searchField) {
      properties = ["library", "version"];
    }
  }

  return {
    ...searchCriteria,
    optionalSearchProperties: properties,
    ...(activeTab === 2 ? { librarySource } : {}),
  };
}
