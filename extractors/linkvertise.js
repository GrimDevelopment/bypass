const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("cross-fetch");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "linkvertise.com",
    "linkvertise.net",
    "up-to-down.net",
    "link-to.net",
    "direct-link.net",
    "linkvertise.download",
    "file-link.net",
    "link-center.net",
    "link-target.net",
    "link-hub.net"
  ],
  requiresCaptcha: true,
  get: async function(url, opt) {
    try {
      if (lib.config.debug == true) console.log("[linkvertise] Launching browser...");
      let blocker = await PlaywrightBlocker.fromPrebuiltFull(fetch);
      
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      let args = (lib.config.defaults?.puppeteer || {headless: true});

      b = await pw.firefox.launch(args);
      let p = await b.newPage();
      await blocker.enableBlockingInPage(p);

      await p.goto(url);
      await p.waitForSelector("#ngrecaptcha-0");
      if (lib.config.debug == true) console.log(`[linkvertise] Completing CAPTCHA...`);

      await lib.solveThroughPage(p);
      console.log("[linkvertise] Solved")
    } catch(err) {
      throw err;
    }
  }
}