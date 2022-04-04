import { render } from "@testing-library/react";
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
    const { getByTestId } = render(<CqlLibraryEditor />);
    const input = getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input.value).toEqual("");
  });
  it("should be able to show the input Cql Library on the editor", () => {
    const { getByTestId } = render(<CqlLibraryEditor />);
    const input = getByTestId("cql-library-editor") as HTMLInputElement;
    userEvent.type(input, "library testCql version '1.0.000'");
    expect(input.value).toBe("library testCql version '1.0.000'");
  });
});
