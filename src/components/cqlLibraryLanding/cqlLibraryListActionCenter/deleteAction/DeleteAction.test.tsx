import * as React from "react";
import { render, screen } from "@testing-library/react";
import DeleteAction, {
  DEL_LIBRARY,
  NOTHING_SELECTED,
  LOCKED_LIBRARY_PREFIX,
  PERMISSION_DENIED,
} from "./DeleteAction";
import { CqlLibrary } from "@madie/madie-models";

// mock for permission utility
const mockCheckUserCanDelete = jest.fn();
jest.mock("@madie/madie-util", () => ({
  checkUserCanDelete: (...args: any[]) => mockCheckUserCanDelete(...args),
}));

const baseLibrary = {
  id: "lib-1",
  cqlLibraryName: "TestLib",
  draft: true,
  librarySet: { owner: "ownerUser" },
} as unknown as CqlLibrary;

describe("DeleteAction (CQL Library)", () => {
  beforeEach(() => {
    mockCheckUserCanDelete.mockReset();
  });

  it("Should disable action btn if no library selected", () => {
    mockCheckUserCanDelete.mockReturnValue(false); // irrelevant
    render(<DeleteAction selectedLibraries={[]} onClick={() => {}} />);
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should show permission denied when one selected and no permission", () => {
    mockCheckUserCanDelete.mockReturnValue(false);
    render(
      <DeleteAction selectedLibraries={[baseLibrary]} onClick={() => {}} />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      PERMISSION_DENIED
    );
  });

  it("Should show locked message when one selected, has permission, but locked", () => {
    const lockedLibrary = {
      ...baseLibrary,
      cqlLibraryLock: { lockedBy: "HARP123" },
    } as CqlLibrary;
    mockCheckUserCanDelete.mockReturnValue(true);
    render(
      <DeleteAction selectedLibraries={[lockedLibrary]} onClick={() => {}} />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      `${LOCKED_LIBRARY_PREFIX}HARP123`
    );
  });

  it("Should enable action btn if one library selected, has permission, and not locked", () => {
    mockCheckUserCanDelete.mockReturnValue(true);
    render(
      <DeleteAction selectedLibraries={[baseLibrary]} onClick={() => {}} />
    );
    expect(screen.getByTestId("delete-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      DEL_LIBRARY
    );
  });

  it("Should disable btn and show NOTHING_SELECTED if multiple libraries selected", () => {
    mockCheckUserCanDelete.mockReturnValue(true); // even with permission, multiple selection overrides
    const anotherLibrary = { ...baseLibrary, id: "lib-2" } as CqlLibrary;
    render(
      <DeleteAction
        selectedLibraries={[baseLibrary, anotherLibrary]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should show permission denied instead of locked when both conditions present (precedence test)", () => {
    const lockedLibrary = {
      ...baseLibrary,
      cqlLibraryLock: { lockedBy: "HARP999" },
    } as CqlLibrary;
    mockCheckUserCanDelete.mockReturnValue(false); // no permission
    render(
      <DeleteAction selectedLibraries={[lockedLibrary]} onClick={() => {}} />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      PERMISSION_DENIED
    );
  });
});
