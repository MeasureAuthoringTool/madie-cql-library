const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");

async function checkStyles() {
  const root = path.resolve(__dirname, "..");
  const globals = fs.readFileSync(
    path.join(root, "src/styles/GlobalStyles.tsx"),
    "utf8"
  );
  const ast = babel.parseSync(globals, {
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ["jsx", "typescript"] },
  });
  const reset = ast.program.body.find(
    (node) => node.declarations?.[0]?.id.name === "BaseStyles"
  ).declarations[0].init.quasi.quasis[0].value.cooked;
  assert.equal(
    crypto.createHash("sha256").update(reset).digest("hex"),
    "47605c1d0deb66a56d5c84699909df82250e767885065693484fc810610bda1a",
    "Keep the original global reset unchanged"
  );

  const file = path.join(root, "src/styles/tailwind.css");
  const result = await postcss([tailwind()]).process(
    fs.readFileSync(file, "utf8"),
    { from: file }
  );
  const rules = new Map();
  const variables = new Map();
  result.root.walkRules((rule) => {
    rules.set(rule.selector, rule);
    assert(!/(^|,)\s*(body|html|button|input)\s*($|,)/.test(rule.selector));
  });
  result.root.walkDecls((decl) => {
    if (decl.prop.startsWith("--cl-")) variables.set(decl.prop, decl.value);
  });
  const expected = {
    "mx-2": ["margin-inline", "calc(var(--cl-spacing) * 2)"],
    "mt-0!": ["margin-top", "0px"],
    "mr-1": ["margin-right", "var(--cl-spacing)"],
    flex: ["display", "flex"],
    "min-w-full": ["min-width", "100%"],
    grow: ["flex-grow", "1"],
    "flex-row": ["flex-direction", "row"],
    "justify-end": ["justify-content", "flex-end"],
    "bg-slate": ["background-color", "var(--cl-color-slate)"],
    "p-3": ["padding", "calc(var(--cl-spacing) * 3)"],
    "text-left": ["text-align", "left"],
    "text-sm": ["font-size", "var(--cl-text-sm)"],
    "font-bold": ["font-weight", "var(--cl-font-weight-bold)"],
    "font-light": ["font-weight", "var(--cl-font-weight-light)"],
    "font-medium": ["font-weight", "var(--cl-font-weight-medium)"],
    "text-blue-900": ["color", "var(--cl-color-blue-900)"],
    "text-green-800": ["color", "var(--cl-color-green-800)"],
    "text-red-550": ["color", "var(--cl-color-red-550)"],
    "text-red-800": ["color", "var(--cl-color-red-800)"],
    capitalize: ["text-transform", "capitalize"],
  };
  for (const [utility, [property, value]] of Object.entries(expected)) {
    const selector = "." + ("cl:" + utility).replace(/[:!]/g, "\\$&");
    const rule = rules.get(selector);
    assert(rule, `Missing compiled utility: ${utility}`);
    const declaration = rule.nodes.find((node) => node.prop === property);
    assert.equal(declaration?.value, value, utility);
    if (utility === "mt-0!") assert(declaration.important);
  }
  for (const [name, value] of Object.entries({
    "color-blue-900": "#0b347a",
    "color-red-550": "#d92f2f",
    "color-red-800": "#930e2b",
    "color-green-800": "#097c53",
    "color-slate": "#ededed",
    spacing: "0.25rem",
    "text-sm": "0.875rem",
    "text-sm--line-height": "calc(1.25 / 0.875)",
    "font-weight-light": "300",
    "font-weight-medium": "500",
    "font-weight-bold": "700",
  })) {
    assert.equal(variables.get("--cl-" + name), value, name);
  }
  assert(
    fs
      .readFileSync(path.join(root, "src/root.component.tsx"), "utf8")
      .includes('import "./styles/tailwind.css"')
  );
  console.log("Original reset and all 20 compiled utilities verified.");
}

checkStyles().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
