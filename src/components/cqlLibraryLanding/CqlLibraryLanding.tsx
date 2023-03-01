import React, { useCallback, useEffect, useRef, useState } from "react";
import { Divider, Tab, Tabs, TextField, IconButton } from "@mui/material";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import * as _ from "lodash";
import { CqlLibrary } from "@madie/madie-models";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";
import { useDocumentTitle } from "@madie/madie-util";
import { MadieSpinner, Button } from "@madie/madie-design-system/dist/react";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

function CqlLibraryLanding() {
  useDocumentTitle("MADiE Libraries");
  const [activeTab, setActiveTab] = useState(0);
  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [filter, setFilter] = useState("");
  const [currentFilter, setCurrentFilter] = useState("");

  // Libraries are fetched again, when a new draft or version is created
  const loadCqlLibraries = useCallback(async () => {
    const cqlLibraries: CqlLibrary[] =
      await cqlLibraryServiceApi.fetchCqlLibraries(activeTab === 0);
    setLoading(false);
    return setCqlLibraryList(() =>
      _.orderBy(cqlLibraries, ["createdAt"], ["desc"])
    );
  }, [activeTab, cqlLibraryServiceApi]);

  useEffect(() => {
    (async () => await loadCqlLibraries())();
  }, [activeTab, cqlLibraryServiceApi, loadCqlLibraries]);

  const handleTabChange = (event, nextTab) => {
    setActiveTab(nextTab);
  };
  // Create Dialog utilities
  const [createLibOpen, setCreateLibOpen] = useState<boolean>(false);
  useEffect(() => {
    const openCreateLibraryDialogListener = () => {
      setCreateLibOpen(true);
    };
    window.addEventListener(
      "openCreateLibraryDialog",
      openCreateLibraryDialogListener,
      false
    );
    return () => {
      window.removeEventListener(
        "openCreateLibraryDialog",
        openCreateLibraryDialogListener,
        false
      );
    };
  }, []);

  const submitFilter = (e) => {
    e.preventDefault();
    setFilter(filter.trim());
    setCurrentFilter(filter);
  };

  const searchInputProps = {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon />
      </InputAdornment>
    ),
    endAdornment: (
      <IconButton
        aria-label="Clear-Search"
        onClick={() => {
          setFilter("");
          setCurrentFilter("");
        }}
      >
        <ClearIcon />
      </IconButton>
    ),
  };

  return (
    <div id="cql-library-landing" data-testid="cql-library-landing">
      <CreateNewLibraryDialog
        open={createLibOpen}
        onSuccess={loadCqlLibraries}
        onClose={() => {
          setCreateLibOpen(false);
        }}
      />
      <div className="measure-table">
        <section
          tw="flex flex-row"
          style={{ borderBottom: "1px solid #b0b0b0" }}
        >
          <div>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                fontWeight: 700,
                color: "#003366",
                "& .MuiTabs-indicator": {
                  height: "4px",
                  backgroundColor: "#0073C8",
                },
                "& .Mui-selected": {
                  fontWeight: 500,
                  color: "#003366 !important",
                },
              }}
            >
              <Tab
                sx={{
                  padding: "24px 21px",
                  fontFamily: "Rubik, sans serif",
                  borderRadius: "6px 0 0 0",
                  fontWeight: 400,
                  color: "#003366",
                }}
                label={`My CQL Libraries`}
                data-testid="my-cql-libraries-tab"
              />
              <Tab
                sx={{
                  padding: "24px 21px",
                  fontFamily: "Rubik, sans serif",
                  borderRadius: "0 6px 0 0",
                  fontWeight: 400,
                  color: "#003366",
                }}
                label="All CQL Libraries"
                data-testid="all-cql-libraries-tab"
              />
            </Tabs>
          </div>
          <span tw="flex-grow" />
        </section>
        <div>
          <form onSubmit={submitFilter}>
            <table style={{ marginLeft: 20, marginTop: 20, marginBottom: 20 }}>
              <thead>
                <tr>
                  <td>
                    <TextField
                      label="Filter Libraries"
                      onChange={(newFilter) => {
                        setFilter(newFilter.target.value);
                      }}
                      type="search"
                      inputProps={{
                        "data-testid": "library-filter-input",
                        "aria-required": "false",
                      }}
                      InputProps={searchInputProps}
                      value={filter}
                    />
                  </td>{" "}
                  <td>
                    <Button
                      style={{ marginLeft: 10, marginBottom: 20 }}
                      type="submit"
                      data-testid="library-filter-submit"
                    >
                      Filter
                    </Button>
                  </td>
                </tr>
              </thead>
            </table>
          </form>
        </div>
        <div>
          <div className="table">
            {!loading && (
              <CqlLibraryList
                cqlLibraryList={
                  currentFilter == ""
                    ? cqlLibraryList
                    : cqlLibraryList.filter((library) =>
                        library.cqlLibraryName
                          .toLowerCase()
                          .includes(currentFilter.toLowerCase())
                      )
                }
                onListUpdate={loadCqlLibraries}
              />
            )}
          </div>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <MadieSpinner style={{ height: 50, width: 50 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CqlLibraryLanding;
