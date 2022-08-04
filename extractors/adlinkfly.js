const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const lib = require("../lib");

module.exports = {
  hostnames: ["shortly.xyz"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.fastforward == true && opt.ignoreFF !== true) {
        let r = await lib.fastforward.get(url, true);
        if (r !== null) {
          return {destination: r, fastforward: true};
        }
      }

      let hn = new URL(url).hostname;
      let blocker = await PlaywrightBlocker.fromPrebuiltFull();

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config.debug == true) console.log("[adlinkfly] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});;
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      if (antiAd(hn) == false) await blocker.enableBlockingInPage(p);
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[adlinkfly] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }

      try {
        await p.goto(url, {waitUntil: "networkidle"});
      } catch(e) {
        if (!e.message?.toLowerCase()?.includes("timeout")) throw e;
      }
      
      if (lib.config.debug == true) console.log("[adlinkfly] Done. Starting continuous function...");

      let u = (await cont(p, url));
      await b.close();
      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, url) {
  if (lib.config.debug == true) console.log("[adlinkfly] Attempting to find CAPTCHA...");
  let isCaptcha = await p.evaluate(function () {
    if (document.querySelector("#link-view p")?.innerHTML?.includes("Please check the captcha")) return true;
    else if (document.querySelector("#content > #click")) return true;
    else return false;
  });

  if (isCaptcha) {
    if (lib.config.debug == true) console.log("[adlinkfly] Found CAPTCHA. Solving CAPTCHA...");
    await lib.solveThroughPage(p);
    if (lib.config.debug == true) console.log("[adlinkfly] Solved CAPTCHA. Continuing page...");
  } else {
    if (lib.config.debug == true) console.log("[adlinkfly] No CAPTCHA found. Continuing page...");
  }
  
  if ((await p.$("#countdown"))) {
    if (lib.config.debug == true) console.log("[adlinkfly] Retreiving link...");
    await p.waitForSelector(".get-link:not(.disabled):not([disabled]):not([href='javascript: void(0)']):not([href='" + (await p.url()) + "'])");
    let r = await p.evaluate(function() {return document.querySelector(".get-link").href});
    
    return r;
  } else {  
    if ((await p.$("form > div[style='display:none;'] > *[name='_method']")) || (await p.$("[name='hidden'][value='hidden']"))) {
      if (lib.config.debug == true) console.log("[adlinkfly] Auto-submitting form...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
    
      hn = await new URL(url).hostname;
      if (antiAd(hn) == true) {
        await p.waitForLoadState("domcontentloaded");
      } else {
        await p.waitForLoadState("networkidle");
      }
      return (await cont(p, url));
    } else {
      let cf = await p.$("#cf-challenge-running");
      if (cf) {
        await p.waitForNavigation({waitUntil: "networkidle"});
        return (await cont(p, url));
      } else {
        return (await p.url());
      }
    }
  }
}

function antiAd(hn) {
  switch(hn) {
    case "median.uno":
    case "techydino.net":
    return true;

    default:
    return false;
  }
}