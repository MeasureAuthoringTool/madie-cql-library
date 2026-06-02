"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var madie_models_1 = require("@madie/madie-models");
var CreateDraftDialog_1 = require("./CreateDraftDialog");
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var clearAllMocks = jest.clearAllMocks;
var madie_util_1 = require("@madie/madie-util");
var cqlLibrary = {
  cqlErrors: false,
  librarySetId: "37ff3c16-8304-4fe5-8fa9-a6f3b468d00f",
  id: "622e1f46d1fd3729d861e6cb",
  cqlLibraryName: "TestLib",
  model: madie_models_1.Model.QICORE,
  createdAt: "2025-05-01T18:36:51.489Z",
  createdBy: "te$t.user",
  lastModifiedAt: "2025-05-01T18:36:51.489Z",
  lastModifiedBy: "te$t.user",
  draft: true,
  version: "0.0.000",
  cql: "library TestLib version '0.0.000'\nusing QICore version '4.1.1'\n",
  active: true,
};
jest.mock("@madie/madie-util", function () {
  return {
    useFeatureFlags: jest.fn().mockReturnValue({
      qiCore6: true,
      qiCore7: true,
    }),
  };
});
describe("Create Draft Dialog component", function () {
  beforeEach(function () {
    clearAllMocks();
  });
  it("should render Draft dialog with cql library name", function () {
    (0, react_1.render)(
      <CreateDraftDialog_1.default
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    expect(react_1.screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      react_1.screen.getByRole("textbox", { name: "CQL Library Name" })
    ).toHaveValue(cqlLibrary.cqlLibraryName);
  });
  it("should generate field level error for required Cql Library name", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            user_event_1.default.clear(cqlLibraryNameInput);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("cqlLibraryName-helper-text")
                ).toHaveTextContent("Library name is required.");
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should display a model version option for QI-Core measures", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var cqlLibraryName, _a, _b, _c;
      return __generator(this, function (_d) {
        switch (_d.label) {
          case 0:
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
            return [
              4 /*yield*/,
              react_1.screen.findByRole("textbox", {
                name: "CQL Library Name",
              }),
            ];
          case 1:
            cqlLibraryName = _d.sent();
            expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
            _a = expect;
            return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
          case 2:
            _a.apply(void 0, [_d.sent()]).toBeInTheDocument();
            _b = expect;
            return [
              4 /*yield*/,
              react_1.screen.findByText("Update Model Version"),
            ];
          case 3:
            _b.apply(void 0, [_d.sent()]).toBeInTheDocument();
            _c = expect;
            return [4 /*yield*/, react_1.screen.findByText("QI-Core v4.1.1")];
          case 4:
            _c.apply(void 0, [_d.sent()]).toBeInTheDocument();
            expect(
              react_1.screen.getByTestId("create-draft-continue-button")
            ).toBeEnabled();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should not display a model version option for QDM measures", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var qdmLibrary, _a, cqlLibraryName;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            qdmLibrary = Object.assign({}, cqlLibrary);
            qdmLibrary.model = madie_models_1.Model.QDM_5_6;
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={qdmLibrary} />);
            _a = expect;
            return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
          case 1:
            _a.apply(void 0, [_b.sent()]).toBeInTheDocument();
            return [
              4 /*yield*/,
              react_1.screen.findByRole("textbox", {
                name: "CQL Library Name",
              }),
            ];
          case 2:
            cqlLibraryName = _b.sent();
            expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
            expect(
              react_1.screen.queryByText("Update Model Version")
            ).not.toBeInTheDocument();
            expect(
              react_1.screen.getByTestId("create-draft-continue-button")
            ).toBeEnabled();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should generate field level error for at least one alphabet in cql library name", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            user_event_1.default.clear(cqlLibraryNameInput);
            user_event_1.default.type(cqlLibraryNameInput, "123123");
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("cqlLibraryName-helper-text")
                ).toHaveTextContent(
                  "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
                );
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should generate field level error for underscore in cql library name", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            user_event_1.default.clear(cqlLibraryNameInput);
            user_event_1.default.type(
              cqlLibraryNameInput,
              "Testing_libraryName12"
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("cqlLibraryName-helper-text")
                ).toHaveTextContent(
                  "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
                );
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should generate field level error for library name starting with lower case", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            user_event_1.default.clear(cqlLibraryNameInput);
            user_event_1.default.type(
              cqlLibraryNameInput,
              "testingLibraryName12"
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("cqlLibraryName-helper-text")
                ).toHaveTextContent(
                  "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
                );
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should generate field level error for library name with a space", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            user_event_1.default.clear(cqlLibraryNameInput);
            user_event_1.default.type(
              cqlLibraryNameInput,
              "testing LibraryName12"
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("cqlLibraryName-helper-text")
                ).toHaveTextContent(
                  "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
                );
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should navigate to cql library home page on cancel", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var onCloseFn;
      return __generator(this, function (_a) {
        onCloseFn = jest.fn();
        (0,
        react_1.render)(<CreateDraftDialog_1.default open={true} onClose={onCloseFn} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
        user_event_1.default.click(
          react_1.screen.getByRole("button", { name: "Cancel" })
        );
        expect(onCloseFn).toHaveBeenCalled();
        return [2 /*return*/];
      });
    });
  });
  it("should not change cql but continue drafting by calling onSubmit when user does not rename library", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var onSubmitFn, cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            onSubmitFn = jest.fn();
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={onSubmitFn} cqlLibrary={cqlLibrary} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            expect(cqlLibraryNameInput.value).toBe(cqlLibrary.cqlLibraryName);
            user_event_1.default.click(
              react_1.screen.getByRole("button", { name: "Continue" })
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(onSubmitFn).toHaveBeenCalledWith(
                  cqlLibrary,
                  cqlLibrary.model
                );
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should update the cql and continue drafting by calling onSubmit when user renames the library", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var onSubmitFn, cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            onSubmitFn = jest.fn();
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={onSubmitFn} cqlLibrary={cqlLibrary} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            user_event_1.default.clear(cqlLibraryNameInput);
            user_event_1.default.type(
              cqlLibraryNameInput,
              "TestingLibraryName12"
            );
            user_event_1.default.click(
              react_1.screen.getByRole("button", { name: "Continue" })
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(onSubmitFn).toHaveBeenCalledWith(
                  __assign(__assign({}, cqlLibrary), {
                    cqlLibraryName: "TestingLibraryName12",
                  }),
                  "QI-Core v4.1.1"
                );
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("should not update cql even if user renames library when there is no cql", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var onSubmitFn, cqlLibraryNameInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            onSubmitFn = jest.fn();
            (0,
            react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={onSubmitFn} cqlLibrary={__assign(__assign({}, cqlLibrary), { cql: null })} />);
            cqlLibraryNameInput = react_1.screen.getByRole("textbox", {
              name: "CQL Library Name",
            });
            user_event_1.default.clear(cqlLibraryNameInput);
            user_event_1.default.type(
              cqlLibraryNameInput,
              "TestingLibraryName12"
            );
            user_event_1.default.click(
              react_1.screen.getByRole("button", { name: "Continue" })
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(onSubmitFn).toHaveBeenCalledWith(
                  __assign(__assign({}, cqlLibrary), {
                    cqlLibraryName: "TestingLibraryName12",
                    cql: null,
                  }),
                  "QI-Core v4.1.1"
                );
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  describe("Test model version options when feature flag qicore7 is true", function () {
    it("should display all model version options for QI-Core", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var cqlLibraryName,
          _a,
          _b,
          _c,
          modelSelect,
          modelSelectComboBox,
          options;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              cqlLibrary.model = madie_models_1.Model.QICORE;
              (0,
              react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
              return [
                4 /*yield*/,
                react_1.screen.findByRole("textbox", {
                  name: "CQL Library Name",
                }),
              ];
            case 1:
              cqlLibraryName = _d.sent();
              expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
              _a = expect;
              return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
            case 2:
              _a.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _b = expect;
              return [
                4 /*yield*/,
                react_1.screen.findByText("Update Model Version"),
              ];
            case 3:
              _b.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _c = expect;
              return [4 /*yield*/, react_1.screen.findByText("QI-Core v4.1.1")];
            case 4:
              _c.apply(void 0, [_d.sent()]).toBeInTheDocument();
              modelSelect = react_1.screen.getByTestId(
                "cql-library-model-select"
              );
              modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole(
                "combobox"
              );
              user_event_1.default.click(modelSelectComboBox);
              return [4 /*yield*/, react_1.screen.findAllByRole("option")];
            case 5:
              options = _d.sent();
              expect(options.length).toEqual(4);
              user_event_1.default.click(options[0]);
              expect(
                (0, react_1.within)(modelSelect).getByRole("textbox", {
                  hidden: true,
                }).value
              ).toEqual("QI-Core v4.1.1");
              return [
                4 /*yield*/,
                (0, react_1.waitFor)(function () {
                  expect(
                    react_1.screen.getByTestId(
                      "cql-library-model-option-QI-Core v4.1.1"
                    )
                  ).toBeInTheDocument();
                  expect(
                    react_1.screen.getByTestId(
                      "cql-library-model-option-QI-Core v6.0.0"
                    )
                  ).toBeInTheDocument();
                  expect(
                    react_1.screen.getByTestId(
                      "cql-library-model-option-QI-Core v7.0.2"
                    )
                  ).toBeInTheDocument();
                  expect(
                    react_1.screen.queryByTestId(
                      "cql-library-model-option-QDM 5.6"
                    )
                  ).not.toBeInTheDocument();
                }),
              ];
            case 6:
              _d.sent();
              expect(
                react_1.screen.getByTestId("create-draft-continue-button")
              ).toBeEnabled();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should display model version options for QI-Core v6.0.0", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var cqlLibraryName,
          _a,
          _b,
          _c,
          modelSelect,
          modelSelectComboBox,
          options;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              cqlLibrary.model = madie_models_1.Model.QICORE_6_0_0;
              (0,
              react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
              return [
                4 /*yield*/,
                react_1.screen.findByRole("textbox", {
                  name: "CQL Library Name",
                }),
              ];
            case 1:
              cqlLibraryName = _d.sent();
              expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
              _a = expect;
              return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
            case 2:
              _a.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _b = expect;
              return [
                4 /*yield*/,
                react_1.screen.findByText("Update Model Version"),
              ];
            case 3:
              _b.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _c = expect;
              return [4 /*yield*/, react_1.screen.findByText("QI-Core v6.0.0")];
            case 4:
              _c.apply(void 0, [_d.sent()]).toBeInTheDocument();
              modelSelect = react_1.screen.getByTestId(
                "cql-library-model-select"
              );
              modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole(
                "combobox"
              );
              user_event_1.default.click(modelSelectComboBox);
              return [4 /*yield*/, react_1.screen.findAllByRole("option")];
            case 5:
              options = _d.sent();
              expect(options.length).toEqual(3);
              user_event_1.default.click(options[0]);
              expect(
                (0, react_1.within)(modelSelect).getByRole("textbox", {
                  hidden: true,
                }).value
              ).toEqual("QI-Core v6.0.0");
              return [
                4 /*yield*/,
                (0, react_1.waitFor)(function () {
                  expect(
                    react_1.screen.getByTestId(
                      "cql-library-model-option-QI-Core v6.0.0"
                    )
                  ).toBeInTheDocument();
                  expect(
                    react_1.screen.getByTestId(
                      "cql-library-model-option-QI-Core v7.0.2"
                    )
                  ).toBeInTheDocument();
                  expect(
                    react_1.screen.queryByTestId(
                      "cql-library-model-option-QI-Core v4.1.1"
                    )
                  ).not.toBeInTheDocument();
                  expect(
                    react_1.screen.queryByTestId(
                      "cql-library-model-option-QDM 5.6"
                    )
                  ).not.toBeInTheDocument();
                }),
              ];
            case 6:
              _d.sent();
              expect(
                react_1.screen.getByTestId("create-draft-continue-button")
              ).toBeEnabled();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should display model version options for QI-Core v7.0.2", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var cqlLibraryName, _a, _b, _c, modelInput;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              cqlLibrary.model = madie_models_1.Model.QICORE_7_0_2;
              (0,
              react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
              return [
                4 /*yield*/,
                react_1.screen.findByRole("textbox", {
                  name: "CQL Library Name",
                }),
              ];
            case 1:
              cqlLibraryName = _d.sent();
              expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
              _a = expect;
              return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
            case 2:
              _a.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _b = expect;
              return [
                4 /*yield*/,
                react_1.screen.findByText("Update Model Version"),
              ];
            case 3:
              _b.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _c = expect;
              return [4 /*yield*/, react_1.screen.findByText("QI-Core v7.0.2")];
            case 4:
              _c.apply(void 0, [_d.sent()]).toBeInTheDocument();
              modelInput = react_1.screen.getByTestId(
                "cql-library-model-select"
              );
              expect(modelInput).toHaveAttribute("readonly");
              expect(
                react_1.screen.getByTestId("create-draft-continue-button")
              ).toBeEnabled();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Test model version options when feature flag qicore7 is false", function () {
    beforeEach(function () {
      madie_util_1.useFeatureFlags.mockClear().mockImplementation(function () {
        return {
          qiCore7: false,
        };
      });
    });
    it("should display all model version options for QI-Core", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var cqlLibraryName,
          _a,
          _b,
          _c,
          modelSelect,
          modelSelectComboBox,
          options;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              cqlLibrary.model = madie_models_1.Model.QICORE;
              (0,
              react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
              return [
                4 /*yield*/,
                react_1.screen.findByRole("textbox", {
                  name: "CQL Library Name",
                }),
              ];
            case 1:
              cqlLibraryName = _d.sent();
              expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
              _a = expect;
              return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
            case 2:
              _a.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _b = expect;
              return [
                4 /*yield*/,
                react_1.screen.findByText("Update Model Version"),
              ];
            case 3:
              _b.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _c = expect;
              return [4 /*yield*/, react_1.screen.findByText("QI-Core v4.1.1")];
            case 4:
              _c.apply(void 0, [_d.sent()]).toBeInTheDocument();
              modelSelect = react_1.screen.getByTestId(
                "cql-library-model-select"
              );
              modelSelectComboBox = (0, react_1.within)(modelSelect).getByRole(
                "combobox"
              );
              user_event_1.default.click(modelSelectComboBox);
              return [4 /*yield*/, react_1.screen.findAllByRole("option")];
            case 5:
              options = _d.sent();
              expect(options.length).toEqual(3);
              user_event_1.default.click(options[0]);
              expect(
                (0, react_1.within)(modelSelect).getByRole("textbox", {
                  hidden: true,
                }).value
              ).toEqual("QI-Core v4.1.1");
              return [
                4 /*yield*/,
                (0, react_1.waitFor)(function () {
                  expect(
                    react_1.screen.getByTestId(
                      "cql-library-model-option-QI-Core v4.1.1"
                    )
                  ).toBeInTheDocument();
                  expect(
                    react_1.screen.getByTestId(
                      "cql-library-model-option-QI-Core v6.0.0"
                    )
                  ).toBeInTheDocument();
                  expect(
                    react_1.screen.queryByTestId(
                      "cql-library-model-option-QI-Core v7.0.2"
                    )
                  ).not.toBeInTheDocument();
                  expect(
                    react_1.screen.queryByTestId(
                      "cql-library-model-option-QDM 5.6"
                    )
                  ).not.toBeInTheDocument();
                }),
              ];
            case 6:
              _d.sent();
              expect(
                react_1.screen.getByTestId("create-draft-continue-button")
              ).toBeEnabled();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should display model version options for QI-Core v6.0.0", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var cqlLibraryName, _a, _b, _c, modelInput;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              cqlLibrary.model = madie_models_1.Model.QICORE_6_0_0;
              (0,
              react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
              return [
                4 /*yield*/,
                react_1.screen.findByRole("textbox", {
                  name: "CQL Library Name",
                }),
              ];
            case 1:
              cqlLibraryName = _d.sent();
              expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
              _a = expect;
              return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
            case 2:
              _a.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _b = expect;
              return [
                4 /*yield*/,
                react_1.screen.findByText("Update Model Version"),
              ];
            case 3:
              _b.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _c = expect;
              return [4 /*yield*/, react_1.screen.findByText("QI-Core v6.0.0")];
            case 4:
              _c.apply(void 0, [_d.sent()]).toBeInTheDocument();
              modelInput = react_1.screen.getByTestId(
                "cql-library-model-select"
              );
              expect(modelInput).toHaveAttribute("readonly");
              expect(
                react_1.screen.getByTestId("create-draft-continue-button")
              ).toBeEnabled();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should display model version options for QI-Core v7.0.2", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var cqlLibraryName, _a, _b, _c, modelInput;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              cqlLibrary.model = madie_models_1.Model.QICORE_7_0_2;
              (0,
              react_1.render)(<CreateDraftDialog_1.default open={true} onClose={jest.fn()} onSubmit={jest.fn()} cqlLibrary={cqlLibrary} />);
              return [
                4 /*yield*/,
                react_1.screen.findByRole("textbox", {
                  name: "CQL Library Name",
                }),
              ];
            case 1:
              cqlLibraryName = _d.sent();
              expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
              _a = expect;
              return [4 /*yield*/, react_1.screen.findByText("Create Draft")];
            case 2:
              _a.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _b = expect;
              return [
                4 /*yield*/,
                react_1.screen.findByText("Update Model Version"),
              ];
            case 3:
              _b.apply(void 0, [_d.sent()]).toBeInTheDocument();
              _c = expect;
              return [4 /*yield*/, react_1.screen.findByText("QI-Core v7.0.2")];
            case 4:
              _c.apply(void 0, [_d.sent()]).toBeInTheDocument();
              modelInput = react_1.screen.getByTestId(
                "cql-library-model-select"
              );
              expect(modelInput).toHaveAttribute("readonly");
              expect(
                react_1.screen.getByTestId("create-draft-continue-button")
              ).toBeEnabled();
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
