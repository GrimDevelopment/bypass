const pw = require("playwright-extra");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("cross-fetch");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["cutw.in", "tmearn.com"],
  get: async function(url, opt) {
    let b;
    try {
      let blocker = await PlaywrightBlocker.fromPrebuiltFull(fetch);
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config.debug == true) console.log("[cutwin] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      blocker.enableBlockingInPage(p);
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[cutwin] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      if (lib.config.debug == true) console.log("[cutwin] Solving CAPTCHAs...");
      await lib.solveThroughPage(p);
      if (lib.config.debug == true) console.log("[cutwin] Solved CAPTCHA. Auto-submitting form...");
      await p.evaluate(function() {
        document.querySelector("form[method='post']").submit();
      });
      if (lib.config.debug == true) console.log("[cutwin] Done. Waiting for next page data...");
      await p.waitForSelector(".get-link");

      if (lib.config.debug == true) console.log("[cutwin] Done. Getting link...");
      let u = await p.evaluate(function() {
        return document.body.innerHTML.split(`$('.get-link').html('<a  href="`)[1].split(`">`)[0];
      });

      await b.close();

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}