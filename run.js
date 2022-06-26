const lib = require("./lib");

if (process.argv[2]) {
  let o = {};

  o.ignoreCache = (toBool(process.argv[3]) || false);
  o.allowCache = (toBool(process.argv[4]) || true);
  o.ignoreFF = (toBool(process.argv[3]) || false);
  o.allowFF = (toBool(process.argv[4]) || true);
  
  if (lib.config().debug == true) console.log(`[runner] URL: `, process.argv[2]);
  if (lib.config().debug == true) console.log(`[runner] Options: `, o);

  if (lib.config().debug == true) console.log("[runner] Sending solve request to './lib.js'");

  (async function() {
    try {
      let solution = await lib.get(process.argv[2], o);
      if (lib.config().debug == true) console.log("[runner] Got result, sending into console below:");
      console.log((solution.destination || solution.destinations));
      process.exit();
    } catch(err) {
      console.log((err.stack || err.message || err.code || err));
      process.exit(1);
    }
  })();
} else {
  console.log(`bifm - console runner\nUsage: node ./run.js "<url>" [ignoreCache: y/(n)] [allowCache: (y)/n] [ignoreFF: y/(n)] [allowFF: (y)/n]`);
  process.exit();
}

function toBool(c) {
  if (c == undefined) return c;
  switch(c.toLowerCase()) {
    case "y":
    case "ye":
    case "yes":
    case "t":
    case "tr":
    case "tru":
    case "true":
    case "1":
      return true;
    case "n":
    case "no":
    case "f":
    case "fa":
    case "fal":
    case "fals":
    case "false":
    case "0":
      return false;
    default:
      return null;
  }
}