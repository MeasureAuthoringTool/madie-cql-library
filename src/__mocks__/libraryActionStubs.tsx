import * as React from "react";

/*
  Stubs for the shared library action-center icons and dialogs that live in
  @madie/madie-util (their real behavior is unit-tested there). Spread into a
  test's inline `jest.mock("@madie/madie-util", ...)` factory as
  `...mockLibraryActionStubs`.
*/

export const LibraryHistoryAction = ({ libraries, onClick }: any) => (
  <button
    data-testid="library-history-action-btn"
    disabled={libraries?.length !== 1}
    onClick={() => onClick && onClick()}
  >
    View History
  </button>
);

export const LibraryCompareVersionsAction = ({ libraries, onClick }: any) => (
  <button
    data-testid="compare-versions-action-btn"
    disabled={
      libraries?.length !== 2 ||
      libraries[0]?.librarySetId !== libraries[1]?.librarySetId
    }
    onClick={() => onClick && onClick()}
  >
    Compare Library Versions
  </button>
);

export const LibraryHistoryDialog = ({ libraries, open, onClose }: any) =>
  open ? (
    <div data-testid="library-history-dialog">
      <span>Library History</span>
      <span data-testid="library-history-dialog-library">
        {libraries?.[0]?.cqlLibraryName}
      </span>
      <button
        data-testid="library-history-dialog-close"
        onClick={() => onClose && onClose()}
      >
        Close
      </button>
    </div>
  ) : null;

export const LibraryCompareVersionsDialog = ({
  libraries,
  open,
  onClose,
}: any) =>
  open ? (
    <div data-testid="compare-versions-dialog">
      <span>Compare Library Versions</span>
      <span data-testid="compare-versions-dialog-count">
        {libraries?.length}
      </span>
      <button
        data-testid="compare-versions-dialog-close"
        onClick={() => onClose && onClose()}
      >
        Close
      </button>
    </div>
  ) : null;
