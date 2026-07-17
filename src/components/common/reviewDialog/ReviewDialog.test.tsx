import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CqlLibrary, ReviewStatus } from "../../../../../madie-models/src";
// @ts-ignore
import { useCqlLibraryServiceApi } from "@madie/madie-util";
import ReviewDialog from "./ReviewDialog";

jest.mock("@madie/madie-design-system/dist/react", () => {
  const actual = jest.requireActual("@madie/madie-design-system/dist/react");
  return {
    ...actual,
    RichTextEditor: ({ label, content, onChange }: any) => (
      <textarea
        aria-label={label}
        data-testid="review-comments-textarea"
        value={content}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  };
});

jest.mock("@madie/madie-util", () => ({
  useCqlLibraryServiceApi: jest.fn(),
}));

describe("ReviewDialog", () => {
  const mockUpdateCqlLibrary = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue({
      updateCqlLibrary: mockUpdateCqlLibrary,
    });
    mockUpdateCqlLibrary.mockClear();
  });

  const library = {
    id: "library-1",
    cqlLibraryName: "Library One",
    librarySetId: "set-1",
    model: "QI-Core v4.1.1",
    cqlErrors: false,
    cql: "library LibraryOne version '0.0.001'",
    version: "0.0.001",
    draft: true,
    active: true,
    createdAt: "",
    createdBy: "",
    lastModifiedAt: "",
    lastModifiedBy: "",
  } as unknown as CqlLibrary;

  it("renders required content when open", () => {
    render(<ReviewDialog open={true} library={library} onClose={jest.fn()} />);

    expect(
      screen.getByText("Mark Library Ready for Review")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mark as Ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Comments")).toBeInTheDocument();
    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
  });

  it("saves READY_FOR_REVIEW when mark-as-ready is selected", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} library={library} onClose={onClose} />);

    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockUpdateCqlLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "library-1",
          review: {
            status: ReviewStatus.READY_FOR_REVIEW,
            comment: "<p></p>",
          },
        })
      );
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("enables Save when comments are modified", async () => {
    render(<ReviewDialog open={true} library={library} onClose={jest.fn()} />);

    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();

    const commentEditor = screen.getByTestId("review-comments-textarea");
    userEvent.type(commentEditor, "Needs one more pass");

    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
  });

  it("invokes onClose when cancel is clicked", () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} library={library} onClose={onClose} />);

    userEvent.click(screen.getByTestId("review-dialog-cancel-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("saves NOT_READY_FOR_REVIEW when mark-as-ready remains off", async () => {
    const onClose = jest.fn();
    render(
      <ReviewDialog
        open={true}
        library={{
          ...library,
          review: {
            status: ReviewStatus.READY_FOR_REVIEW,
            comment: "Previously reviewed",
          },
        }}
        onClose={onClose}
      />
    );

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockUpdateCqlLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          review: {
            status: ReviewStatus.NOT_READY_FOR_REVIEW,
            comment: "Previously reviewed",
          },
        })
      );
    });
  });
});
