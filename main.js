const lib = require("./lib");

(async function() {
  try {
    let l = await lib.get("https://linkvertise.com/233160/austin/11", {
      ignoreCache: false,
      allowCache: false
    });
    console.log(l);
  } catch(e) {
    console.log(e);
  }
})();