import { render, screen } from "@testing-library/react";
import * as React from "react";
import userEvent from "@testing-library/user-event";
import CqlLibraryEditor from "./CqlLibraryEditor";

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

describe("Create New Cql Library Component", () => {
  it("editor must be empty when rendered", () => {
    render(<CqlLibraryEditor value={""} onChange={jest.fn()} />);
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input.value).toEqual("");
  });
  it("should be able to show the input Cql Library on the editor", () => {
    let value = "";
    const onChange = jest.fn((val) => (value = val));
    const { rerender } = render(
      <CqlLibraryEditor value={value} onChange={onChange} />
    );
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    userEvent.paste(input, "library testCql version '1.0.000'");
    expect(onChange).toBeCalledWith("library testCql version '1.0.000'");
    rerender(<CqlLibraryEditor value={value} onChange={onChange} />);
    expect(input.value).toBe("library testCql version '1.0.000'");
  });
});
