const pup = require("puppeteer-extra");
const lib = require("../lib");

module.exports = {
  hostnames: ["srt.am", "short.am"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    // http://srt.am/e8kZ9m
    let b;
    try {
      if (lib.config().debug == true) console.log("[srtam] Launching browser...");

      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(lib.removeTor(args));
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[srtam] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "domcontentloaded"});
      if (lib.config().debug == true) console.log("[srtam] Done. Running eval code...");

      await p.evaluate(function() {
        if(document.querySelector(".skip-container")) {
          let f=document.createElement("form")
          f.method="POST"
          f.innerHTML='<input type="hidden" name="_image" value="Continue">'
          f=document.documentElement.appendChild(f)
          f.submit();
        }
      });

      if (lib.config().debug == true) console.log("[srtam] Done. Waiting for navigation...");
      await p.waitForNavigation({waitUntil: "domcontentloaded"});

      if (lib.config().debug == true) console.log("[srtam] Done, sending solution...");
      let u = await p.url();
      await b.close();
      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}