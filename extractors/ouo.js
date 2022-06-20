const pup = require("puppeteer-extra");
const lib = require("../lib");
const cap = require("puppeteer-extra-plugin-recaptcha");
const stl = require("puppeteer-extra-plugin-stealth");

module.exports = {
  hostnames: ["ouo.press", "ouo.io"],
  "requires-captcha": false,
  get: async function(url) {
    let b;
    try {
      let u = new URL(url);
      if (u.searchParams.get("s")) {
        if (lib.config().debug == true) console.log("[ouo] Found API information, sending URL...");
        return decodeURIComponent(u.searchParams.get("s"));
      }
      
      // setting up plugins
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      // opening browser

      if (lib.config().debug == true) console.log("[ouo] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(u.href);

      if (lib.config().debug == true) console.log("[ouo] Launched. Detecting if the site is protected via Cloudflare...");
      let cf = await p.evaluate(function() {
        if (document.title.includes("Attention")) return true;
        else return false;
      });

      if (cf == true) {
        if (lib.config().debug == true) console.log("[ouo] Relaunching browser with CAPTCHA support...");
        await b.close();
        if (lib.config().captcha.active == false) {
          throw "Captcha service isn't normally required for this link, but it does under these circumstances, but this instance doesn't support it."
        }
  
        pup.use(cap({
          provider: {
            id: lib.config().captcha.service,
            token: lib.config().captcha.key
          }
        }));

        b = await pup.launch({headless: true});
        p = await b.newPage();
        await p.goto(u.href);

        if (lib.config().debug == true) console.log("[ouo] Solving CAPTCHA...");
        await p.waitForSelector("#cf-hcaptcha-container");
        await p.solveRecaptchas();
        if (lib.config().debug == true) console.log("[ouo] Solved CAPTCHA. Waiting for page to refresh...");
        await p.waitForNavigation();
      }

      // 2nd eval code sourced from https://github.com/FastForwardTeam/FastForward/blob/main/src/js/injection_script.js#L1095

      if (lib.config().debug == true) console.log("[ouo] Auto-submitting form to skip CAPTCHA...");
      await p.evaluate(function() {
        if (location.pathname.includes("/go") || location.pathname.includes("/fbc")) {
          document.querySelector("form").submit();
        } else {
          if (document.querySelector("form#form-captcha")) {
            let f = document.querySelector("form#form-captcha");
            f.action = "/xreallcygo" + location.pathname;
            f.submit();
          }
        }
      });

      await p.waitForNavigation();
      let a = await p.url();
      await b.close();

      return a;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

