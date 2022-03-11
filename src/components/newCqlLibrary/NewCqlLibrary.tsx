import React, { useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Divider, Tab, Tabs } from "@mui/material";
import useCqlLibraryServiceApi from "../../api/userCqlLibraryServiceApi";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import * as _ from "lodash";

export const NewCqlLibrary = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  useEffect(() => {
    (async () => {
      const cqlLibraries = await cqlLibraryServiceApi.fetchCqlLibraries(
        activeTab === 0
      );
      setCqlLibraryList(() =>
        _.orderBy(cqlLibraries, ["lastModifiedAt"], ["desc"])
      );
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

      <div tw="my-4">
        <CqlLibraryList cqlLibraryList={cqlLibraryList} />
      </div>
    </div>
  );
};
