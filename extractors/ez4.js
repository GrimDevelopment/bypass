const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");

module.exports = {
  hostnames: ["ez4short.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      if (lib.config().debug == true) console.log("[ez4] Launching browser...");
      pup.use(stl());
      pup.use(adb());
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url, {waitUntil: "networkidle2"});
      if (lib.config().debug == true) console.log("[ez4] Launched. Skipping first page...");

      await p.evaluate(function() {
        yuidea1();
      });
      await p.waitForNavigation();
      if (lib.config().debug == true) console.log("[ez4] Done. Skipping second page...");
      await p.evaluate(function() {
        yuidea1();
      });
      await p.waitForNavigation();
      if (lib.config().debug == true) console.log("[ez4] Done. Waiting for final page...");
      await p.waitForSelector(".procced > .btn.get-link:not(.disabled)");
      if (lib.config().debug == true) console.log("[ez4] Done. Retrieving URL...");
      let r = await p.evaluate(function() {
        return document.querySelector(".procced > .btn.get-link").href
      });
      return r;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}