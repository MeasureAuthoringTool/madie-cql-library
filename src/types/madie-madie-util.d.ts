//madie-madie-util.d.ts
declare module "@madie/madie-util" {
  import { LifeCycleFn } from "single-spa";

  import {
    CqlLibrary,
    Measure,
    Organization,
    Acl,
    OwnershipType,
    ReviewStatus,
    LibraryListDTO,
  } from "@madie/madie-models";
  import { AxiosResponse } from "axios";

  export interface CqlLibraryReview {
    id: string;
    libraryId: string;
    librarySetId: string;
    status: ReviewStatus;
    comment: string;
  }

  import { ValidationResult } from "@madie/madie-editor";
  export function validateContent(
    content: string,
    checkContext: boolean,
    terminologyServiceApi: TerminologyServiceApi,
    qdmApi: QdmElmTranslationServiceApi,
    fhirApi: FhirElmTranslationServiceApi
  ): Promise<ValidationResult>;

  export function getAllErrors(
    content: string,
    checkContext: boolean,
    terminologyServiceApi: TerminologyServiceApi,
    qdmApi: QdmElmTranslationServiceApi,
    fhirApi: FhirElmTranslationServiceApi
  ): Promise<ValidationResult>;

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
    LibraryReviewStatus: boolean;
  }

  export interface UserRoles {
    roles: string[];
    isAdmin: boolean;
    isReviewer: boolean;
  }

  export function useFeatureFlags(): FeatureFlags;
  export function useUserRoles(): UserRoles;

  export function getServiceConfig(): Promise<ServiceConfig>;

  export class OrganizationApi {
    constructor(getAccessToken: () => string);
    getAllOrganizations(): Promise<Organization[]>;
  }

  export function useUserServiceApi(): UserServiceApi;

  export function useTerminologyServiceApi(): TerminologyServiceApi;
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

  export function useOwnerName(harpId: string): string;

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
    fetchReviewLibraries(signal?: any): Promise<LibraryListDTO[]>;
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

  export class CqlLibraryReviewServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    createCqlLibraryReview(
      libraryId: string,
      review: CqlLibraryReview
    ): Promise<CqlLibraryReview>;
    updateCqlLibraryReview(
      libraryId: string,
      review: CqlLibraryReview
    ): Promise<CqlLibraryReview>;
    getCqlLibraryReview(libraryId: string): Promise<CqlLibraryReview | null>;
    getCqlLibraryReviewsByLibrarySetId(
      librarySetId: string
    ): Promise<CqlLibraryReview[]>;
  }

  export function useCqlLibraryServiceApi(): CqlLibraryServiceApi;
  export function useCqlLibraryReviewServiceApi(): CqlLibraryReviewServiceApi;

  export function ManageReviewDialog(props: {
    open: boolean;
    onClose: () => void;
    entityType: "measure" | "library";
    entityId?: string;
    entitySetId?: string;
    onSuccess?: () => void | Promise<void>;
  }): React.ReactElement | null;
}
