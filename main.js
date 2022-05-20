const lib = require("./lib");

(async function() {
  try {
    let l = await lib.get("https://ouo.io/2dktqo", {
      ignoreCache: false,
      allowCache: false
    });
    console.log(l);
  } catch(e) {
    console.log(e);
  }
})();