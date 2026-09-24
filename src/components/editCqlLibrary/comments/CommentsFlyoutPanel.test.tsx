import * as React from "react";
import { render, screen } from "@testing-library/react";
import CommentsFlyoutPanel from "./CommentsFlyoutPanel";
import userEvent from "@testing-library/user-event";

jest.mock("@madie/madie-design-system/dist/react", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  RichTextEditor: ({ label, content, onChange, ...props }: any) => (
    <textarea
      aria-label={label}
      value={content}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  ),
}));

describe("CommentsFlyoutPanel", () => {
  it("renders the sections and keeps actions disabled until text is entered", () => {
    render(
      <CommentsFlyoutPanel open onClose={jest.fn()} sectionName="Library" />
    );

    expect(
      screen.getByRole("dialog", { name: "Comments" })
    ).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByTestId("comments-flyout-cancel")).toBeDisabled();
    expect(screen.getByTestId("comments-flyout-add")).toBeDisabled();
    expect(
      screen.getByLabelText("Add a comment to Library")
    ).toBeInTheDocument();

    userEvent.type(
      screen.getByTestId("comments-flyout-input"),
      "<p>A comment</p>"
    );

    expect(screen.getByTestId("comments-flyout-cancel")).toBeEnabled();
    expect(screen.getByTestId("comments-flyout-add")).toBeEnabled();
  });

  it("expands a collapsed section header on click", () => {
    render(
      <CommentsFlyoutPanel open onClose={jest.fn()} sectionName="Library" />
    );

    const generalHeader = screen.getByText("General").closest("button");
    const expandIcon = generalHeader.querySelector(
      ".MuiAccordionSummary-expandIconWrapper"
    );

    expect(generalHeader).toHaveAttribute("aria-expanded", "false");
    expect(expandIcon.querySelector(".lucide-chevron-right")).toBeTruthy();
    expect(expandIcon).not.toHaveClass("Mui-expanded");

    userEvent.click(generalHeader);

    expect(generalHeader).toHaveAttribute("aria-expanded", "true");
    // the .Mui-expanded rule is what rotates the chevron 90 degrees
    expect(expandIcon).toHaveClass("Mui-expanded");
  });

  it("clears the draft on cancel and closes from the close button", () => {
    const onClose = jest.fn();
    render(
      <CommentsFlyoutPanel open onClose={onClose} sectionName="Library" />
    );

    const input = screen.getByTestId("comments-flyout-input");
    userEvent.type(input, "<p>Looks good!</p>");
    userEvent.click(screen.getByTestId("comments-flyout-cancel"));
    expect(input).toHaveValue("");

    userEvent.click(screen.getByTestId("comments-flyout-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
