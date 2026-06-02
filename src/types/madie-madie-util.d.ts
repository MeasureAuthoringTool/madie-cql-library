declare module "@madie/madie-util" {
  import { LifeCycleFn } from "single-spa";
  // import { Measure } from "@madie/madie-models/dist/Measure";
  import {
    CqlLibrary,
    Measure,
    Organization,
    Acl,
    UserDetails,
    OwnershipType,
  } from "@madie/madie-models";
  import { AxiosResponse } from "axios";
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
    MinimizeAlerts: boolean;
    qiCore7: boolean;
    usQualityCore: boolean;
  }

  export interface UserRoles {
    roles: string[];
    isAdmin: boolean;
  }

  export function useFeatureFlags(): FeatureFlags;
  export function useUserRoles(): UserRoles;

  export function getServiceConfig(): Promise<ServiceConfig>;

  export class OrganizationApi {
    constructor(getAccessToken: () => string);
    getAllOrganizations(): Promise<Organization[]>;
  }

  export function useUserServiceApi(): UserServiceApi;

  export function useOrganizationApi(): OrganizationApi;
  export function useUserServiceApi(): UserServiceApi;

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

  export function useIsRoleOrFeatureEnabled(feature: string): boolean;

  export type AuditRow = {
    actionType: string;
    additionalActionMessage: string;
    performedAt: string;
    performedBy: string;
  };

  export class CqlLibraryServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    fetchCqlLibraries(
      ownershipType: OwnershipType,
      limit: string | number,
      page: number,
      searchCriteria: any,
      sortInfo: any,
      signal: any
    ): Promise<any>;
    fetchCqlLibrary(id: string): Promise<CqlLibrary>;
    createCqlLibrary(cqlLibrary: CqlLibrary): Promise<void>;
    updateCqlLibrary(cqlLibrary: CqlLibrary): Promise<any>;
    createVersion(
      id: string,
      isMajor: boolean
    ): Promise<AxiosResponse<CqlLibrary>>;
    createDraft(
      cqlLibraryId: string,
      cqlLibraryName: string,
      model: string
    ): Promise<AxiosResponse<CqlLibrary>>;
    deleteDraft(id: string): Promise<AxiosResponse<CqlLibrary>>;
    fetchAllOwners(librarySetIds: string[]): Promise<any>;
    getCqlDiff(oldLibraryId: string, newLibraryId: string): Promise<any>;
    shareLibraries(libraries: Map<string, string[]>): Promise<any>;
    getSharedLibraries(libraryIds: string[]): Promise<any>;
    getRecentLibrariesByLibrarySetId(librarySetIds: string[]): Promise<any>;
    unshareLibraries(libraryUserIdMap: Map<string, string[]>): Promise<any>;
    getLibrariesByLibrarySetId(
      librarySetId: string,
      sortByLatestVersion?: boolean,
      librarySearchCriteria?: any
    ): Promise<any>;
    getLibraryHistory(selectedLibrary: CqlLibrary): Promise<AuditRow[]>;
    lockLibrary(libraryId: string): Promise<any>;
    unlockLibrary(libraryId: string): Promise<any>;
    getSharedAccessReportForLibraries(ids: Array<string>): Promise<Blob>;
    transferLibraries(
      libraryIds: Array<string>,
      harpId: string,
      retainShareAccess: boolean
    ): Promise<any>;
    unlockLibraries(): Promise<String>;
  }
  export function useCqlLibraryServiceApi(): CqlLibraryServiceApi;
}
