import {
  getTabStorageKey,
  sortReviewLibraries,
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
