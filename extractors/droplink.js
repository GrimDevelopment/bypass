const pup = require("puppeteer-extra");
const lib = require("../lib");

module.exports = {
  hostnames: ["droplink.co"],
  requiresCaptcha: false,
  get: async function (url, opt) {
    let b; 
    try {
      if (lib.config().debug == true) console.log("[droplink] Launching browser...");
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(args);
      let p = await b.newPage();
      if (lib.config().debug == true) console.log("[droplink] Launched. Faking some steps...");

      await p.goto("https://yoshare.net", {waitUntil: "domcontentloaded"});
      await p.evaluate(`window.location = "${url}"`);
      if (lib.config().debug == true) console.log("[droplink] Done. Waiting for countdown page...");

      await p.waitForNavigation();
      if (lib.config().debug == true) console.log("[droplink] Done. Counting down...");
      await p.waitForSelector(".btn.btn-success.btn-lg:not([disabled]):not([href='javascript: void(0)'])");
      if (lib.config().debug == true) console.log("[droplink] Done. Extracting link...");
      let a = await p.evaluate(function() {return document.querySelector(".btn-success.btn-lg").href});
      await b.close();
      return a;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}