import React, { useEffect } from "react";
import {
  SearchAndFilter,
  Select,
  useFilterSearch,
} from "@madie/madie-design-system/dist/react";
import { useFeatureFlags } from "@madie/madie-util";
import { MenuItem, SelectChangeEvent } from "@mui/material";
import {
  LibrarySearchCriteria,
  LibrarySource,
} from "../cqlLibraryLanding/librarySearch";

interface LibrarySearchToolbarProps {
  activeTab: number;
  librarySource: LibrarySource;
  setLibrarySource: (source: LibrarySource) => void;
  searchCriteria: LibrarySearchCriteria;
  setSearchCriteria: (criteria: LibrarySearchCriteria) => void;
  handlePageChange: (event: unknown, page: number) => void;
}

export default function LibrarySearchToolbar({
  activeTab,
  librarySource,
  setLibrarySource,
  searchCriteria,
  setSearchCriteria,
  handlePageChange,
}: LibrarySearchToolbarProps) {
  const featureFlags = useFeatureFlags();

  const LIBRARY_FILTER_OPTIONS = [
    "Library",
    "Version",
    ...(activeTab === 2 && librarySource === LibrarySource.EXTERNAL
      ? []
      : ["Model"]),
    ...(activeTab === 3 ||
    activeTab === 4 ||
    (featureFlags?.LibraryReviewStatus && activeTab !== 2)
      ? ["Review"]
      : []),
  ];
  const LIBRARY_FILTER_MAP: Record<string, string> = {
    Library: "library",
    Version: "version",
    Model: "model",
    Review: "review",
  };

  const {
    filterBy,
    searchField,
    handleFilter,
    handleSearch,
    finalizeSearchCriteria,
    blankSearchCriteria,
  } = useFilterSearch();

  useEffect(() => {
    if (activeTab === 2 && librarySource === LibrarySource.EXTERNAL) {
      if (filterBy === "Model") {
        handleFilter({ target: { value: "" } });
      }
      if (
        searchCriteria?.optionalSearchProperties?.length === 1 &&
        searchCriteria.optionalSearchProperties[0] === "model"
      ) {
        setSearchCriteria({ ...searchCriteria, optionalSearchProperties: [] });
      }
    }
  }, [
    activeTab,
    librarySource,
    filterBy,
    handleFilter,
    searchCriteria,
    setSearchCriteria,
  ]);

  const handleSearchTrigger = () => {
    finalizeSearchCriteria();
    const optionalSearchProperties: string[] = [];
    if (filterBy && LIBRARY_FILTER_MAP[filterBy]) {
      optionalSearchProperties.push(LIBRARY_FILTER_MAP[filterBy]);
    } else if (!filterBy && searchField && activeTab !== 2) {
      LIBRARY_FILTER_OPTIONS.forEach((opt) =>
        optionalSearchProperties.push(LIBRARY_FILTER_MAP[opt])
      );
    }
    setSearchCriteria({ searchField, optionalSearchProperties });
    handlePageChange(null, 1);
  };

  const handleSearchClear = () => {
    blankSearchCriteria();
    setSearchCriteria({ searchField: "", optionalSearchProperties: [] });
    handlePageChange(null, 1);
  };

  const handleLibrarySourceChange = (
    event: SelectChangeEvent<LibrarySource>
  ) => {
    const source = event.target.value;
    if (
      source !== LibrarySource.ALL &&
      source !== LibrarySource.EXTERNAL &&
      source !== LibrarySource.MADIE
    ) {
      throw new Error(`Unsupported library source: ${source}`);
    }
    if (source === LibrarySource.EXTERNAL && filterBy === "Model") {
      handleFilter({ target: { value: "" } });
    }
    const properties = searchCriteria?.optionalSearchProperties ?? [];
    if (
      properties.length > 1 ||
      (source === LibrarySource.EXTERNAL && properties.includes("model"))
    ) {
      setSearchCriteria({ ...searchCriteria, optionalSearchProperties: [] });
    }
    setLibrarySource(source);
    handlePageChange(null, 1);
  };

  return (
    <div className="library-search-controls">
      {activeTab === 2 && (
        <div className="library-source-filter">
          <Select
            label="Library Source"
            id="library-source-select"
            data-testid="library-source-select"
            inputProps={{
              "data-testid": "library-source-select-input",
            }}
            name="librarySource"
            size="small"
            value={librarySource}
            renderValue={(source: LibrarySource) =>
              ({
                [LibrarySource.ALL]: "All Libraries",
                [LibrarySource.EXTERNAL]: "External Libraries",
                [LibrarySource.MADIE]: "MADiE Libraries",
              }[source])
            }
            onChange={handleLibrarySourceChange}
            options={[
              <MenuItem key="all" value={LibrarySource.ALL}>
                All Libraries
              </MenuItem>,
              <MenuItem key="external" value={LibrarySource.EXTERNAL}>
                External Libraries
              </MenuItem>,
              <MenuItem key="madie" value={LibrarySource.MADIE}>
                MADiE Libraries
              </MenuItem>,
            ]}
          />
        </div>
      )}
      <SearchAndFilter
        filterBy={
          activeTab === 2 &&
          librarySource === LibrarySource.EXTERNAL &&
          filterBy === "Model"
            ? ""
            : filterBy
        }
        searchField={searchField}
        onFilterChange={handleFilter}
        onSearchChange={handleSearch}
        onSearchTrigger={handleSearchTrigger}
        onSearchClear={handleSearchClear}
        filterByOpts={LIBRARY_FILTER_OPTIONS}
        textFieldID="library"
      />
    </div>
  );
}
