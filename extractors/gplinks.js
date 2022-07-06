const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: ["gplinks.co", "gplinks.in"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try { 
      if (lib.config().debug == true) console.log("[gplinks] Launching browser...");
      pup.use(stl());
      pup.use(adb());

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }
 
      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      let args = (lib.removeTor(lib.config().defaults?.puppeteer) || {headless: true});

      b = await pup.launch(args);
      let p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[gplinks] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle0"});

      if (lib.config().debug == true) console.log("[gplinks] Launched. Counting down...");
      await p.waitForTimeout("#btn6");
      if (lib.config().debug == true) console.log("[gplinks] Done. Going to next page...");
      await p.click("#btn6");
      await p.waitForSelector("#captchaShortlink > div > div > iframe");
      await p.waitForTimeout(1000);

      if (lib.config().debug == true) console.log("[gplinks] Done. Solving CAPTCHA...");
      await p.solveRecaptchas();
      if (await p.$("#download-ad-modal")) {
        await p.evaluate(function() {
          document.querySelector("#download-ad-modal").remove();
          document.querySelector(".modal-backdrop.show").remove();
        });
      }
      await p.click("#invisibleCaptchaShortlink");
      if (lib.config().debug == true) console.log("[gplinks] Solved. Going to next page...");

      await p.waitForSelector("#timer");
      if (lib.config().debug == true) console.log("[gplinks] Done, sending request to get solution..");
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
    if (lib.config().debug == true) console.log("[gplinks] Setting up listener to find solution...");
    p.on("response", async function(res) {
      let a = new URL((await res.url()));
      if (a.pathname == "/links/go" && (await (await(res.request()).method())) == "POST") {
        let a = (await res.json());
        if (lib.config().debug == true) console.log("[gplinks] Got URL that met requirements, parsing...");
        if (a.url) resolve(a.url);
        else reject("Redirect not found.");
      } else {
        if (lib.config().debug == true && a.hostname.includes("za.")) console.log(`[zagl] Ignoring request ${(await (await(res.request()).method()))} "${(await res.url())}" from listener.`);
      }
    });
  });
}