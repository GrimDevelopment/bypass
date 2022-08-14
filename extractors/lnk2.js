const pw = require("playwright-extra");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("cross-fetch");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["lnk2.cc"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      // setting up plugins

      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      let blocker = await PlaywrightBlocker.fromPrebuiltFull(fetch);

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      

      // opening browser

      if (lib.config.debug == true) console.log("[lnk2] Launching browser...");  
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      blocker.enableBlockingInPage(p);
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[lnk2] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      // solving captchas and navigating

      if (lib.config.debug == true) console.log("[lnk2] Done. Solving CAPTCHA...");     
      await lib.solveThroughPage(p);
      if (lib.config.debug == true) console.log("[lnk2] Solved CAPTCHA. Submitting form...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });

      if (lib.config.debug == true) console.log("[lnk2] Done. Submitting next form...");     
      await p.waitForLoadState("domcontentloaded");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForLoadState("domcontentloaded");

      if (lib.config.debug == true) console.log("[lnk2] Done. Retrieving URL...");
      let f = await p.url();
      await b.close();

      return f;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}