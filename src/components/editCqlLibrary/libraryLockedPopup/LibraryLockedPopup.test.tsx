import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LibraryLockedPopup from "./LibraryLockedPopup";
import { MemoryRouter } from "react-router-dom";

const mockUseOwnerName = jest.fn();
jest.mock("@madie/madie-util", () => ({
  useOwnerName: (harpId) => mockUseOwnerName(harpId),
}));

describe("LibraryLockedPopup component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOwnerName.mockImplementation((harpId) => harpId);
  });

  it("renders the owner's display name and harpId when open", () => {
    mockUseOwnerName.mockReturnValue("John Doe");
    render(
      <MemoryRouter>
        <LibraryLockedPopup
          libraryLockedBy="user123"
          lockedLibraryPopupOpen={true}
          setLockedLibraryPopupOpen={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Library currently In-Use")).toBeInTheDocument();
    const message = screen.getByTestId("library-locked-popup-message");
    expect(message).toHaveTextContent(
      "This library is currently being edited by John Doe (user123)."
    );
    expect(message).toHaveTextContent(
      "You will be unable to make changes at this time."
    );
    expect(mockUseOwnerName).toHaveBeenCalledWith("user123");
  });

  it("falls back to the HARP ID wording when no name is available", () => {
    mockUseOwnerName.mockReturnValue("user123");
    render(
      <MemoryRouter>
        <LibraryLockedPopup
          libraryLockedBy="user123"
          lockedLibraryPopupOpen={true}
          setLockedLibraryPopupOpen={jest.fn()}
        />
      </MemoryRouter>
    );

    const message = screen.getByTestId("library-locked-popup-message");
    expect(message).toHaveTextContent(
      "This library is currently being edited by user123."
    );
    expect(message).not.toHaveTextContent("(user123)");
  });

  it("does not render when closed", () => {
    render(
      <MemoryRouter>
        <LibraryLockedPopup
          libraryLockedBy="user123"
          lockedLibraryPopupOpen={false}
          setLockedLibraryPopupOpen={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.queryByText("Measure currently In-Use")
    ).not.toBeInTheDocument();
  });

  it("calls setLockedLibraryPopupOpen with false when Close button is clicked", async () => {
    const setLockedLibraryPopupOpen = jest.fn();
    render(
      <MemoryRouter>
        <LibraryLockedPopup
          libraryLockedBy="user123"
          lockedLibraryPopupOpen={true}
          setLockedLibraryPopupOpen={setLockedLibraryPopupOpen}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(setLockedLibraryPopupOpen).toHaveBeenCalledWith(false);
    });
  });
});
