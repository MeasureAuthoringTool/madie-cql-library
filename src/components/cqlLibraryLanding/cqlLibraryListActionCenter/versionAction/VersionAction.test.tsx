import * as React from "react";
import { render, screen } from "@testing-library/react";
import VersionAction, {
  VERSION_LIBRARY,
  NOTHING_SELECTED,
} from "./VersionAction";
import { CqlLibrary, Model } from "@madie/madie-models";
import { useFeatureFlags } from "@madie/madie-util";

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({
    Locking: false,
  }),
}));

const libraryVersion = {
  id: "67180dd54665c8239413ba90",
  cqlLibraryName: "TestLib",
  createdAt: "2024-10-22T20:40:53.212Z",
  model: "QI-Core v4.1.1",
  version: "0.0.000",
  draft: false,
} as CqlLibrary;

const libraryDraft = {
  id: "67180dd54665c8239413ba90",
  cqlLibraryName: "TestLib",
  createdAt: "2024-10-22T20:40:53.212Z",
  model: "QI-Core v4.1.1",
  version: "0.0.000",
  draft: true,
} as CqlLibrary;

describe("VersionAction", () => {
  it("Should disable action btn if no library selected", () => {
    render(<VersionAction libraries={[]} onClick={() => {}} canEdit={true} />);
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user select one draft library", () => {
    render(
      <VersionAction
        libraries={[libraryDraft]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      VERSION_LIBRARY
    );
  });
  it("Should disable action btn if user select one versioned library", () => {
    render(
      <VersionAction
        libraries={[libraryVersion]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
  it("Should disable action btn if user cannot edit ", () => {
    render(
      <VersionAction
        libraries={[libraryDraft]}
        onClick={() => {}}
        canEdit={false}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable btn if user selects two libraries", () => {
    const library2 = { ...libraryDraft };
    render(
      <VersionAction
        libraries={[libraryDraft, library2]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable action btn if feature flag is on and library is locked ", () => {
    (useFeatureFlags as jest.Mock).mockReturnValueOnce({
      Locking: true,
    });
    const lockedLibrary = {
      ...libraryDraft,
      cqlLibraryLock: {
        lockedBy: "anotherUser",
      },
    } as CqlLibrary;
    render(
      <VersionAction
        libraries={[lockedLibrary]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      "Unable to version library. Locked while being edited by anotherUser."
    );
  });

  it("Should enable action btn if feature flag is on and library is not locked ", () => {
    (useFeatureFlags as jest.Mock).mockReturnValueOnce({
      Locking: true,
    });
    render(
      <VersionAction
        libraries={[libraryDraft]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeEnabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      VERSION_LIBRARY
    );
  });
});
