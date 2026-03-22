import React, { useCallback, useEffect, useRef, useState } from "react";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import { CqlLibrary, OwnershipType } from "@madie/madie-models";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";
import {
  useDocumentTitle,
  useFeatureFlags,
  useCqlLibraryServiceApi,
} from "@madie/madie-util";
import {
  MadieSpinner,
  Tabs,
  Tab,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { CqlLibraryListActionCenter as ActionCenter } from "./cqlLibraryListActionCenter/CqlLibraryListActionCenter";
import "./CqlLibraryLanding.scss";
import "twin.macro";
import "styled-components/macro";
import queryString from "query-string";
import { useNavigate, useLocation } from "react-router-dom";
import Search from "../librarySearch/Search";
import * as _ from "lodash";
import { getTabStorageKey } from "./cqlLibraryLandingUtils";
import CqlLibraryHistoryDialog from "./CqlLibraryHistoryDialog";
import StatusHandler, {
  INITIAL_STATUS_HANDLER,
} from "../editCqlLibrary/statusHandler/StatusHandler";

const INITIAL_DELETE_DRAFT_STATE = {
  open: false,
  cqlLibrary: null,
};

export interface LibrarySearchCriteria {
  searchField?: string;
  optionalSearchProperties?: string[]; // can be ["LibraryName", "version"] ..etc
  model?: string;
  draft?: boolean;
}

// Maps tab indices to OwnershipType enums
const ownershipTypeMap: Record<number, OwnershipType> = {
  0: OwnershipType.OWNED,
  1: OwnershipType.SHARED,
  2: OwnershipType.ALL,
};

function CqlLibraryLanding() {
  useDocumentTitle("MADiE Libraries");

  let navigate = useNavigate();
  const { search } = useLocation();

  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const [loading, setLoading] = useState(true);
  // utilities for pagination
  const values = queryString.parse(search);
  const activeTab = Number(localStorage.getItem("cqlLibraryPageTab")) || 0;
  const cqlLibraryPageOptions = JSON.parse(
    localStorage.getItem(getTabStorageKey(activeTab))
  ) || { page: 1, limit: 10 };

  const curLimit = cqlLibraryPageOptions?.limit;
  const curPage = cqlLibraryPageOptions?.page;
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [searchCriteria, setSearchCriteria] = useState<LibrarySearchCriteria>({
    searchField: "",
    optionalSearchProperties: [],
  });

  const [selectedLibraries, setSelectedLibraries] = useState<CqlLibrary[]>([]);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [libraryHistoryDialogOpen, setLibraryHistoryDialogOpen] =
    useState(false);
  const [libraryHistoryLogs, setLibraryHistoryLogs] = useState([]);
  const [statusHandler, setStatusHandler] = useState(INITIAL_STATUS_HANDLER);

  const openLibraryHistoryDialog = () => {
    if (selectedLibraries.length === 1) {
      const selectedLibrary = selectedLibraries[0];
      cqlLibraryServiceApi.getLibraryHistory(selectedLibrary).then((data) => {
        setLibraryHistoryLogs(data);
        setLibraryHistoryDialogOpen(true);
      });
    }
  };
  const closeLibraryHistoryDialog = () => {
    setLibraryHistoryLogs([]);
    setLibraryHistoryDialogOpen(false);
  };
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
  const [transferDialog, setTransferDialog] = useState({
    open: false,
    libraries: [],
  });
  const [compareVersionsDialog, setCompareVersionsDialog] =
    useState<boolean>(false);

  // Fetches total count of Owned Libraries, Shared Libraries, and All Libraries
  const [ownedLibrariesCount, setOwnedLibrariesCount] = useState(0);
  const [sharedLibrariesCount, setSharedLibrariesCount] = useState(0);
  const [allLibrariesCount, setAllLibrariesCount] = useState(0);

  // Toast state and handlers
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };

  const fetchTotalCounts = useCallback(async () => {
    try {
      const [ownedLibs, sharedLibs, allLibs] = await Promise.all([
        cqlLibraryServiceApi.fetchCqlLibraries(
          OwnershipType.OWNED,
          1,
          0,
          searchCriteria,
          null,
          null
        ),
        cqlLibraryServiceApi.fetchCqlLibraries(
          OwnershipType.SHARED,
          1,
          0,
          searchCriteria,
          null,
          null
        ),
        cqlLibraryServiceApi.fetchCqlLibraries(
          OwnershipType.ALL,
          1,
          0,
          searchCriteria,
          null,
          null
        ),
      ]);
      setOwnedLibrariesCount(ownedLibs?.totalElements || 0);
      setSharedLibrariesCount(sharedLibs?.totalElements || 0);
      setAllLibrariesCount(allLibs?.totalElements || 0);
    } catch (e) {
      console.error("Error fetching counts", e);
    }
  }, [cqlLibraryServiceApi]);

  useEffect(() => {
    fetchTotalCounts();
  }, []);

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

      const optionalParams = searchCriteria?.optionalSearchProperties ?? [];
      const firstParam = _.trim(optionalParams[0]);

      const modifiedSearchCriteria = {
        ...searchCriteria,
        optionalSearchProperties:
          firstParam && firstParam !== "-" ? [_.camelCase(firstParam)] : [],
      };
      cqlLibraryServiceApi
        .fetchCqlLibraries(
          ownershipTypeMap[tab] ?? OwnershipType.ALL,
          limit,
          page,
          modifiedSearchCriteria,
          relevantSorting,
          abortController.current.signal
        )
        .then((data) => {
          if (limit === "All") {
            const updatedLimit = data.totalElements > 50 ? limit : 50;
            navigate(`?tab=${tab}&page=1&limit=${updatedLimit}`, {
              replace: true,
            });
          }

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
    [cqlLibraryServiceApi, navigate]
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

  // sort logic
  const [sorting, setSorting] = useState(null);
  let sortID = sorting?.[0]?.id;
  if (sortID === "librarySet_acls") {
    sortID = "librarySet.acls";
  }
  const sortingString = sortID ? `${sortID},${sorting[0]?.desc}` : "";
  const handleSort = (sort) => {
    setSorting(sort);
    navigate(`?tab=${activeTab}&page=1&limit=${values?.limit || 10}`);
  };
  // sort logic end.

  // useEffect to fetch libraries
  useEffect(() => {
    const values = queryString.parse(search);
    const tabFromUrl =
      values.tab !== undefined ? Number(values.tab) : activeTab;

    // Update activeTab and localStorage if the tab in the URL differs
    if (tabFromUrl !== activeTab) {
      localStorage.setItem("cqlLibraryPageTab", tabFromUrl.toString());
    }

    const tabStorageKey = getTabStorageKey(tabFromUrl);
    const tabPageOptions = JSON.parse(localStorage.getItem(tabStorageKey)) || {
      page: 1,
      limit: 10,
    };

    // Determine the current page and limit
    const updatedPage = values.page ? Number(values.page) : tabPageOptions.page;
    const updatedLimit = values.limit || tabPageOptions.limit;

    // If query parameters are missing, update the URL
    if (!values.page || !values.limit || values.tab === undefined) {
      navigate(
        `?tab=${tabFromUrl}&page=${updatedPage}&limit=${updatedLimit}`,
        { replace: true } // Use replace to avoid adding unnecessary history entries
      );
    }

    // Save updated page and limit to local storage
    localStorage.setItem(
      tabStorageKey,
      JSON.stringify({
        page: updatedPage,
        limit: updatedLimit,
      })
    );

    retrieveLibraries(
      tabFromUrl,
      updatedLimit,
      updatedPage - 1,
      searchCriteria,
      sortingString
    );
  }, [
    search,
    retrieveLibraries,
    activeTab,
    searchCriteria,
    sortingString,
    navigate,
  ]);

  // Libraries are fetched again, when a new draft or version is created
  const handleTabChange = (event, nextTab) => {
    abortController.current.abort();
    setCqlLibraryList(null);
    const tabStorageKey = getTabStorageKey(nextTab);
    const tabPageOptions = JSON.parse(localStorage.getItem(tabStorageKey)) || {
      page: 1,
      limit: 10,
    };

    const updatedLimit =
      tabPageOptions.limit !== undefined
        ? nextTab === 1 && tabPageOptions.limit === "All"
          ? 50
          : tabPageOptions.limit
        : 10;

    localStorage.setItem("cqlLibraryPageTab", nextTab);
    localStorage.setItem(
      tabStorageKey,
      JSON.stringify({
        page: tabPageOptions.page,
        limit: updatedLimit,
      })
    );

    navigate(
      `?tab=${nextTab}&page=${tabPageOptions.page}&limit=${updatedLimit}`
    );
  };

  // Create new library listener
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

  const onListUpdate = async () => {
    const tabStorageKey = getTabStorageKey(activeTab);
    const tabPageOptions = JSON.parse(localStorage.getItem(tabStorageKey)) || {
      page: 1,
      limit: 10,
    };

    await retrieveLibraries(
      activeTab,
      tabPageOptions.limit,
      tabPageOptions.page - 1,
      searchCriteria,
      sortingString
    );
    await fetchTotalCounts();
  };

  const handlePageChange = (e, v) => {
    const updatedLimit =
      curLimit !== undefined ? (curLimit === "All" ? 50 : curLimit) : 10;
    navigate(`?tab=${activeTab}&page=${v}&limit=${updatedLimit}`);
  };
  return (
    <div id="cql-library-landing" data-testid="cql-library-landing">
      <div className="status-handler-container">
        <StatusHandler {...statusHandler} />
      </div>

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
          style={{ borderBottom: "solid 1px #8c8c8c" }}
        >
          <div>
            <Tabs type="B" value={activeTab} onChange={handleTabChange}>
              <Tab
                type="B"
                label={`Owned Libraries (${ownedLibrariesCount})`}
                data-testid="owned-libraries-tab"
              />
              <Tab
                type="B"
                label={`Shared Libraries (${sharedLibrariesCount})`}
                data-testid="shared-libraries-tab"
              />
              <Tab
                type="B"
                label={`All Libraries (${allLibrariesCount})`}
                data-testid="all-libraries-tab"
              />
            </Tabs>
          </div>
          <span tw="flex-grow" />
        </section>

        <div tw="grid grid-cols-4 gap-4" style={{ padding: 16 }}>
          <Search
            searchCriteria={searchCriteria}
            setSearchCriteria={setSearchCriteria}
            handlePageChange={handlePageChange}
          />
          <div tw="col-start-4 justify-self-end p-3">
            <ActionCenter
              openLibraryHistoryDialog={openLibraryHistoryDialog}
              selectedLibraries={selectedLibraries}
              setDeleteDraftDialog={setDeleteDraftDialog}
              setSelectedCqlLibrary={setSelectedCqlLibrary}
              setCreateDraftDialog={setCreateDraftDialog}
              setShareDialog={setShareDialog}
              createVersion={createVersion}
              owners={owners}
              activeTab={activeTab}
              setTransferDialog={setTransferDialog}
              setCompareVersionsDialog={setCompareVersionsDialog}
            />
          </div>
        </div>
        <div>
          <div className="table">
            {!loading && (
              <CqlLibraryList
                curLimit={curLimit}
                curPage={curPage}
                cqlLibraryList={cqlLibraryList}
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
                transferDialog={transferDialog}
                setTransferDialog={setTransferDialog}
                compareVersionsDialog={compareVersionsDialog}
                setCompareVersionsDialog={setCompareVersionsDialog}
                createDraftDialog={createDraftDialog}
                setCreateDraftDialog={setCreateDraftDialog}
                snackBar={snackBar}
                setSnackBar={setSnackBar}
                setOwners={setOwners}
                sorting={sorting}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                searchCriteria={searchCriteria}
                setToastOpen={setToastOpen}
                setToastMessage={setToastMessage}
                setToastType={setToastType}
                setStatusHandler={setStatusHandler}
              />
            )}
          </div>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <MadieSpinner style={{ height: 50, width: 50 }} />
            </div>
          )}
        </div>
        {libraryHistoryDialogOpen && (
          <CqlLibraryHistoryDialog
            selectedCqlLibrary={selectedLibraries[0]}
            libraryHistoryLogs={libraryHistoryLogs}
            open={libraryHistoryDialogOpen}
            onClose={closeLibraryHistoryDialog}
          />
        )}
        <Toast
          toastKey="library-action-toast"
          aria-live="polite"
          role="alert"
          toastType={toastType}
          testId={`toast-${toastType}`} // Use a consistent testId pattern
          closeButtonProps={{
            "data-testid": "close-toast-button",
          }}
          open={toastOpen}
          message={toastMessage}
          onClose={onToastClose}
          autoHideDuration={6000}
        />
      </div>
    </div>
  );
}

export default CqlLibraryLanding;
