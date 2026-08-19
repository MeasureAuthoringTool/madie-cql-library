import { LibraryListDTO } from "@madie/madie-models";

export function getTabStorageKey(tab: number): string {
  if (tab === 0) {
    return "ownedCqlLibrariesPageOptions";
  }
  if (tab === 1) {
    return "sharedCqlLibrariesPageOptions";
  }
  if (tab === 3) {
    return "reviewCqlLibrariesPageOptions";
  }
  return "allCqlLibrariesPageOptions";
}

// Resolves a (possibly nested, dot-delimited) property path, e.g. "librarySet.acls".
const resolvePath = (obj: any, path: string): any =>
  path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

/**
 * Sorts the "All Reviews" list on the client. The reviews endpoint returns the
 * full, unpaginated list, so all sorting happens here.
 * Todo We can remove this when backend implements pagination and sorting
 * @param libraries the full review list
 * @param sortInfo  the shared "<field>,<descendingBoolean>" sort string used by
 *                  the table headers (e.g. "cqlLibraryName,true"). When empty,
 *                  we default to Updated (lastModifiedAt) descending to match
 *                  the All Libraries tab.
 */
export function sortReviewLibraries(
  libraries: LibraryListDTO[],
  sortInfo?: string
): LibraryListDTO[] {
  const list = [...(libraries ?? [])];

  let field = "lastModifiedAt";
  let descending = true;
  if (sortInfo) {
    const [parsedField, parsedDescending] = sortInfo.split(",");
    field = parsedField;
    descending = parsedDescending === "true";
  }

  return list.sort((a, b) => {
    let aValue: any = resolvePath(a, field);
    let bValue: any = resolvePath(b, field);

    // The "Shared" column is an ACL array; sort by the number of shares.
    if (Array.isArray(aValue) || Array.isArray(bValue)) {
      aValue = Array.isArray(aValue) ? aValue.length : 0;
      bValue = Array.isArray(bValue) ? bValue.length : 0;
    }

    // Keep nullish values at the end regardless of direction.
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    let comparison: number;
    if (typeof aValue === "string" && typeof bValue === "string") {
      // ISO date strings (createdAt/lastModifiedAt) also sort correctly here.
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "boolean" || typeof bValue === "boolean") {
      comparison = Number(aValue) - Number(bValue);
    } else {
      comparison = (aValue as number) - (bValue as number);
    }

    return descending ? -comparison : comparison;
  });
}

// Fields the backend searches for each filter option (see the library service's
// SearchUtils). Mirrored here because the reviews endpoint returns the full,
// unpaginated list and the client does the filtering.
const REVIEW_SEARCH_FIELDS: Record<string, string> = {
  library: "cqlLibraryName",
  model: "model",
  version: "version",
  review: "reviewStatus",
};

// With no filter chosen the backend searches library name, model and version.
const DEFAULT_REVIEW_SEARCH_PROPERTIES = ["library", "model", "version"];

/**
 * Filters the "All Reviews" list on the client, matching what the backend does
 * for the other tabs: a case-insensitive "contains" against the field(s) behind
 * the selected filter, or across name/model/version when no filter is chosen.
 * Todo We can remove this when backend implements searching for this tab.
 *
 * @param libraries the full review list
 * @param searchCriteria the shared search criteria used by the other tabs
 */
export function filterReviewLibraries(
  libraries: LibraryListDTO[],
  searchCriteria?: {
    searchField?: string;
    optionalSearchProperties?: string[];
  }
): LibraryListDTO[] {
  const list = [...(libraries ?? [])];
  const searchField = searchCriteria?.searchField?.trim();
  if (!searchField) {
    return list;
  }

  const selected = (searchCriteria?.optionalSearchProperties ?? []).filter(
    (property) => !!property && property !== "-"
  );
  const properties = selected.length
    ? selected
    : DEFAULT_REVIEW_SEARCH_PROPERTIES;
  const needle = searchField.toLowerCase();

  return list.filter((library) =>
    properties.some((property) => {
      const field = REVIEW_SEARCH_FIELDS[property];
      if (!field) {
        return false;
      }
      const value = resolvePath(library, field);
      return value != null && String(value).toLowerCase().includes(needle);
    })
  );
}

/**
 * Pages the "All Reviews" list on the client, producing the same counts the
 * paginated tabs get from the backend so the Pagination control behaves
 * identically. A limit of "All" puts everything on one page.
 * Todo We can remove this when backend implements pagination for this tab.
 *
 * @param libraries the filtered, sorted review list
 * @param limit page size, or "All"
 * @param page zero-based page index
 */
export function paginateReviewLibraries(
  libraries: LibraryListDTO[],
  limit: string | number,
  page: number
): {
  content: LibraryListDTO[];
  totalPages: number;
  totalItems: number;
  visibleItems: number;
  offset: number;
} {
  const list = [...(libraries ?? [])];
  const totalItems = list.length;
  const pageSize =
    limit === "All" || !Number(limit) ? totalItems || 1 : Number(limit);
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  // Guard against a stale page index (e.g. after a search shrinks the list).
  const currentPage = Math.min(Math.max(page ?? 0, 0), totalPages - 1);
  const offset = currentPage * pageSize;
  const content = list.slice(offset, offset + pageSize);

  return {
    content,
    totalPages,
    totalItems,
    visibleItems: content.length,
    offset,
  };
}
