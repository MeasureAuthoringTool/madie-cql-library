import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";
import LibrarySearchToolbar from "./LibrarySearchToolbar";
import {
  LibrarySearchCriteria,
  LibrarySource,
} from "../cqlLibraryLanding/librarySearch";

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({}),
}));

describe("LibrarySearchToolbar component", () => {
  let setLibrarySource: jest.Mock;
  let setSearchCriteria: jest.Mock;
  let handlePageChange: jest.Mock;

  const blankCriteria: LibrarySearchCriteria = {
    searchField: "",
    optionalSearchProperties: [],
  };

  const renderToolbar = (
    activeTab = 2,
    librarySource = LibrarySource.ALL,
    searchCriteria = blankCriteria
  ) =>
    render(
      <LibrarySearchToolbar
        activeTab={activeTab}
        librarySource={librarySource}
        setLibrarySource={setLibrarySource}
        searchCriteria={searchCriteria}
        setSearchCriteria={setSearchCriteria}
        handlePageChange={handlePageChange}
      />
    );

  const getFilterOptions = async () => {
    userEvent.click(screen.getByRole("combobox", { name: /Filter By/ }));
    const options = await screen.findAllByRole("option");
    return options.map((option) => option.textContent);
  };

  beforeEach(() => {
    setLibrarySource = jest.fn();
    setSearchCriteria = jest.fn();
    handlePageChange = jest.fn();
    (useFeatureFlags as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("should render the Library Source dropdown with All Libraries selected on the All Libraries tab", async () => {
    renderToolbar();
    const sourceSelect = screen.getByRole("combobox", {
      name: "Library Source",
    });
    expect(sourceSelect).toHaveTextContent("All Libraries");

    userEvent.click(sourceSelect);
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "All Libraries",
      "External Libraries",
      "MADiE Libraries",
    ]);
  });

  it("should not render the Library Source dropdown on other tabs", () => {
    [0, 1, 3, 4].forEach((tab) => {
      const { unmount } = renderToolbar(tab);
      expect(
        screen.queryByTestId("library-source-select")
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("library-list-search-input")
      ).toBeInTheDocument();
      unmount();
    });
  });

  it("should update the source and return to the first page when a source is selected", async () => {
    renderToolbar();
    userEvent.click(screen.getByRole("combobox", { name: "Library Source" }));
    userEvent.click(
      await screen.findByRole("option", { name: "MADiE Libraries" })
    );

    expect(setLibrarySource).toHaveBeenCalledWith(LibrarySource.MADIE);
    expect(handlePageChange).toHaveBeenCalledWith(null, 1);
    expect(setSearchCriteria).not.toHaveBeenCalled();
  });

  it("should remove Model from the Filter by options when External Libraries is selected", async () => {
    renderToolbar(2, LibrarySource.EXTERNAL);
    expect(await getFilterOptions()).toEqual(["-", "Library", "Version"]);
  });

  it("should restore Model to the Filter by options when switching away from External Libraries", async () => {
    const { rerender } = renderToolbar(2, LibrarySource.EXTERNAL);
    rerender(
      <LibrarySearchToolbar
        activeTab={2}
        librarySource={LibrarySource.MADIE}
        setLibrarySource={setLibrarySource}
        searchCriteria={blankCriteria}
        setSearchCriteria={setSearchCriteria}
        handlePageChange={handlePageChange}
      />
    );
    expect(await getFilterOptions()).toEqual([
      "-",
      "Library",
      "Version",
      "Model",
    ]);
  });

  it("should clear a selected Model filter when External Libraries is selected", async () => {
    const modelCriteria = {
      searchField: "QI-Core",
      optionalSearchProperties: ["model"],
    };
    renderToolbar(2, LibrarySource.ALL, modelCriteria);
    userEvent.click(screen.getByRole("combobox", { name: /Filter By/ }));
    userEvent.click(await screen.findByRole("option", { name: "Model" }));
    expect(
      screen.getByRole("combobox", { name: /Filter By/ })
    ).toHaveTextContent("Model");

    userEvent.click(screen.getByRole("combobox", { name: "Library Source" }));
    userEvent.click(
      await screen.findByRole("option", { name: "External Libraries" })
    );

    expect(setSearchCriteria).toHaveBeenCalledWith({
      searchField: "QI-Core",
      optionalSearchProperties: [],
    });
    expect(setLibrarySource).toHaveBeenCalledWith(LibrarySource.EXTERNAL);
    expect(
      screen.getByRole("combobox", { name: /Filter By/ })
    ).not.toHaveTextContent("Model");
  });

  it("should clear an applied Model search when rendered with External Libraries", () => {
    renderToolbar(2, LibrarySource.EXTERNAL, {
      searchField: "QI-Core",
      optionalSearchProperties: ["model"],
    });
    expect(setSearchCriteria).toHaveBeenCalledWith({
      searchField: "QI-Core",
      optionalSearchProperties: [],
    });
  });

  it("should search all fields without explicit properties on the All Libraries tab", () => {
    renderToolbar();
    userEvent.type(screen.getByTestId("library-list-search-input"), "4.1");
    userEvent.click(screen.getByTestId("library-trigger-search"));

    expect(setSearchCriteria).toHaveBeenCalledWith({
      searchField: "4.1",
      optionalSearchProperties: [],
    });
    expect(handlePageChange).toHaveBeenCalledWith(null, 1);
  });

  it("should search every filter option on other tabs when no filter is selected", () => {
    renderToolbar(0);
    userEvent.type(screen.getByTestId("library-list-search-input"), "test");
    userEvent.click(screen.getByTestId("library-trigger-search"));

    expect(setSearchCriteria).toHaveBeenCalledWith({
      searchField: "test",
      optionalSearchProperties: ["library", "version", "model"],
    });
  });

  it("should search only the selected filter", async () => {
    renderToolbar(2, LibrarySource.EXTERNAL);
    userEvent.click(screen.getByRole("combobox", { name: /Filter By/ }));
    userEvent.click(await screen.findByRole("option", { name: "Version" }));
    userEvent.type(screen.getByTestId("library-list-search-input"), "4.1");
    userEvent.click(screen.getByTestId("library-trigger-search"));

    expect(setSearchCriteria).toHaveBeenCalledWith({
      searchField: "4.1",
      optionalSearchProperties: ["version"],
    });
  });

  it("should clear the search without changing the source", () => {
    renderToolbar(2, LibrarySource.EXTERNAL);
    userEvent.type(screen.getByTestId("library-list-search-input"), "4.1");
    userEvent.click(screen.getByTestId("library-clear-search"));

    expect(screen.getByTestId("library-list-search-input")).toHaveValue("");
    expect(setSearchCriteria).toHaveBeenCalledWith(blankCriteria);
    expect(handlePageChange).toHaveBeenCalledWith(null, 1);
    expect(setLibrarySource).not.toHaveBeenCalled();
  });

  it("should only offer Review on non-All Libraries tabs when LibraryReviewStatus is enabled", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
    const { unmount } = renderToolbar(0);
    expect(await getFilterOptions()).toEqual([
      "-",
      "Library",
      "Version",
      "Model",
      "Review",
    ]);
    unmount();

    renderToolbar(2);
    expect(await getFilterOptions()).toEqual([
      "-",
      "Library",
      "Version",
      "Model",
    ]);
  });
});
