import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CqlLibrary,
  ReviewStatus,
  CqlLibraryReview,
} from "@madie/madie-models";
// @ts-ignore
import { useCqlLibraryReviewServiceApi } from "@madie/madie-util";
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
  useCqlLibraryReviewServiceApi: jest.fn(),
}));

describe("ReviewDialog", () => {
  const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  };

  const mockGetCqlLibraryReview = jest.fn().mockResolvedValue(null);
  const mockCreateCqlLibraryReview = jest.fn().mockResolvedValue({
    id: "new-review-id",
  });
  const mockUpdateCqlLibraryReview = jest.fn().mockResolvedValue({
    id: "existing-review-id",
  });

  beforeEach(() => {
    (useCqlLibraryReviewServiceApi as jest.Mock).mockReturnValue({
      getCqlLibraryReview: mockGetCqlLibraryReview,
      createCqlLibraryReview: mockCreateCqlLibraryReview,
      updateCqlLibraryReview: mockUpdateCqlLibraryReview,
    });
    mockGetCqlLibraryReview.mockClear();
    mockCreateCqlLibraryReview.mockClear();
    mockUpdateCqlLibraryReview.mockClear();
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

  it("renders required content when open", async () => {
    render(<ReviewDialog open={true} library={library} onClose={jest.fn()} />);

    expect(
      screen.getByText("Mark Library Ready for Review")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mark as Ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Comments")).toBeInTheDocument();
    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();

    await waitFor(() => {
      expect(mockGetCqlLibraryReview).toHaveBeenCalledWith("library-1");
    });
  });

  it("creates READY_FOR_REVIEW when no existing review is found", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} library={library} onClose={onClose} />);

    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockCreateCqlLibraryReview).toHaveBeenCalledWith(
        "library-1",
        expect.objectContaining({
          id: "",
          libraryId: "library-1",
          librarySetId: "set-1",
          status: ReviewStatus.READY_FOR_REVIEW,
          comment: "<p></p>",
        })
      );
    });

    expect(mockUpdateCqlLibraryReview).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("Review information has been saved successfully.")
    ).toBeInTheDocument();

    userEvent.click(screen.getByTestId("review-dialog-toast-close-button"));

    await waitFor(() => {
      expect(
        screen.queryByText("Review information has been saved successfully.")
      ).not.toBeInTheDocument();
    });
  });

  it("uses default empty comment when comments are cleared", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} library={library} onClose={onClose} />);

    const commentEditor = screen.getByTestId("review-comments-textarea");
    userEvent.clear(commentEditor);
    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));

    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });

    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockCreateCqlLibraryReview).toHaveBeenCalledWith(
        "library-1",
        expect.objectContaining({
          comment: "<p></p>",
        })
      );
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

  it("invokes onClose when cancel is clicked", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} library={library} onClose={onClose} />);

    userEvent.click(screen.getByTestId("review-dialog-cancel-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates NOT_READY_FOR_REVIEW when existing review is modified", async () => {
    const onClose = jest.fn();
    const existingReview: CqlLibraryReview = {
      id: "existing-review-id",
      libraryId: "library-1",
      librarySetId: "set-1",
      status: ReviewStatus.READY_FOR_REVIEW,
      comment: "Previously reviewed",
    };
    mockGetCqlLibraryReview.mockResolvedValueOnce(existingReview);

    render(<ReviewDialog open={true} library={library} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockUpdateCqlLibraryReview).toHaveBeenCalledWith(
        "library-1",
        expect.objectContaining({
          id: "existing-review-id",
          libraryId: "library-1",
          librarySetId: "set-1",
          status: ReviewStatus.NOT_READY_FOR_REVIEW,
          comment: "Previously reviewed",
        })
      );
    });

    expect(mockCreateCqlLibraryReview).not.toHaveBeenCalled();
  });

  it("shows an error toast when saving a review fails", async () => {
    const onClose = jest.fn();
    mockCreateCqlLibraryReview.mockRejectedValueOnce(new Error("save failed"));
    render(<ReviewDialog open={true} library={library} onClose={onClose} />);

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    expect(
      await screen.findByText(
        "An error occurred while saving the review. Please try again."
      )
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not fetch review when the dialog is closed", () => {
    render(<ReviewDialog open={false} library={library} onClose={jest.fn()} />);

    expect(mockGetCqlLibraryReview).not.toHaveBeenCalled();
  });

  it("handles review fetch failures and keeps default form state", async () => {
    mockGetCqlLibraryReview.mockRejectedValueOnce(new Error("network error"));

    render(<ReviewDialog open={true} library={library} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(mockGetCqlLibraryReview).toHaveBeenCalledWith("library-1");
    });

    expect(screen.getByLabelText("Mark as Ready")).not.toBeChecked();
    expect(screen.getByLabelText("Comments")).toHaveValue("<p></p>");
    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
  });

  it("does not update state after unmount when fetch resolves", async () => {
    const deferred = createDeferred<CqlLibraryReview | null>();
    mockGetCqlLibraryReview.mockReturnValueOnce(deferred.promise);

    const { unmount } = render(
      <ReviewDialog open={true} library={library} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(mockGetCqlLibraryReview).toHaveBeenCalledWith("library-1");
    });

    unmount();

    await act(async () => {
      deferred.resolve(null);
      await deferred.promise;
    });
  });

  it("does not update state after unmount when fetch rejects", async () => {
    const deferred = createDeferred<CqlLibraryReview | null>();
    mockGetCqlLibraryReview.mockReturnValueOnce(deferred.promise);

    const { unmount } = render(
      <ReviewDialog open={true} library={library} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(mockGetCqlLibraryReview).toHaveBeenCalledWith("library-1");
    });

    unmount();

    await act(async () => {
      deferred.reject(new Error("late failure"));
      try {
        await deferred.promise;
      } catch {
        // Expected rejection; component should ignore updates after unmount.
      }
    });
  });
});
