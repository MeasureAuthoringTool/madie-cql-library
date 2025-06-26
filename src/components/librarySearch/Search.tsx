import React, { Dispatch, SetStateAction } from "react";
import { IconButton, MenuItem } from "@mui/material";
import _ from "lodash";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { useFormik } from "formik";
import "twin.macro";
import "styled-components/macro";
import { Select, TextField } from "@madie/madie-design-system/dist/react";
import { LibrarySearchCriteria } from "../cqlLibraryLanding/CqlLibraryLanding";
import { useFeatureFlags } from "@madie/madie-util";

const renderMenuItemsForFilter = (options: string[]) => {
  return [
    ...options.map((option) => (
      <MenuItem
        key={`${option}-option`}
        value={option}
        data-testid={`${option}-option`}
      >
        {option}
      </MenuItem>
    )),
  ];
};

const Search = (props: {
  searchCriteria: LibrarySearchCriteria;
  setSearchCriteria: Dispatch<SetStateAction<LibrarySearchCriteria>>;
}) => {
  const featureFlags = useFeatureFlags();
  const { searchCriteria, setSearchCriteria } = { ...props };
  const formik = useFormik({
    initialValues: {
      searchField: searchCriteria?.searchField,
      filterBy: searchCriteria?.optionalSearchProperties?.[0],
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSearchCriteria({
        searchField: values?.searchField,
        optionalSearchProperties: [values?.filterBy],
      });
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      tw="col-span-3 grid grid-cols-3 gap-4 items-end"
    >
      {featureFlags?.LibrarySearch && (
        <Select
          defaultValue=""
          placeHolder={{ name: "Filter By", value: "" }}
          label="Filter By"
          name="filterBy"
          id={`filter-by`}
          data-testid={`filter-by`}
          inputProps={{
            "data-testid": `filter-by-input`,
          }}
          {...formik.getFieldProps("filterBy")}
          options={renderMenuItemsForFilter([
            "-",
            "Library",
            "Version",
            "Model",
          ])}
        />
      )}
      <TextField
        id="library-search-field"
        name="searchField"
        placeholder="Search"
        type="text"
        fullWidth
        data-testid="library-search"
        label="Search"
        variant="outlined"
        {...formik.getFieldProps("searchField")}
        inputProps={{
          "data-testid": "library-search-input",
          "aria-required": "false",
        }}
        slotProps={{
          input: {
            startAdornment: (
              <IconButton
                type="submit"
                data-testid="search-icon"
                aria-label="Search"
                sx={{ marginTop: "0 !important" }}
              >
                <SearchIcon />
              </IconButton>
            ),
            endAdornment: (
              <IconButton
                aria-label="Clear-Search"
                data-testid="clear-search-icon"
                sx={{
                  visibility: _.isEmpty(formik?.values?.searchField)
                    ? "hidden"
                    : "visible",
                }}
                onClick={() =>
                  setSearchCriteria({
                    searchField: "",
                    optionalSearchProperties: [],
                  })
                }
              >
                <ClearIcon />
              </IconButton>
            ),
          },
        }}
      />
    </form>
  );
};

export default Search;
