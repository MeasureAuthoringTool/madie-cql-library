import React, { useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Divider, Tab, Tabs } from "@mui/material";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import * as _ from "lodash";
import { useHistory } from "react-router-dom";

const NewCqlLibrary = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState(0);
  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  useEffect(() => {
    (async () => {
      const cqlLibraries = await cqlLibraryServiceApi.fetchCqlLibraries(
        activeTab === 0
      );
      setCqlLibraryList(() => _.orderBy(cqlLibraries, ["createdAt"], ["desc"]));
    })();
  }, [activeTab, cqlLibraryServiceApi]);

  const handleTabChange = (event, nextTab) => {
    setActiveTab(nextTab);
  };

  return (
    <div tw="mx-12 mt-5">
      <section tw="flex flex-row my-2">
        <h1 tw="text-4xl font-light">CQL Library</h1>
        <span tw="flex-grow" />
        <button
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
        <CqlLibraryList cqlLibraryList={cqlLibraryList} />
      </div>
    </div>
  );
};

export default NewCqlLibrary;
