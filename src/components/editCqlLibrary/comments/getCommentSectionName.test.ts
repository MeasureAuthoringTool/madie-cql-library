import {
  COMMENT_MAIN_SECTIONS,
  getCommentSectionLocation,
  getCommentSectionName,
  getCommentSections,
} from "./getCommentSectionName";

describe("getCommentSectionLocation", () => {
  it("places the library details screen under the Library header", () => {
    expect(
      getCommentSectionLocation("/cql-libraries/library-id/edit/details")
    ).toEqual({
      mainSection: COMMENT_MAIN_SECTIONS.LIBRARY,
      subSectionName: "Library",
    });
  });

  it("ignores a trailing slash", () => {
    expect(
      getCommentSectionLocation("/cql-libraries/library-id/edit/details/")
    ).toEqual({
      mainSection: COMMENT_MAIN_SECTIONS.LIBRARY,
      subSectionName: "Library",
    });
  });

  it("does not throw when the route is not known yet", () => {
    expect(getCommentSectionLocation(undefined)).toEqual({
      subSectionName: "Current section",
    });
  });

  it.each([
    "/cql-libraries/library-id/edit/unknown",
    "/cql-libraries/library-id/details",
    "/cql-libraries",
    "",
  ])("has no main section for %s", (pathname) => {
    expect(getCommentSectionLocation(pathname)).toEqual({
      subSectionName: "Current section",
    });
  });
});

describe("getCommentSectionName", () => {
  it("names the sub-section a comment would attach to", () => {
    expect(
      getCommentSectionName("/cql-libraries/library-id/edit/details")
    ).toBe("Library");
  });

  it("falls back safely for an unknown route", () => {
    expect(getCommentSectionName("/cql-libraries/library-id/edit/nope")).toBe(
      "Current section"
    );
  });
});

describe("getCommentSections", () => {
  it("catalogues the single library screen", () => {
    expect(getCommentSections()).toEqual([
      { name: COMMENT_MAIN_SECTIONS.LIBRARY, subSections: ["Library"] },
    ]);
  });
});
