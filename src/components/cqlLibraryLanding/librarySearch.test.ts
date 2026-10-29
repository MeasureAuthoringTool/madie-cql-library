import { getLibrarySearchCriteria, LibrarySource } from "./librarySearch";

describe("getLibrarySearchCriteria", () => {
  it.each(Object.values(LibrarySource))(
    "includes the selected %s source only on All Libraries",
    (librarySource) => {
      expect(getLibrarySearchCriteria({}, 2, librarySource)).toEqual({
        optionalSearchProperties: [],
        librarySource,
      });
      for (const tab of [0, 1, 3, 4]) {
        expect(
          getLibrarySearchCriteria({ librarySource }, tab, librarySource)
        ).toEqual({ optionalSearchProperties: [] });
      }
    }
  );

  it("normalizes every search property instead of dropping all but the first", () => {
    const criteria = {
      searchField: "4.1",
      optionalSearchProperties: [" Library ", "-", " ", "Version", "Model"],
    };
    expect(getLibrarySearchCriteria(criteria, 2, LibrarySource.ALL)).toEqual({
      searchField: "4.1",
      optionalSearchProperties: ["library", "version", "model"],
      librarySource: LibrarySource.ALL,
    });
    expect(criteria.optionalSearchProperties).toEqual([
      " Library ",
      "-",
      " ",
      "Version",
      "Model",
    ]);
  });

  it.each([
    { optionalSearchProperties: [] },
    { optionalSearchProperties: ["model"] },
    { optionalSearchProperties: ["library", "version", "model"] },
  ])(
    "excludes Model from external search criteria $optionalSearchProperties",
    ({ optionalSearchProperties }) => {
      expect(
        getLibrarySearchCriteria(
          { searchField: "4.1", optionalSearchProperties },
          2,
          LibrarySource.EXTERNAL
        )
      ).toEqual({
        searchField: "4.1",
        optionalSearchProperties: ["library", "version"],
        librarySource: LibrarySource.EXTERNAL,
      });
    }
  );

  it.each(["library", "version"])(
    "preserves the explicit external %s filter",
    (property) => {
      expect(
        getLibrarySearchCriteria(
          { searchField: "4", optionalSearchProperties: [property] },
          2,
          LibrarySource.EXTERNAL
        ).optionalSearchProperties
      ).toEqual([property]);
    }
  );

  it("keeps Model available outside All Libraries even with External selected", () => {
    expect(
      getLibrarySearchCriteria(
        { searchField: "QI-Core", optionalSearchProperties: ["model"] },
        0,
        LibrarySource.EXTERNAL
      )
    ).toEqual({
      searchField: "QI-Core",
      optionalSearchProperties: ["model"],
    });
  });
});
