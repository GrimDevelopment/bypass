const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: ["keeplinks.org"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      pup.use(adb());

      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().debug == true) console.log("[keeplinks] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);

      if (lib.config().debug == true) console.log("[keeplinks] Done. Parsing URL...");
      let pt = await p.url().split("//")[1].split("/")[1];
      let id = await p.url().split("//")[1].split("/")[2];

      await p.setCookie({name: `flag[${id}]`, path: `/${pt}`, value: `1`});
      if (lib.config().debug == true) console.log("[keeplinks] Done. Redirecting...");
      await p.evaluate(function() {window.location.reload()});
      await p.waitForNavigation();

      if (lib.config().debug == true) console.log("[keeplinks] Done. Parsing metadata...");
      let r = await p.evaluate(function() {
        let a = [];

        document.querySelectorAll(".form_box a").forEach(function(ele) {
          if (ele.href !== window.location.href) a.push(ele.href);
        });

        return a;
      });

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