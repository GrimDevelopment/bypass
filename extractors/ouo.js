const pup = require("puppeteer-extra");
const lib = require("../lib");
const cap = require("puppeteer-extra-plugin-recaptcha");
const stl = require("puppeteer-extra-plugin-stealth");

module.exports = {
  hostnames: ["ouo.press", "ouo.io"],
  requiresCaptcha: false,
  get: async function(url, opt) {
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
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(lib.removeTor(args));
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[ouo] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      if (lib.config().debug == true) console.log("[ouo] Launched. Detecting if the site is protected via Cloudflare...");
      let cf = await lib.cloudflare.check(p);
      if (cf == true) {
        if (lib.config().debug == true) console.log("[ouo] ouo is currently protected by Cloudflare, bypassing...");
        p = await lib.cloudflare.solve(p);
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
      
      let r = await fireWhenFound(p);
      await b.close();
      
      return r;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function fireWhenFound(p) {
  return new Promise(function(resolve, reject) {
    p.on("response", async function(res) {
      let a = new URL((await res.url()));
      if (a.pathname.startsWith("/xreallcygo") && (await (await(res.request()).method())) == "POST") {
        let a = (await res.headers());
        resolve(a?.location)
      } else {
        if (lib.config().debug == true && a.hostname.includes("ouo")) console.log(`[ouo] Ignoring request ${(await (await(res.request()).method()))} "${(await res.url())}" from listener.`);
      }
    });
  });
}