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
