"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@testing-library/jest-dom");
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required
var React = require("react");
var react_1 = require("@testing-library/react");
var test_utils_1 = require("react-dom/test-utils");
var user_event_1 = require("@testing-library/user-event");
var CreateNewLibraryDialog_1 = require("./CreateNewLibraryDialog");
var madie_models_1 = require("@madie/madie-models");
var ServiceContext_1 = require("../../api/ServiceContext");
var madie_util_1 = require("@madie/madie-util");
var getByTestId = react_1.screen.getByTestId, findByTestId = react_1.screen.findByTestId;
var cqlLibrary = [
    {
        id: "622e1f46d1fd3729d861e6cb",
        cqlLibraryName: "TestCqlLibrary1",
        model: madie_models_1.Model.QICORE,
        createdAt: null,
        createdBy: null,
        lastModifiedAt: null,
        lastModifiedBy: null,
    },
];
var organizations = [
    {
        id: "1234",
        name: "Org1",
        oid: "1.2.3.4",
    },
    {
        id: "56789",
        name: "Org2",
        oid: "5.6.7.8",
    },
];
var serviceConfig = {
    measureService: {
        baseUrl: "madie.com",
    },
    elmTranslationService: {
        baseUrl: "elm-translator.com",
    },
    cqlLibraryService: {
        baseUrl: "cql-library.com",
    },
    terminologyService: {
        baseUrl: "terminology.com",
    },
};
var mockCqlLibraryServiceApi = {
    fetchCqlLibraries: jest.fn().mockResolvedValue(cqlLibrary),
    createCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary),
};
jest.mock("@madie/madie-util", function () { return ({
    useOktaTokens: function () { return ({
        getAccessToken: function () { return "test.jwt"; },
    }); },
    useOrganizationApi: jest.fn(function () { return ({
        getAllOrganizations: jest.fn().mockResolvedValue(organizations),
    }); }),
    useFeatureFlags: jest.fn(function () {
        return {
            qiCore6: false,
            qiCore7: false,
            usQualityCore: false,
        };
    }),
    useCqlLibraryServiceApi: jest.fn(function () { return mockCqlLibraryServiceApi; }),
}); });
var formikInfo = {
    cqlLibraryName: "",
    model: "",
    cql: "",
    publisher: "",
    description: "",
    draft: true,
};
var onFormSubmit = jest.fn();
var onFormCancel = jest.fn();
var usQualityCoreModel = madie_models_1.Model.US_QUALITY_0_5_0;
describe("Library Dialog", function () {
    afterEach(function () {
        jest.clearAllMocks();
    });
    test("An open Dialog has all the required elements", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_utils_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var _a, _b, _c, _d, _e, _f, _g, _h, cancelButton, submitButton, libraryNameNode, modelSelect, modelNode;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0:
                                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
          <div>
            <button data-testId="open-button" onClick={onFormSubmit}>
              I open the dialog
            </button>
            <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
          </div>
        </ServiceContext_1.ApiContextProvider>);
                                    _a = expect;
                                    return [4 /*yield*/, findByTestId("dialog-form")];
                                case 1:
                                    _a.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    _b = expect;
                                    return [4 /*yield*/, findByTestId("cql-library-name-text-field")];
                                case 2:
                                    _b.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    _c = expect;
                                    return [4 /*yield*/, findByTestId("cql-library-name-text-field-input")];
                                case 3:
                                    _c.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    _d = expect;
                                    return [4 /*yield*/, findByTestId("cql-library-model-select")];
                                case 4:
                                    _d.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    _e = expect;
                                    return [4 /*yield*/, findByTestId("cql-library-model-select-input")];
                                case 5:
                                    _e.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    _f = expect;
                                    return [4 /*yield*/, findByTestId("cql-library-description")];
                                case 6:
                                    _f.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    _g = expect;
                                    return [4 /*yield*/, findByTestId("publisher")];
                                case 7:
                                    _g.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    _h = expect;
                                    return [4 /*yield*/, findByTestId("continue-button")];
                                case 8:
                                    _h.apply(void 0, [_j.sent()]).toBeInTheDocument();
                                    return [4 /*yield*/, findByTestId("cql-library-cancel-button")];
                                case 9:
                                    cancelButton = _j.sent();
                                    expect(cancelButton).toBeInTheDocument();
                                    expect(cancelButton).toBeEnabled();
                                    return [4 /*yield*/, findByTestId("continue-button")];
                                case 10:
                                    submitButton = _j.sent();
                                    expect(submitButton).toBeInTheDocument();
                                    expect(submitButton).toBeDisabled();
                                    libraryNameNode = getByTestId("cql-library-name-text-field-input");
                                    user_event_1.default.type(libraryNameNode, formikInfo.cqlLibraryName);
                                    expect(libraryNameNode.value).toBe(formikInfo.cqlLibraryName);
                                    test_utils_1.Simulate.change(libraryNameNode);
                                    modelSelect = getByTestId("cql-library-model-select");
                                    react_1.fireEvent.click(modelSelect);
                                    modelNode = getByTestId("cql-library-model-select-input");
                                    react_1.fireEvent.select(modelNode, { target: { value: formikInfo.model } });
                                    expect(modelNode.value).toBe(formikInfo.model);
                                    test_utils_1.Simulate.change(modelNode);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test("Allows creation of a QDM library", function () { return __awaiter(void 0, void 0, void 0, function () {
        var cancelButton, submitButton, libraryName, libraryDescription, modelSelect, modelSelectComboBox, options, publisherSelect, publisherListbox, publisherOptions, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    return [4 /*yield*/, findByTestId("cql-library-cancel-button")];
                case 1:
                    cancelButton = _b.sent();
                    expect(cancelButton).toBeInTheDocument();
                    expect(cancelButton).toBeEnabled();
                    return [4 /*yield*/, findByTestId("continue-button")];
                case 2:
                    submitButton = _b.sent();
                    expect(submitButton).toBeInTheDocument();
                    expect(submitButton).toBeDisabled();
                    libraryName = react_1.screen.getByRole("textbox", {
                        name: "Library Name",
                    });
                    user_event_1.default.type(libraryName, "QdmLibrary_1");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(libraryName.value).toEqual("QdmLibrary_1"); })];
                case 3:
                    _b.sent();
                    libraryDescription = react_1.screen.getByRole("textbox", {
                        name: "Description",
                    });
                    user_event_1.default.type(libraryDescription, "QDM Library Description");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            return expect(libraryDescription.value).toEqual("QDM Library Description");
                        })];
                case 4:
                    _b.sent();
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 5:
                    options = _b.sent();
                    expect(options.length).toEqual(3);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: madie_models_1.Model.QDM_5_6 }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual("QDM v5.6");
                    publisherSelect = react_1.screen.getByRole("combobox", { name: "Publisher" });
                    user_event_1.default.click(publisherSelect);
                    publisherListbox = react_1.screen.getByRole("listbox", { name: "Publisher" });
                    return [4 /*yield*/, (0, react_1.within)(publisherListbox).findAllByRole("option")];
                case 6:
                    publisherOptions = _b.sent();
                    expect(publisherOptions.length).toEqual(2);
                    user_event_1.default.click(publisherOptions[1]);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(publisherSelect).toHaveValue("Org2"); })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(submitButton).not.toBeDisabled(); })];
                case 8:
                    _b.sent();
                    user_event_1.default.click(submitButton);
                    _a = expect;
                    return [4 /*yield*/, react_1.screen.findByText("Cql Library successfully created")];
                case 9:
                    _a.apply(void 0, [_b.sent()]).toBeInTheDocument();
                    expect(mockCqlLibraryServiceApi.createCqlLibrary).toHaveBeenCalledWith(expect.objectContaining({
                        cqlLibraryName: "QdmLibrary_1",
                        model: "QDM v5.6",
                        cql: "",
                        draft: true,
                        description: "QDM Library Description",
                        publisher: "Org2",
                    }));
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("Does not allow creation of a QI-Core library with special charater", function () { return __awaiter(void 0, void 0, void 0, function () {
        var cancelButton, submitButton, libraryName, libraryDescription, modelSelect, modelSelectComboBox, options, publisherSelect, publisherListbox, publisherOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    return [4 /*yield*/, findByTestId("cql-library-cancel-button")];
                case 1:
                    cancelButton = _a.sent();
                    expect(cancelButton).toBeInTheDocument();
                    expect(cancelButton).toBeEnabled();
                    return [4 /*yield*/, findByTestId("continue-button")];
                case 2:
                    submitButton = _a.sent();
                    expect(submitButton).toBeInTheDocument();
                    expect(submitButton).toBeDisabled();
                    libraryName = react_1.screen.getByRole("textbox", {
                        name: "Library Name",
                    });
                    user_event_1.default.type(libraryName, "QdmLibrary_1");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(libraryName.value).toEqual("QdmLibrary_1"); })];
                case 3:
                    _a.sent();
                    libraryDescription = react_1.screen.getByRole("textbox", {
                        name: "Description",
                    });
                    user_event_1.default.type(libraryDescription, "QDM Library Description");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            return expect(libraryDescription.value).toEqual("QDM Library Description");
                        })];
                case 4:
                    _a.sent();
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 5:
                    options = _a.sent();
                    expect(options.length).toEqual(3);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: madie_models_1.Model.QICORE }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual(madie_models_1.Model.QICORE);
                    publisherSelect = react_1.screen.getByRole("combobox", { name: "Publisher" });
                    user_event_1.default.click(publisherSelect);
                    publisherListbox = react_1.screen.getByRole("listbox", { name: "Publisher" });
                    return [4 /*yield*/, (0, react_1.within)(publisherListbox).findAllByRole("option")];
                case 6:
                    publisherOptions = _a.sent();
                    expect(publisherOptions.length).toEqual(2);
                    user_event_1.default.click(publisherOptions[1]);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(publisherSelect).toHaveValue("Org2"); })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(submitButton).toBeDisabled(); })];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("QI-Core 6 is enabled", function () { return __awaiter(void 0, void 0, void 0, function () {
        var modelSelect, modelSelectComboBox, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    madie_util_1.useFeatureFlags.mockClear().mockImplementation(function () {
                        return {
                            qiCore6: true,
                            qiCore7: false,
                            usQualityCore: false,
                        };
                    });
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 1:
                    options = _a.sent();
                    expect(options.length).toEqual(3);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: madie_models_1.Model.QICORE_6_0_0 }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual("QI-Core v6.0.0");
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("QI-Core 7 is enabled", function () { return __awaiter(void 0, void 0, void 0, function () {
        var modelSelect, modelSelectComboBox, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    madie_util_1.useFeatureFlags.mockClear().mockImplementation(function () {
                        return {
                            qiCore7: true,
                            usQualityCore: false,
                        };
                    });
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 1:
                    options = _a.sent();
                    expect(options.length).toEqual(4);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: madie_models_1.Model.QICORE_7_0_2 }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual("QI-Core v7.0.2");
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("QI-Core 7 is not enabled", function () { return __awaiter(void 0, void 0, void 0, function () {
        var modelSelect, modelSelectComboBox, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    madie_util_1.useFeatureFlags.mockClear().mockImplementation(function () {
                        return {
                            qiCore7: false,
                            usQualityCore: false,
                        };
                    });
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 1:
                    options = _a.sent();
                    expect(options.length).toEqual(3);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: madie_models_1.Model.QICORE_6_0_0 }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual("QI-Core v6.0.0");
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("US Quality Core is enabled", function () { return __awaiter(void 0, void 0, void 0, function () {
        var modelSelect, modelSelectComboBox, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    madie_util_1.useFeatureFlags.mockClear().mockImplementation(function () {
                        return {
                            qiCore7: false,
                            usQualityCore: true,
                        };
                    });
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 1:
                    options = _a.sent();
                    expect(options.length).toEqual(3);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: usQualityCoreModel }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual(usQualityCoreModel);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("Creation of a QDM library fails", function () { return __awaiter(void 0, void 0, void 0, function () {
        var cancelButton, submitButton, libraryName, libraryDescription, modelSelect, modelSelectComboBox, options, publisherSelect, publisherListbox, publisherOptions, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockCqlLibraryServiceApi.createCqlLibrary.mockRejectedValueOnce(new Error("Failed to create CQL Library"));
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    return [4 /*yield*/, findByTestId("cql-library-cancel-button")];
                case 1:
                    cancelButton = _b.sent();
                    expect(cancelButton).toBeInTheDocument();
                    expect(cancelButton).toBeEnabled();
                    return [4 /*yield*/, findByTestId("continue-button")];
                case 2:
                    submitButton = _b.sent();
                    expect(submitButton).toBeInTheDocument();
                    expect(submitButton).toBeDisabled();
                    libraryName = react_1.screen.getByRole("textbox", {
                        name: "Library Name",
                    });
                    user_event_1.default.type(libraryName, "QdmLibrary_1");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(libraryName.value).toEqual("QdmLibrary_1"); })];
                case 3:
                    _b.sent();
                    libraryDescription = react_1.screen.getByRole("textbox", {
                        name: "Description",
                    });
                    user_event_1.default.type(libraryDescription, "QDM Library Description");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            return expect(libraryDescription.value).toEqual("QDM Library Description");
                        })];
                case 4:
                    _b.sent();
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 5:
                    options = _b.sent();
                    expect(options.length).toEqual(3);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: madie_models_1.Model.QDM_5_6 }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual("QDM v5.6");
                    publisherSelect = react_1.screen.getByRole("combobox", { name: "Publisher" });
                    user_event_1.default.click(publisherSelect);
                    publisherListbox = react_1.screen.getByRole("listbox", { name: "Publisher" });
                    return [4 /*yield*/, (0, react_1.within)(publisherListbox).findAllByRole("option")];
                case 6:
                    publisherOptions = _b.sent();
                    expect(publisherOptions.length).toEqual(2);
                    user_event_1.default.click(publisherOptions[1]);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(publisherSelect).toHaveValue("Org2"); })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(submitButton).not.toBeDisabled(); })];
                case 8:
                    _b.sent();
                    user_event_1.default.click(submitButton);
                    _a = expect;
                    return [4 /*yield*/, react_1.screen.findByText("An error occurred while creating the CQL Library")];
                case 9:
                    _a.apply(void 0, [_b.sent()]).toBeInTheDocument();
                    expect(mockCqlLibraryServiceApi.createCqlLibrary).toHaveBeenCalledWith(expect.objectContaining({
                        cqlLibraryName: "QdmLibrary_1",
                        model: "QDM v5.6",
                        cql: "",
                        draft: true,
                        description: "QDM Library Description",
                        publisher: "Org2",
                    }));
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("Creation of a QDM library fails with validation error", function () { return __awaiter(void 0, void 0, void 0, function () {
        var cancelButton, submitButton, libraryName, libraryDescription, modelSelect, modelSelectComboBox, options, publisherSelect, publisherListbox, publisherOptions, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockCqlLibraryServiceApi.createCqlLibrary.mockRejectedValueOnce({
                        response: {
                            data: {
                                message: "Validation error",
                                validationErrors: ["Library Name is required"],
                            },
                        },
                    });
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    return [4 /*yield*/, findByTestId("cql-library-cancel-button")];
                case 1:
                    cancelButton = _b.sent();
                    expect(cancelButton).toBeInTheDocument();
                    expect(cancelButton).toBeEnabled();
                    return [4 /*yield*/, findByTestId("continue-button")];
                case 2:
                    submitButton = _b.sent();
                    expect(submitButton).toBeInTheDocument();
                    expect(submitButton).toBeDisabled();
                    libraryName = react_1.screen.getByRole("textbox", {
                        name: "Library Name",
                    });
                    user_event_1.default.type(libraryName, "QdmLibrary_1");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(libraryName.value).toEqual("QdmLibrary_1"); })];
                case 3:
                    _b.sent();
                    libraryDescription = react_1.screen.getByRole("textbox", {
                        name: "Description",
                    });
                    user_event_1.default.type(libraryDescription, "QDM Library Description");
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            return expect(libraryDescription.value).toEqual("QDM Library Description");
                        })];
                case 4:
                    _b.sent();
                    modelSelect = getByTestId("cql-library-model-select");
                    modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole("combobox");
                    user_event_1.default.click(modelSelectComboBox);
                    return [4 /*yield*/, react_1.screen.findAllByRole("option")];
                case 5:
                    options = _b.sent();
                    expect(options.length).toEqual(3);
                    user_event_1.default.click(react_1.screen.getByRole("option", { name: madie_models_1.Model.QDM_5_6 }));
                    expect((0, react_1.within)(modelSelect).getByRole("textbox", {
                        hidden: true,
                    }).value).toEqual("QDM v5.6");
                    publisherSelect = react_1.screen.getByRole("combobox", { name: "Publisher" });
                    user_event_1.default.click(publisherSelect);
                    publisherListbox = react_1.screen.getByRole("listbox", { name: "Publisher" });
                    return [4 /*yield*/, (0, react_1.within)(publisherListbox).findAllByRole("option")];
                case 6:
                    publisherOptions = _b.sent();
                    expect(publisherOptions.length).toEqual(2);
                    user_event_1.default.click(publisherOptions[1]);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(publisherSelect).toHaveValue("Org2"); })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return expect(submitButton).not.toBeDisabled(); })];
                case 8:
                    _b.sent();
                    user_event_1.default.click(submitButton);
                    _a = expect;
                    return [4 /*yield*/, react_1.screen.findByText("Validation error 0 : Library Name is required")];
                case 9:
                    _a.apply(void 0, [_b.sent()]).toBeInTheDocument();
                    expect(mockCqlLibraryServiceApi.createCqlLibrary).toHaveBeenCalledWith(expect.objectContaining({
                        cqlLibraryName: "QdmLibrary_1",
                        model: "QDM v5.6",
                        cql: "",
                        draft: true,
                        description: "QDM Library Description",
                        publisher: "Org2",
                    }));
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    test("Cancel create QDM library", function () { return __awaiter(void 0, void 0, void 0, function () {
        var cancelButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, react_1.render)(<ServiceContext_1.ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog_1.default open={true} onClose={onFormCancel}/>
        </div>
      </ServiceContext_1.ApiContextProvider>);
                    return [4 /*yield*/, findByTestId("cql-library-cancel-button")];
                case 1:
                    cancelButton = _a.sent();
                    expect(cancelButton).toBeInTheDocument();
                    expect(cancelButton).toBeEnabled();
                    user_event_1.default.click(cancelButton);
                    expect(onFormCancel).toHaveBeenCalled();
                    expect(mockCqlLibraryServiceApi.createCqlLibrary).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
