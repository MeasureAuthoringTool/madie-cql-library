import {
  getTabStorageKey,
  sortReviewLibraries,
  filterReviewLibraries,
  paginateReviewLibraries,
} from "./cqlLibraryLandingUtils";
import { LibraryListDTO } from "@madie/madie-models";

describe("getTabStorageKey", () => {
  it("maps each tab index to its storage key", () => {
    expect(getTabStorageKey(0)).toBe("ownedCqlLibrariesPageOptions");
    expect(getTabStorageKey(1)).toBe("sharedCqlLibrariesPageOptions");
    expect(getTabStorageKey(2)).toBe("allCqlLibrariesPageOptions");
    expect(getTabStorageKey(3)).toBe("reviewCqlLibrariesPageOptions");
  });
});

describe("sortReviewLibraries", () => {
  const libraries = [
    {
      id: "a",
      cqlLibraryName: "Beta",
      lastModifiedAt: "2026-02-01T00:00:00Z",
      draft: false,
      librarySet: { acls: [{ userId: "u1" }] },
    },
    {
      id: "b",
      cqlLibraryName: "Alpha",
      lastModifiedAt: "2026-03-01T00:00:00Z",
      draft: true,
      librarySet: { acls: [] },
    },
    {
      id: "c",
      cqlLibraryName: "Gamma",
      lastModifiedAt: "2026-01-01T00:00:00Z",
      draft: false,
      librarySet: undefined,
    },
  ] as unknown as LibraryListDTO[];

  it("defaults to Updated (lastModifiedAt) descending when no sortInfo is provided", () => {
    const result = sortReviewLibraries(libraries);
    expect(result.map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("does not mutate the original array", () => {
    const original = [...libraries];
    sortReviewLibraries(libraries, "cqlLibraryName,false");
    expect(libraries).toEqual(original);
  });

  it("sorts strings ascending", () => {
    const result = sortReviewLibraries(libraries, "cqlLibraryName,false");
    expect(result.map((l) => l.cqlLibraryName)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("sorts strings descending", () => {
    const result = sortReviewLibraries(libraries, "cqlLibraryName,true");
    expect(result.map((l) => l.cqlLibraryName)).toEqual([
      "Gamma",
      "Beta",
      "Alpha",
    ]);
  });

  it("sorts booleans (draft status)", () => {
    const result = sortReviewLibraries(libraries, "draft,true");
    // Only "b" is a draft, so it comes first when descending.
    expect(result[0].id).toBe("b");
  });

  it("sorts by the number of acls for the nested Shared column", () => {
    const result = sortReviewLibraries(libraries, "librarySet.acls,true");
    // "a" has 1 acl, the others have 0/undefined.
    expect(result[0].id).toBe("a");
  });

  it("handles a null/empty input gracefully", () => {
    expect(sortReviewLibraries(null as any)).toEqual([]);
    expect(sortReviewLibraries([])).toEqual([]);
  });
});

describe("filterReviewLibraries", () => {
  const libraries = [
    {
      id: "1",
      cqlLibraryName: "AlphaLib",
      model: "QI-Core v4.1.1",
      version: "1.0.000",
      reviewStatus: "Ready",
    },
    {
      id: "2",
      cqlLibraryName: "BetaLib",
      model: "QDM v5.6",
      version: "2.3.000",
      reviewStatus: "In Progress",
    },
    {
      id: "3",
      cqlLibraryName: "GammaHelper",
      model: "QI-Core v4.1.1",
      version: "1.0.000",
      reviewStatus: "Complete",
    },
  ] as unknown as LibraryListDTO[];

  const ids = (result: LibraryListDTO[]) => result.map((lib) => lib.id);

  it("returns everything when there is no search field", () => {
    expect(ids(filterReviewLibraries(libraries, undefined))).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(
      ids(filterReviewLibraries(libraries, { searchField: "  " }))
    ).toEqual(["1", "2", "3"]);
  });

  it("matches the library name case-insensitively", () => {
    const result = filterReviewLibraries(libraries, {
      searchField: "betalib",
      optionalSearchProperties: ["library"],
    });
    expect(ids(result)).toEqual(["2"]);
  });

  it("matches partial values", () => {
    const result = filterReviewLibraries(libraries, {
      searchField: "Lib",
      optionalSearchProperties: ["library"],
    });
    expect(ids(result)).toEqual(["1", "2"]);
  });

  it("filters by review status", () => {
    const result = filterReviewLibraries(libraries, {
      searchField: "In Progress",
      optionalSearchProperties: ["review"],
    });
    expect(ids(result)).toEqual(["2"]);
  });

  it("filters by model and version", () => {
    expect(
      ids(
        filterReviewLibraries(libraries, {
          searchField: "QDM",
          optionalSearchProperties: ["model"],
        })
      )
    ).toEqual(["2"]);
    expect(
      ids(
        filterReviewLibraries(libraries, {
          searchField: "2.3",
          optionalSearchProperties: ["version"],
        })
      )
    ).toEqual(["2"]);
  });

  it("searches name, model and version when no filter is chosen", () => {
    // Mirrors the backend default; review status is not part of it.
    expect(
      ids(filterReviewLibraries(libraries, { searchField: "QDM" }))
    ).toEqual(["2"]);
    expect(
      ids(filterReviewLibraries(libraries, { searchField: "Complete" }))
    ).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    const result = filterReviewLibraries(libraries, {
      searchField: "nothing-here",
      optionalSearchProperties: ["library"],
    });
    expect(result).toEqual([]);
  });

  it("does not mutate the source list", () => {
    const source = [...libraries];
    filterReviewLibraries(libraries, { searchField: "Alpha" });
    expect(libraries).toEqual(source);
  });
});

describe("paginateReviewLibraries", () => {
  const libraries = Array.from({ length: 12 }, (_, index) => ({
    id: `lib-${index + 1}`,
  })) as unknown as LibraryListDTO[];

  it("returns the requested page and backend-shaped counts", () => {
    const first = paginateReviewLibraries(libraries, 10, 0);
    expect(first.content).toHaveLength(10);
    expect(first.content[0].id).toBe("lib-1");
    expect(first.totalPages).toBe(2);
    expect(first.totalItems).toBe(12);
    expect(first.visibleItems).toBe(10);
    expect(first.offset).toBe(0);

    const second = paginateReviewLibraries(libraries, 10, 1);
    expect(second.content.map((lib) => lib.id)).toEqual(["lib-11", "lib-12"]);
    expect(second.visibleItems).toBe(2);
    expect(second.offset).toBe(10);
  });

  it("puts everything on one page for a limit of All", () => {
    const result = paginateReviewLibraries(libraries, "All", 0);
    expect(result.content).toHaveLength(12);
    expect(result.totalPages).toBe(1);
    expect(result.offset).toBe(0);
  });

  it("clamps a stale page index back into range", () => {
    // e.g. sitting on page 2 when a search shrinks the list to one page.
    const result = paginateReviewLibraries(libraries.slice(0, 3), 10, 5);
    expect(result.content).toHaveLength(3);
    expect(result.totalPages).toBe(1);
    expect(result.offset).toBe(0);
  });

  it("handles an empty list without dividing by zero", () => {
    const result = paginateReviewLibraries([], 10, 0);
    expect(result.content).toEqual([]);
    expect(result.totalPages).toBe(1);
    expect(result.totalItems).toBe(0);
    expect(result.visibleItems).toBe(0);
  });

  it("does not mutate the source list", () => {
    const source = [...libraries];
    paginateReviewLibraries(libraries, 5, 1);
    expect(libraries).toEqual(source);
  });
});
