import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CompareVersionsDialog, {
  getNewestLibraryInstance,
} from "./CompareVersionsDialog";
import { CqlLibrary } from "@madie/madie-models";

const mockOnClose = jest.fn();

const mockLibraries: CqlLibrary[] = [
  {
    id: "1",
    cqlLibraryName: "Older Library",
    version: "1.0.001",
    draft: false,
  } as any,
  {
    id: "2",
    cqlLibraryName: "Newer Library (Draft)",
    version: "1.1.001",
    draft: true,
  } as any,
];

describe("CompareVersionsDialog Component (Libraries)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <CompareVersionsDialog
        libraries={mockLibraries}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("compare-versions-dialog")).toBeInTheDocument();
    expect(screen.getByText("Compare Library Versions")).toBeInTheDocument();
  });

  it("does not render when open = false", () => {
    render(
      <CompareVersionsDialog
        libraries={mockLibraries}
        open={false}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("does not render if libraries is null", () => {
    render(
      <CompareVersionsDialog
        libraries={null}
        open={true}
        onClose={mockOnClose}
      />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("does not render if libraries is undefined", () => {
    render(
      <CompareVersionsDialog
        libraries={undefined}
        open={true}
        onClose={mockOnClose}
      />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("does not render if libraries length is not 2", () => {
    render(
      <CompareVersionsDialog libraries={[]} open={true} onClose={mockOnClose} />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();

    const singleLibrary = [
      { id: "1", cqlLibraryName: "A", version: "1.0.001", draft: false } as any,
    ];
    render(
      <CompareVersionsDialog
        libraries={singleLibrary}
        open={true}
        onClose={mockOnClose}
      />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("displays newest library correctly", () => {
    render(
      <CompareVersionsDialog
        libraries={mockLibraries}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("library-name")).toHaveTextContent(
      "Newer Library (Draft)"
    );
  });

  it("renders CQL tab", () => {
    render(
      <CompareVersionsDialog
        libraries={mockLibraries}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("tab-content-cql")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    render(
      <CompareVersionsDialog
        libraries={mockLibraries}
        open={true}
        onClose={mockOnClose}
      />
    );

    const closeBtn = screen.getByTestId("compare-versions-close-button");
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe("getNewestLibraryInstance", () => {
  const baseLibrary = (
    id: string,
    draft: boolean,
    version?: string
  ): CqlLibrary =>
    ({
      id,
      cqlLibraryName: `Library ${id}`,
      version: version ?? "1.0.001",
      draft,
    } as any);

  it("returns libraryA if only libraryA is draft", () => {
    const libraries = [baseLibrary("1", true), baseLibrary("2", false)];
    expect(getNewestLibraryInstance(libraries)).toBe(libraries[0]);
  });

  it("returns libraryB if only libraryB is draft", () => {
    const libraries = [baseLibrary("1", false), baseLibrary("2", true)];
    expect(getNewestLibraryInstance(libraries)).toBe(libraries[1]);
  });

  it("returns library with higher version if both are non-draft", () => {
    const libraries = [
      baseLibrary("1", false, "1.0.001"),
      baseLibrary("2", false, "1.1.001"),
    ];
    expect(getNewestLibraryInstance(libraries)).toBe(libraries[1]);

    const libraries2 = [
      baseLibrary("1", false, "2.0.002"),
      baseLibrary("2", false, "1.9.999"),
    ];
    expect(getNewestLibraryInstance(libraries2)).toBe(libraries2[0]);
  });

  it("returns first library if both versions are equal", () => {
    const libraries = [
      baseLibrary("1", false, "1.0.001"),
      baseLibrary("2", false, "1.0.001"),
    ];
    expect(getNewestLibraryInstance(libraries)).toBe(libraries[0]);
  });

  it("returns the library with higher major version", () => {
    const libraries = [
      baseLibrary("1", false, "1.0.001"),
      baseLibrary("2", false, "2.0.001"),
    ];
    expect(getNewestLibraryInstance(libraries)).toBe(libraries[1]);
  });

  it("returns the library with higher minor version when major is equal", () => {
    const libraries = [
      baseLibrary("1", false, "1.1.001"),
      baseLibrary("2", false, "1.2.001"),
    ];
    expect(getNewestLibraryInstance(libraries)).toBe(libraries[1]);
  });

  it("returns the library with higher patch version when major and minor are equal", () => {
    const libraries = [
      baseLibrary("1", false, "1.0.001"),
      baseLibrary("2", false, "1.0.002"),
    ];
    expect(getNewestLibraryInstance(libraries)).toBe(libraries[1]);
  });
});
