import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LibraryLockedPopup from "./LibraryLockedPopup";
import { MemoryRouter } from "react-router-dom";

describe("LibraryLockedPopup component", () => {
  it("renders correctly when open", () => {
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
      /This library is currently being edited by HARP ID/i
    );
    expect(message).toHaveTextContent("user123");
    expect(message).toHaveTextContent(
      "You will be unable to make changes at this time."
    );
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
