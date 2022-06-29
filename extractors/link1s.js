const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const adb = require("puppeteer-extra-plugin-adblocker");
const lib = require("../lib");

module.exports = {
  hostnames: ["link1s.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      pup.use(stl());
      pup.use(adb());

      if (lib.config().debug == true) console.log("[link1ts] Launching browser...");
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(args);
      let p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[link1ts] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle0"});

      if (lib.config().debug == true) console.log("[link1ts] Launched. Skipping first page...");
      await p.evaluate(function() {
        window.open(document.getElementById("link1s").href, "_self");
      });
      await p.waitForNavigation({waitUntil: "domcontentloaded"});
      if (lib.config().debug == true) console.log("[link1ts] Done. Skipping second page...");
      await p.evaluate(function() {link1sgo()});
      await p.waitForNavigation({waitUntil: "domcontentloaded"});
      if (lib.config().debug == true) console.log("[link1ts] Done. Extracting link from third page...");
      let d = (await p.evaluate(function() {return document.querySelector(".btn.btn-success.btn-lg").href}));
      await b.close();
      return d;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}