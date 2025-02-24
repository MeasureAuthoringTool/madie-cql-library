import * as React from "react";
import { render, screen } from "@testing-library/react";
import DeleteAction, { DEL_LIBRARY, NOTHING_SELECTED } from "./DeleteAction";
import { CqlLibrary, Model } from "@madie/madie-models";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));

const library = {
  id: "67180dd54665c8239413ba90",
  cqlLibraryName: "TestLib",
  createdAt: "2024-10-22T20:40:53.212Z",
  model: "QI-Core v4.1.1",
  version: "0.0.000",
  draft: true,
} as CqlLibrary;

describe("DeleteAction", () => {
  it("Should disable action btn if no library selected", () => {
    render(
      <DeleteAction
        libraries={[]}
        canDelete={true}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user select one library ", () => {
    render(
      <DeleteAction
        canDelete={true}
        libraries={[library]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      DEL_LIBRARY
    );
  });
  it("Should disable action btn if user cannot edit ", () => {
    render(
      <DeleteAction
        canDelete={false}
        libraries={[library]}
        onClick={() => {}}
        canEdit={false}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable btn if user selects two libraries", () => {
    const library2 = library;
    render(
      <DeleteAction
        canDelete={true}
        libraries={[library, library2]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
});
