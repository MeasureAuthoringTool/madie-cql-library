import * as React from "react";
import { render, screen } from "@testing-library/react";
import { CqlLibrary, LibrarySet, Model } from "@madie/madie-models";
import ReviewAction, {
  REVIEW,
  SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS,
} from "./ReviewAction";

const mockLibrarySet = {
  librarySetId: "1-2-3-4",
  owner: "test user",
} as unknown as LibrarySet;

const library = {
  id: "lib-1",
  cqlLibraryName: "Test Library",
  model: Model.QDM_5_6,
  librarySet: mockLibrarySet,
  librarySetId: "1-2-3-4",
  cqlErrors: false,
  cql: "",
  version: "0.0.001",
  draft: true,
  active: true,
} as CqlLibrary;

describe("ReviewAction", () => {
  it("disables the action when no libraries are selected", () => {
    render(
      <ReviewAction libraries={[]} onClick={() => {}} canReview={false} />
    );

    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("disables the action when more than one library is selected", () => {
    render(
      <ReviewAction
        libraries={[library, { ...library, librarySetId: "2-3-4-5" }]}
        onClick={() => {}}
        canReview={true}
      />
    );

    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("disables the action when one library is selected but the user cannot review it", () => {
    render(
      <ReviewAction
        libraries={[library]}
        onClick={() => {}}
        canReview={false}
      />
    );

    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("enables the action when one reviewable library is selected", () => {
    render(
      <ReviewAction libraries={[library]} onClick={() => {}} canReview={true} />
    );

    expect(screen.getByTestId("review-action-btn")).toBeEnabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      REVIEW
    );
  });
});
