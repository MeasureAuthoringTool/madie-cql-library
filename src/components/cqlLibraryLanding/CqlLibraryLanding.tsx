import React, { useCallback, useEffect, useRef, useState } from "react";
import { Divider, TextField, IconButton } from "@mui/material";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import { CqlLibraryListActionCenter as ActionCenter } from "./cqlLibraryListActionCenter/CqlLibraryListActionCenter";
import * as _ from "lodash";
import { CqlLibrary } from "@madie/madie-models";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";
import { useDocumentTitle, useFeatureFlags } from "@madie/madie-util";
import {
  MadieSpinner,
  Button,
  Tabs,
  Tab,
} from "@madie/madie-design-system/dist/react";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

const INITIAL_DELETE_DRAFT_STATE = {
  open: false,
  cqlLibrary: null,
};

function CqlLibraryLanding() {
  useDocumentTitle("MADiE Libraries");
  const featureFlags = useFeatureFlags();
  const [activeTab, setActiveTab] = useState(0);
  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLibraries, setSelectedLibraries] = useState<CqlLibrary[]>([]);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [filter, setFilter] = useState("");
  const [currentFilter, setCurrentFilter] = useState("");
  const abortController = useRef(null);
  const [selectedCQLLibrary, setSelectedCqlLibrary] =
    useState<CqlLibrary>(null);

  const [deleteDraftDialog, setDeleteDraftDialog] = useState({
    ...INITIAL_DELETE_DRAFT_STATE,
  });
  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    cqlLibraryId: "",
    cqlLibraryError: null,
    isCqlPresent: undefined,
  });
  const [createDraftDialog, setCreateDraftDialog] = useState({
    open: false,
    cqlLibrary: null,
  });
  const [owners, setOwners] = useState([]);
  const [snackBar, setSnackBar] = useState({
    message: "",
    open: false,
    severity: null,
  });

  const createVersion = async () => {
    await cqlLibraryServiceApi
      .fetchCqlLibrary(selectedLibraries[0].id)
      .then((cqlLibrary) => {
        setSelectedCqlLibrary(cqlLibrary);
        setCreateVersionDialog({
          open: true,
          cqlLibraryId: cqlLibrary.id,
          cqlLibraryError: cqlLibrary.cqlErrors,
          isCqlPresent: cqlLibrary && cqlLibrary.cql?.trim().length > 0,
        });
      })
      .catch(() => {
        setSnackBar({
          message: "An error occurred while fetching the CQL Library!",
          open: true,
          severity: "error",
        });
      });
  };

  // Libraries are fetched again, when a new draft or version is created
  const loadCqlLibraries = useCallback(async () => {
    abortController.current = new AbortController();
    const cqlLibraries: CqlLibrary[] =
      await cqlLibraryServiceApi.fetchCqlLibraries(
        activeTab === 0,
        abortController.current.signal
      );
    setLoading(false);
    return setCqlLibraryList(() =>
      _.orderBy(cqlLibraries, ["createdAt"], ["desc"])
    );
  }, [activeTab, cqlLibraryServiceApi]);

  useEffect(() => {
    (async () => await loadCqlLibraries())();
  }, [activeTab, cqlLibraryServiceApi, loadCqlLibraries]);

  //If a filter exists then this will set it again on tab change
  useEffect(() => {
    if (cqlLibraryList != null && cqlLibraryList.length > 0) {
      setCurrentFilter(filter);
    }
  }, [cqlLibraryList]);

  const handleTabChange = (event, nextTab) => {
    setCqlLibraryList(null);
    setCurrentFilter("");
    setActiveTab(nextTab);
    abortController.current && abortController.current.abort();
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
    if (cqlLibraryList != null && cqlLibraryList.length > 0) {
      setCurrentFilter(filter);
    }
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
          style={{ borderBottom: "1px solid #8c8c8c" }}
        >
          <div>
            <Tabs type="B" value={activeTab} onChange={handleTabChange}>
              <Tab
                type="B"
                label={`My CQL Libraries`}
                data-testid="my-cql-libraries-tab"
              />
              <Tab
                type="B"
                label="All CQL Libraries"
                data-testid="all-cql-libraries-tab"
              />
            </Tabs>
          </div>
          <span tw="flex-grow" />
        </section>
        <div>
          <form onSubmit={submitFilter}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <TextField
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#8C8C8C",
                      borderRadius: "3px",
                    },
                  }}
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
                <Button
                  style={{ marginLeft: 10, marginBottom: 20 }}
                  type="submit"
                  data-testid="library-filter-submit"
                >
                  Filter
                </Button>
              </div>
              {featureFlags?.LibraryListButtons && (
                <div className="action-center-holder">
                  <ActionCenter
                    libraries={selectedLibraries}
                    setDeleteDraftDialog={setDeleteDraftDialog}
                    setSelectedCqlLibrary={setSelectedCqlLibrary}
                    setCreateDraftDialog={setCreateDraftDialog}
                    createVersion={createVersion}
                    owners={owners}
                  />
                </div>
              )}
            </div>
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
                setSelectedLibraries={setSelectedLibraries}
                deleteDraftDialog={deleteDraftDialog}
                setDeleteDraftDialog={setDeleteDraftDialog}
                selectedCQLLibrary={selectedCQLLibrary}
                setSelectedCqlLibrary={setSelectedCqlLibrary}
                createVersionDialog={createVersionDialog}
                setCreateVersionDialog={setCreateVersionDialog}
                createDraftDialog={createDraftDialog}
                setCreateDraftDialog={setCreateDraftDialog}
                snackBar={snackBar}
                setSnackBar={setSnackBar}
                setOwners={setOwners}
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
