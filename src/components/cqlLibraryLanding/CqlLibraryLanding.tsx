import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import { CqlLibraryListActionCenter as ActionCenter } from "./cqlLibraryListActionCenter/CqlLibraryListActionCenter";
import { CqlLibrary } from "@madie/madie-models";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";
import { useDocumentTitle, useFeatureFlags } from "@madie/madie-util";
import {
  MadieSpinner,
  Button,
  Tabs,
  Tab,
} from "@madie/madie-design-system/dist/react";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import "./CqlLibraryLanding.scss";

import queryString from "query-string";
import { useNavigate, useLocation } from "react-router-dom";

const INITIAL_DELETE_DRAFT_STATE = {
  open: false,
  cqlLibrary: null,
};

function CqlLibraryLanding() {
  useDocumentTitle("MADiE Libraries");
  const featureFlags = useFeatureFlags();
  let navigate = useNavigate();
  const { search } = useLocation();

  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const [loading, setLoading] = useState(true);
  // utilities for pagination
  const values = queryString.parse(search);
  const cqlLibraryPageOptions = JSON.parse(
    window.localStorage.getItem("cqlLibraryPageOptions")
  );
  const curLimit = cqlLibraryPageOptions?.limit
    ? cqlLibraryPageOptions.limit
    : values.limit
    ? values.limit
    : 10;
  const curPage = cqlLibraryPageOptions?.page
    ? cqlLibraryPageOptions.page
    : values.page
    ? Number(values.page)
    : 1;
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const activeTab: number = values.tab ? Number(values.tab) : 0;
  const [offset, setOffset] = useState<number>(0);
  const [searchCriteria, setSearchCriteria] = useState<String>(null);

  const [selectedLibraries, setSelectedLibraries] = useState<CqlLibrary[]>([]);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [filter, setFilter] = useState("");
  const abortController = useRef<AbortController | null>(null);
  const [selectedCQLLibrary, setSelectedCqlLibrary] =
    useState<CqlLibrary>(null);

  const [deleteDraftDialog, setDeleteDraftDialog] = useState({
    ...INITIAL_DELETE_DRAFT_STATE,
  });
  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    cqlLibraryId: "",
    cqlLibraryError: false,
    isCqlPresent: false,
  });
  const [createDraftDialog, setCreateDraftDialog] = useState({
    open: false,
    cqlLibrary: null,
  });
  const [owners, setOwners] = useState([]);
  const [snackBar, setSnackBar] = useState({
    message: "",
    open: false,
    severity: "",
  });
  const [shareDialog, setShareDialog] = useState({ open: false, option: "" });

  // Fetches total count of My Libraries and All Libraries
  const [myLibrariesCount, setMyLibrariesCount] = useState(0);
  const [allLibrariesCount, setAllLibrariesCount] = useState(0);
  const fetchTotalCounts = useCallback(async () => {
    try {
      const [myLibs, allLibs] = await Promise.all([
        cqlLibraryServiceApi.fetchCqlLibraries(true, 1, 0, "", null, null),
        cqlLibraryServiceApi.fetchCqlLibraries(false, 1, 0, "", null, null),
      ]);
      setMyLibrariesCount(myLibs?.totalElements || 0);
      setAllLibrariesCount(allLibs?.totalElements || 0);
    } catch (e) {
      console.error("Error fetching counts", e);
    }
  }, [cqlLibraryServiceApi]);

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

  const retrieveLibraries = useCallback(
    async (tab, limit, page, searchCriteria, relevantSorting) => {
      setLoading(true);
      abortController.current = new AbortController();
      cqlLibraryServiceApi
        .fetchCqlLibraries(
          tab === 0,
          limit === "All" ? 1000 : limit, // if limit is "All", set it to a high number to fetch all results
          page,
          searchCriteria,
          relevantSorting,
          abortController.current.signal
        )
        .then((data) => {
          setPageProps(data);
        })
        .catch((error) => {
          if (error.message != "canceled") {
            setSnackBar({
              message: "An error occurred while fetching the CQL Library!",
              open: true,
              severity: "error",
            });
          }
        })
        .finally(() => {
          return setLoading(false);
        });
    },
    [cqlLibraryServiceApi]
  );

  const setPageProps = (data) => {
    if (data) {
      const { content, totalPages, totalElements, numberOfElements, pageable } =
        data;
      setTotalPages(totalPages);
      setTotalItems(totalElements);
      setVisibleItems(numberOfElements);
      setCqlLibraryList(content);
      setOffset(pageable.offset);
    }
  };

  useEffect(() => {
    fetchTotalCounts();
  }, []);
  // sort logic
  const [sorting, setSorting] = useState(null);
  let sortID = sorting?.[0]?.id;
  if (sortID === "librarySet_acls") {
    sortID = "librarySet.acls";
  }
  const sortingString = sortID ? `${sortID},${sorting[0]?.desc}` : "";
  const handleSort = (sort) => {
    if (featureFlags?.LibrarySearch) {
      setSorting(sort);
      navigate(`?tab=${activeTab}&page=1&limit=${values?.limit || 10}`);
    }
  };
  // sort logic end.

  useEffect(() => {
    retrieveLibraries(
      activeTab,
      curLimit === undefined ? 10 : curLimit,
      curPage - 1,
      searchCriteria,
      sortingString
    );
  }, [
    retrieveLibraries,
    activeTab,
    curLimit,
    curPage,
    cqlLibraryServiceApi,
    searchCriteria,
    sortingString,
  ]);
  // Libraries are fetched again, when a new draft or version is created
  const handleTabChange = (event, nextTab) => {
    abortController.current.abort();
    setCqlLibraryList(null);
    const limit = values?.limit || 10;
    //when switching tabs to all libraries, All libraries option is not available so we set limit to max val
    const updatedLimit = activeTab === 0 && limit === "All" ? 50 : limit;
    localStorage.setItem(
      "cqlLibraryPageOptions",
      JSON.stringify({
        page: 1,
        limit: updatedLimit,
      })
    );

    navigate(`?tab=${nextTab}&page=1&limit=${updatedLimit}`);
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
    if (filter) {
      // handle null to string edge
      setSearchCriteria(filter.trim());
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
          setSearchCriteria("");
          setFilter(""); // probably could also be a q param,
        }}
      >
        <ClearIcon />
      </IconButton>
    ),
  };

  const onListUpdate = async () => {
    await retrieveLibraries(
      activeTab,
      curLimit,
      0,
      searchCriteria,
      sortingString
    );
    await fetchTotalCounts();
  };

  return (
    <div id="cql-library-landing" data-testid="cql-library-landing">
      <CreateNewLibraryDialog
        open={createLibOpen}
        onSuccess={onListUpdate}
        onClose={() => {
          setCreateLibOpen(false);
        }}
      />
      <div className="cql-library-table">
        <section
          tw="flex flex-row"
          style={{ borderBottom: "1px solid #8c8c8c" }}
        >
          <div>
            <Tabs type="B" value={activeTab} onChange={handleTabChange}>
              <Tab
                type="B"
                label={`My Libraries(${myLibrariesCount})`}
                data-testid="my-cql-libraries-tab"
              />
              <Tab
                type="B"
                label={`All Libraries(${allLibrariesCount})`}
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
                    setShareDialog={setShareDialog}
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
                cqlLibraryList={cqlLibraryList}
                curLimit={curLimit}
                offset={offset}
                activeTab={activeTab}
                totalPages={totalPages}
                visibleItems={visibleItems}
                totalItems={totalItems}
                onListUpdate={onListUpdate}
                setSelectedLibraries={setSelectedLibraries}
                deleteDraftDialog={deleteDraftDialog}
                setDeleteDraftDialog={setDeleteDraftDialog}
                selectedCQLLibrary={selectedCQLLibrary}
                setSelectedCqlLibrary={setSelectedCqlLibrary}
                createVersionDialog={createVersionDialog}
                setCreateVersionDialog={setCreateVersionDialog}
                shareDialog={shareDialog}
                setShareDialog={setShareDialog}
                createDraftDialog={createDraftDialog}
                setCreateDraftDialog={setCreateDraftDialog}
                snackBar={snackBar}
                setSnackBar={setSnackBar}
                setOwners={setOwners}
                sorting={sorting}
                handleSort={handleSort}
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
