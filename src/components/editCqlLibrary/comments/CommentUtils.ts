import type { CommentSection } from "@madie/madie-util";

export const COMMENT_MAIN_SECTIONS = {
  LIBRARY: "Library",
} as const;

export type CommentMainSection =
  (typeof COMMENT_MAIN_SECTIONS)[keyof typeof COMMENT_MAIN_SECTIONS];

export const FALLBACK_SECTION_NAME = "Current section";

export interface CommentSectionLocation {
  activeMainSection?: CommentMainSection;
  activeSubSection: string;
}

const UNKNOWN_SECTION: CommentSectionLocation = {
  activeSubSection: FALLBACK_SECTION_NAME,
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

  const activeSubSection = LIBRARY_SUB_SECTIONS[section];
  return activeSubSection
    ? { activeMainSection: COMMENT_MAIN_SECTIONS.LIBRARY, activeSubSection }
    : UNKNOWN_SECTION;
};

export const getCommentSectionName = (pathname: string): string =>
  getCommentSectionLocation(pathname).activeSubSection;
