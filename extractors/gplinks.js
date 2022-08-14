const pw = require("playwright-extra");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("cross-fetch");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["gplinks.co", "gplinks.in"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try { 
      if (lib.config.debug == true) console.log("[gplinks] Launching browser...");
      let blocker = await PlaywrightBlocker.fromPrebuiltFull(fetch);
      
      /*
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);
      */

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      let args = (lib.config.defaults?.puppeteer || {headless: true});

      b = await pw.firefox.launch(args);
      let p = await b.newPage();
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[gplinks] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "domcontentloaded"});
      
      if (lib.config.debug == true) console.log("[gplinks] Launched. Counting down...");

      await p.evaluate(function() {
        setInterval(function() {
          if (document.getElementById("wpsafe-time")) document.getElementById("wpsafe-time").focus()
        }, 100);
      });

      await p.waitForSelector("#btn6", {timeout: 999999});
      if (lib.config.debug == true) console.log("[gplinks] Done. Going to next page...");
      await p.evaluate(function() {
        if (document.body.classList.contains("modal-open")) {
          document.getElementById("download-ad-modal").remove();
          document.querySelector(".modal-backdrop").remove();
          document.body.classList.remove("modal-open");
        }
      });
      await p.waitForTimeout(2000);
      await p.click("#btn6");
      await p.waitForSelector("#captchaShortlink > div > div > iframe");
      await p.waitForTimeout(1000);

      if (lib.config.debug == true) console.log("[gplinks] Done. Solving CAPTCHA...");
      await lib.solveThroughPage(p);
      await blocker.enableBlockingInPage(p);
      await p.evaluate(function() {
        document.forms[0].submit();
      });
      if (lib.config.debug == true) console.log("[gplinks] Solved. Going to next page...");

      await p.waitForSelector("#timer");
      if (lib.config.debug == true) console.log("[gplinks] Done, sending request to get solution..");
      await p.evaluate(function() {
        setInterval(function() {
          if (document.getElementById("timer")) document.getElementById("timer").focus()
        })
      })
      await p.evaluate(function() {
        let s = setInterval(function() {
          if (UnlockButton && typeof UnlockButton == "function") {
            UnlockButton();
            clearInterval(s);
          }
        }, 1000);
      });
      let u = await fireWhenFound(p);

      await b.close();
      
      return u;
    } catch(err) {
      //if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function fireWhenFound(p) {
  return new Promise(function(resolve, reject) {
    if (lib.config.debug == true) console.log("[gplinks] Setting up listener to find solution...");
    p.on("response", async function(res) {
      let a = new URL((await res.url()));
      if (a.pathname == "/links/go" && (await (await(res.request()).method())) == "POST") {
        let a = (await res.json());
        if (lib.config.debug == true) console.log("[gplinks] Got URL that met requirements, parsing...");
        if (a.url) resolve(a.url);
        else reject("Redirect not found.");
      } else {
        if (lib.config.debug == true && a.hostname.includes("za.")) console.log(`[zagl] Ignoring request ${(await (await(res.request()).method()))} "${(await res.url())}" from listener.`);
      }
    });
  });
}