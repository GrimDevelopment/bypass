const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: ["cutw.in"],
  get: async function(url, opt) {
    let b;
    try {
      pup.use(adb());
      
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }
 
      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      if (lib.config().debug == true) console.log("[cutwin] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);

      if (lib.config().debug == true) console.log("[cutwin] Solving CAPTCHAs...");
      await p.solveRecaptchas();
      if (lib.config().debug == true) console.log("[cutwin] Solved CAPTCHA. Auto-submitting form...");
      await p.evaluate(function() {
        document.querySelector("form[method='post']").submit();
      });
      if (lib.config().debug == true) console.log("[cutwin] Done. Waiting for next page data...");
      await p.waitForNavigation();

      if (lib.config().debug == true) console.log("[cutwin] Done. Getting link...");
      let u = await p.evaluate(function() {
        return document.body.innerHTML.split(`$('.get-link').html('<a  href="`)[1].split(`">`)[0];
      });

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}