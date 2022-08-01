const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  "hostnames": ["oke.io"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.debug == true) console.log("[okeio] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[okeio] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      if (lib.config.debug == true) console.log("[okeio] Launched. Auto-submitting forum...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForLoadState("networkidle");

      if (lib.config.debug == true) console.log("[okeio] Submitted. Counting down...");
      await p.waitForSelector(`.getlinkbtn:not([href='javascript: void(0)'])`);
      if (lib.config.debug == true) console.log("[okeio] Done. Retrieving URL...");
      let l = await p.evaluate(function() {return document.querySelector(".getlinkbtn").href});

      if (lib.config.debug == true) console.log("[okeio] Closing browser...");
      await b.close();
      
      return l;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}