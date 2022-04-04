import React from "react";
import "twin.macro";
import "styled-components/macro";
import { useHistory } from "react-router-dom";
import CqlLibrary from "../../models/CqlLibrary";

export default function CqlLibraryList(props: {
  cqlLibraryList: CqlLibrary[];
}) {
  const history = useHistory();

  return (
    <div data-testid="cqlLibrary-list">
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div tw="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table tw="min-w-full divide-y divide-gray-200">
                <thead tw="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Model
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.cqlLibraryList?.map((cqlLibrary) => (
                    <tr key={cqlLibrary.id} tw="bg-white">
                      <td tw="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          type="button"
                          onClick={() =>
                            history.push(`/cql-libraries/${cqlLibrary.id}/edit`)
                          }
                          data-testid={`cqlLibrary-button-${cqlLibrary.id}`}
                        >
                          {cqlLibrary.cqlLibraryName}
                        </button>
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          type="button"
                          onClick={() =>
                            history.push(`/cql-libraries/${cqlLibrary.id}/edit`)
                          }
                          data-testid={`cqlLibrary-button-${cqlLibrary.id}-model`}
                        >
                          {cqlLibrary.model}
                        </button>
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            history.push(`/cql-libraries/${cqlLibrary.id}/edit`)
                          }
                          tw="text-blue-600 hover:text-blue-900"
                          data-testid={`edit-cqlLibrary-${cqlLibrary.id}`}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
