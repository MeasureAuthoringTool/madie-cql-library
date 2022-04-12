import React, { useCallback, useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Divider, Tab, Tabs } from "@mui/material";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import * as _ from "lodash";
import { useHistory } from "react-router-dom";
import CqlLibrary from "../../models/CqlLibrary";

function CqlLibraryLanding() {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState(0);
  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  // Libraries are fetched again, when a new draft or version is created
  const loadCqlLibraries = useCallback(async () => {
    const cqlLibraries: CqlLibrary[] =
      await cqlLibraryServiceApi.fetchCqlLibraries(activeTab === 0);
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

  return (
    <div tw="mx-12 mt-5">
      <section tw="flex flex-row my-2">
        <h1 tw="text-4xl font-light">CQL Library</h1>
        <span tw="flex-grow" />
        <button
          tw="bg-blue-700 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
          onClick={() => history.push("/cql-libraries/create")}
          data-testid="create-new-cql-library-button"
        >
          New Cql Library
        </button>
      </section>
      <section tw="flex flex-row">
        <div>
          <Tabs value={activeTab} onChange={handleTabChange} tw="flex flex-row">
            <Tab
              label={`My CQL Libraries`}
              data-testid="my-cql-libraries-tab"
            />
            <Tab
              label="All CQL Libraries"
              data-testid="all-cql-libraries-tab"
            />
          </Tabs>
          <Divider />
        </div>
        <span tw="flex-grow" />
      </section>

      <div tw="my-4" data-testid="cql-library-list">
        <CqlLibraryList
          cqlLibraryList={cqlLibraryList}
          onListUpdate={loadCqlLibraries}
        />
      </div>
    </div>
  );
}

export default CqlLibraryLanding;
