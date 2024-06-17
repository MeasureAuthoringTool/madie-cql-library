declare module "@madie/madie-util" {
  import { LifeCycleFn } from "single-spa";
  // import { Measure } from "@madie/madie-models/dist/Measure";
  import { CqlLibrary, Measure, Organization, Acl } from "@madie/madie-models";
  export interface OktaConfig {
    baseUrl: string;
    issuer: string;
    clientId: string;
    redirectUri: string;
  }

  export interface ServiceConfig {
    measureService: {
      baseUrl: string;
    };
    elmTranslationService: {
      baseUrl: string;
    };
  }
  export interface RouteHandlerState {
    canTravel: boolean;
    pendingRoute: string;
  }

  export const measureStore: {
    subscribe: (
      setMeasureState: React.Dispatch<React.SetStateAction<Measure>>
    ) => import("rxjs").Subscription;
    updateMeasure: (measure: Measure | null) => void;
    initialState: null;
    state: Measure;
  };

  export const routeHandlerStore: {
    subscribe: (
      setRouteHandlerState: React.Dispatch<React.SetStateAction<object>>
    ) => import("rxjs").Subscription;
    updateRouteHandlerState: (routeHandlerState: RouteHandlerState) => void;
    initialState: RouteHandlerState;
    state: RouteHandlerState;
  };

  export const cqlLibraryStore: {
    subscribe: (
      setLibrary: React.Dispatch<React.SetStateAction<CqlLibrary>>
    ) => import("rxjs").Subscription;
    updateLibrary: (measure: CqlLibrary | null) => void;
    initialState: null;
    state: CqlLibrary;
  };

  interface FeatureFlags {
    qdmExport: boolean;
  }

  export function useFeatureFlags(): FeatureFlags;

  export function getServiceConfig(): Promise<ServiceConfig>;

  export class OrganizationApi {
    constructor(getAccessToken: () => string);
    getAllOrganizations(): Promise<Organization[]>;
  }
  export function useOrganizationApi(): OrganizationApi;

  export function useKeyPress(targetKey: any): boolean;
  export const useOktaTokens: (storageKey?: string) => {
    getAccessToken: () => any;
    getAccessTokenObj: () => any;
    getUserName: () => any;
    getIdToken: () => any;
    getIdTokenObj: () => any;
  };
  export function checkUserCanEdit(
    createdBy: string,
    acls: Array<Acl>
  ): boolean;
  export function useOnClickOutside(ref: any, handler: any): void;

  export function useDocumentTitle(
    title: string,
    prevailOnMount?: boolean
  ): void;

  export function checkUserCanDelete(
    createdBy: string,
    draft?: boolean
  ): boolean;

  export function wafIntercept(): void;

  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
}
