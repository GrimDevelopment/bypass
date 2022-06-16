const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");

module.exports = {
  hostnames: ["ouo.press", "ouo.io"],
  "requires-captcha": false,
  get: async function(url) {
    let b;
    try {
      let u = new URL(url);
      if (u.searchParams.get("s")) return decodeURIComponent(u.searchParams.get("s"));
      
      // setting up plugins

      pup.use(stl());

      // opening browser

      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(u.href);
      await p.waitForSelector(".btn-main:not(.btn-disabled)");

      // eval code sourced from https://github.com/FastForwardTeam/FastForward/blob/main/src/js/injection_script.js#L1095

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

