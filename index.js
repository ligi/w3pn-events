import Ajv from "npm:ajv@8.8.2";
import addFormats from "npm:ajv-formats@2.1.1";
import { load as yamlLoad } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";
import { emptyDir } from "https://deno.land/std@0.173.0/fs/mod.ts";
import { Eta } from "https://deno.land/x/eta@v3.0.3/src/index.ts"

const types = ["summits", "meetups"];

async function _loadYaml(fn) {
  return yamlLoad(await Deno.readTextFile(fn));
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

async function test() {
  const ajv = new Ajv({ strict: false });
  addFormats(ajv);
  const schema = await _loadYaml("./schema.yaml");
  const validator = ajv.compile(schema);

  for (const type of types) {
    Deno.test(`Check schema: ${type}`, async () => {
      const list = await _loadYaml(`./events/${type}.yaml`);
      if (!validator(list)) {
        throw validator.errors;
      }
    });
  }
}

async function build() {
  const output = {};
  for (const type of types) {
    const list = await _loadYaml(`./events/${type}.yaml`);
    output[type] = list;
  }
  await emptyDir("./dist");
  const fn = "./dist/index.json";
  await Deno.writeTextFile(fn, JSON.stringify(output, null, 2));
  console.log(`File saved: `, fn);

  const readmeFn = "./README.md"
  const eta = new Eta({ views: "./" })
  //console.log(output)
  await Deno.writeTextFile(readmeFn, eta.render("./README.tpl.eta", { events: output, getFlagEmoji }))
  console.log(`File saved: `, readmeFn);
}

switch (Deno.args[0] || "test") {
  case "test":
    await test();
    break;

  case "build":
    await build();
    break;
}