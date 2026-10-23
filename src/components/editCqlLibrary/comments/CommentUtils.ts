export const COMMENT_MAIN_SECTIONS = {
  LIBRARY: "Library",
} as const;

export type CommentMainSection =
  (typeof COMMENT_MAIN_SECTIONS)[keyof typeof COMMENT_MAIN_SECTIONS];

export const FALLBACK_SECTION_NAME = "Current section";

export interface CommentSectionLocation {
  mainSection?: CommentMainSection;
  subSectionName: string;
}

export interface CommentSection {
  name: CommentMainSection;
  subSections: string[];
}

const UNKNOWN_SECTION: CommentSectionLocation = {
  subSectionName: FALLBACK_SECTION_NAME,
};

const LIBRARY_SUB_SECTIONS: Record<string, string> = {
  details: "Library",
};

export const getCommentSections = (): CommentSection[] => [
  {
    name: COMMENT_MAIN_SECTIONS.LIBRARY,
    subSections: Object.values(LIBRARY_SUB_SECTIONS),
  },
];

export const getCommentSectionLocation = (
  pathname: string
): CommentSectionLocation => {
  const path = (pathname ?? "").replace(/\/+$/, "");
  const editIndex = path.indexOf("/edit/");
  const editPath = editIndex >= 0 ? path.slice(editIndex + 6) : "";
  const [section] = editPath.split("/").filter(Boolean);

  const subSectionName = LIBRARY_SUB_SECTIONS[section];
  return subSectionName
    ? { mainSection: COMMENT_MAIN_SECTIONS.LIBRARY, subSectionName }
    : UNKNOWN_SECTION;
};

export const getCommentSectionName = (pathname: string): string =>
  getCommentSectionLocation(pathname).subSectionName;
