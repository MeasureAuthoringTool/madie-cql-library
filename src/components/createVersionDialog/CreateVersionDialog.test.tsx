import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import CreateVersionDialog from "./CreateVersionDialog";

describe("Create Version Dialog component", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("should render version dialog and the continue button is disabled", () => {
    render(
      <CreateVersionDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("create-version-continue-button")).toBeDisabled();
  });

  it("should render version dialog and enable continue button after a selection", () => {
    render(
      <CreateVersionDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    const majorRadio: HTMLInputElement = screen.getByLabelText("Major");
    const minorRadio: HTMLInputElement = screen.getByLabelText("Minor");
    expect(majorRadio.checked).toEqual(false);
    act(() => {
      fireEvent.click(majorRadio);
    });
    expect(majorRadio.checked).toEqual(true);
    expect(minorRadio.checked).toEqual(false);
    expect(
      screen.getByTestId("create-version-continue-button")
    ).not.toBeDisabled();
  });

  it("should navigate to cql library home page on cancel", async () => {
    const onCloseFn = jest.fn();
    render(
      <CreateVersionDialog
        open={true}
        onClose={onCloseFn}
        onSubmit={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("create-version-cancel-button"));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should continue versioning by calling onSubmit", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreateVersionDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    const majorRadio: HTMLInputElement = screen.getByLabelText("Major");
    expect(majorRadio.checked).toEqual(false);

    fireEvent.click(majorRadio);

    await waitFor(() => {
      expect(majorRadio.checked).toEqual(true);
      expect(
        screen.getByTestId("create-version-continue-button")
      ).not.toBeDisabled();
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(onSubmitFn).toHaveBeenCalled();
    });
  });
});
