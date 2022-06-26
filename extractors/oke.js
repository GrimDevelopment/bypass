const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  "hostnames": ["oke.io"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().debug == true) console.log("[okeio] Launching browser...");
      b = await pup.launch({headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"]});
      let p = await b.newPage();
      await p.goto(url);

      if (lib.config().debug == true) console.log("[okeio] Launched. Auto-submitting forum...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForNavigation();

      if (lib.config().debug == true) console.log("[okeio] Submitted. Counting down...");
      await p.waitForSelector(".getlinkbtn:not([href='javascript: void(0)']");
      if (lib.config().debug == true) console.log("[okeio] Done. Retrieving URL...");
      let l = await p.evaluate(function() {return document.querySelector(".getlinkbtn").href});

      if (lib.config().debug == true) console.log("[okeio] Closing browser...");
      await b.close();
      
      return l;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}