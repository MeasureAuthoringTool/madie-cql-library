import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DraftAction, {
  DRAFT_LIBRARY,
  NOTHING_SELECTED,
  CANNOT_DRAFT_LIBRARY_WITH_600,
} from "./DraftAction";
import { CqlLibrary, Model } from "@madie/madie-models";
import { CqlLibraryServiceApi } from "../../../../api/useCqlLibraryServiceApi";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
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

const mockCqlLibraryServiceApi = {
  getLibrariesByLibrarySetId: jest.fn().mockResolvedValue([]),
} as unknown as CqlLibraryServiceApi;
jest.mock("../../../../api/useCqlLibraryServiceApi", () =>
  jest.fn(() => mockCqlLibraryServiceApi)
);

describe("DraftAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should disable action btn if no library selected", () => {
    render(<DraftAction libraries={[]} onClick={() => {}} canEdit={true} />);
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user selects one versioned library", async () => {
    render(
      <DraftAction
        libraries={[libraryVersion]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("draft-action-btn")).not.toBeDisabled();
      expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
        "aria-label",
        DRAFT_LIBRARY
      );
    });
  });

  it("Should disable action btn if user selects one draft library", () => {
    render(
      <DraftAction
        libraries={[libraryDraft]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable action btn if user cannot edit", () => {
    render(
      <DraftAction
        libraries={[libraryVersion]}
        onClick={() => {}}
        canEdit={false}
      />
    );
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable action btn if user selects two libraries", () => {
    render(
      <DraftAction
        libraries={[libraryVersion, libraryVersion]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  //change and implement later
  it.skip("Should show an error toast if API call fails", async () => {
    mockedUselibrarieserviceApi.mockReturnValue({
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockRejectedValue(new Error("Network Error")),
    });

    render(
      <DraftAction
        libraries={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("draft-button-error-toast-text")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("draft-button-error-toast-text")
      ).toHaveTextContent(
        "Error fetching draft statuses: Error: Network Error"
      );
    });
  });

  it("should disable action if QI-Core 6.0.0 exists and show the right tooltip text", async () => {
    // Arrange: mock libraries to include a QI-Core 6.0.0 library
    const libraries: CqlLibrary[] = [
      { ...libraryVersion },
      { ...libraryDraft, id: "other-id", model: Model.QICORE_6_0_0 },
    ];
    mockCqlLibraryServiceApi.getLibrariesByLibrarySetId = jest
      .fn()
      .mockResolvedValue(libraries);

    render(
      <DraftAction
        libraries={[libraryVersion]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
      expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
        "aria-label",
        CANNOT_DRAFT_LIBRARY_WITH_600
      );
    });
  });
});
