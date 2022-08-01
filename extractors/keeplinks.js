const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const lib = require("../lib");

module.exports = {
  hostnames: ["keeplinks.org"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.debug == true) console.log("[keeplinks] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[keeplinks] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      if (lib.config.debug == true) console.log("[keeplinks] Done. Parsing URL...");
      let pt = await p.url().split("//")[1].split("/")[1];
      let id = await p.url().split("//")[1].split("/")[2];

      await p.evaluate("document.cookie = `flag[" + id + "]=1`;");
      if (lib.config.debug == true) console.log("[keeplinks] Done. Redirecting...");
      await p.evaluate(function() {window.location.reload()});
      await p.waitForLoadState("domcontentloaded");

      if (lib.config.debug == true) console.log("[keeplinks] Done. Parsing metadata...");
      let r = await p.evaluate(function() {
        let a = [];

        document.querySelectorAll(".form_box a").forEach(function(ele) {
          if (ele.href !== window.location.href) a.push(ele.href);
        });

        return a;
      });

      await b.close();
      
      if (r.length > 1) {
        return {destinations: r}
      } else {
        return r[0];
      }
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}