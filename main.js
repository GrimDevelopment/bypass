const lib = require("./lib");

(async function() {
  try {
    let l = await lib.get("", {
      ignoreCache: false,
      allowCache: false
    });
    console.log(l);
  } catch(e) {
    console.log(e);
  }
})();