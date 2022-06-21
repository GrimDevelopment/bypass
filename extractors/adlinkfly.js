const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().fastforward == true && opt?.ignoreFF !== "true") {
        let r = await lib.fastforward.get(url, true);
        if (r !== null) {
          f = {
            dateSolved: "unknown",
            originalUrl: url,
            destination: r,
            fromCache: false,
            fromFastforward: true
          };
          return f;
        }
      }

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      if (lib.config().debug == true) console.log("[adflylink] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      if (lib.config().debug == true) console.log("[adflylink] Launched. Navigating to URL...");
      await p.goto(url, {waitUntil: "networkidle0"});
      if (lib.config().debug == true) console.log("[adflylink] Done. Starting continuous function...");
      return (await cont(p, url));
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, url) {
  if (lib.config().debug == true) console.log("[adflylink] Attempting to find CAPTCHA...");
  let isCaptcha = await p.evaluate(function () {
    if (document.querySelector("#link-view > p")?.innerHTML?.includes("Please check the captcha")) return true;
    else return false;
  });

  if (isCaptcha) {
    if (lib.config().debug == true) console.log("[adflylink] Solving CAPTCHA...");
    await p.solveRecaptchas();
    if (lib.config().debug == true) console.log("[adflylink] Solved CAPTCHA. Continuing page...");
  } else {
    if (lib.config().debug == true) console.log("[adflylink] No CAPTCHA found. Continuing page...");
  }

  if ((await p.$("#countdown"))) {
    if (lib.config().debug == true) console.log("[adflylink] Retreiving link...");
    await p.waitForSelector(".btn-success.btn-lg:not(.disabled)");
    let r = await p.evaluate(function() {return document.querySelector(".btn-success").href});
    
    return r;
  } else {  
    if (lib.config().debug == true) console.log("[adflylink] Auto-submitting form...");
    await p.evaluate(function() {
      document.querySelector("form").submit();
    });
  
    await p.waitForNavigation();
  
    if (new URL(await p.url()).hostname !== new URL(url).hostname) return p;
    else return (await cont(p, url));
  }
}