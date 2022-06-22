const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: ["lnk2.cc"],
  requiresCaptcha: true,
  get: async function(url) {
    let b;
    try {
      // setting up plugins

      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);
      pup.use(adb({blockTrackers: true}));

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      // opening browser

      if (lib.config().debug == true) console.log("[lnk2] Launching browser...");
      b = await pup.launch({headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"]});
      let p = await b.newPage();
      await p.goto(url);

      // solving captchas and navigating

      if (lib.config().debug == true) console.log("[lnk2] Launched. Solving CAPTCHA...");     
      await p.solveRecaptchas();
      if (lib.config().debug == true) console.log("[lnk2] Solved CAPTCHA. Submitting form...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });

      if (lib.config().debug == true) console.log("[lnk2] Done. Submitting next form...");     
      await p.waitForNavigation();
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForNavigation();

      if (lib.config().debug == true) console.log("[lnk2] Done. Retrieving URL...");
      let f = await p.url();
      await b.close();

      return f;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}