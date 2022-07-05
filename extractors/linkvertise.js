const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "linkvertise.com",
    "linkvertise.net",
    "up-to-down.net",
    "link-to.net",
    "direct-link.net",
    "linkvertise.download",
    "file-link.net",
    "link-center.net",
    "link-target.net"
  ],
  requiresCaptcha: false,
  get: async function (url, opt) {
    let b;
    try {
      // this may not work for pastes, will add support for them once i come across one

      let host = new URL(url).hostname;
      if (host == "linkvertise.download") {
        url = `https://linkvertise.com/${new URL(url).pathname.split("/").slice(2, 4).join("/")}`;
        if (lib.config().debug == true) console.log(`[linkvertise] Converted linkvertise.download link to ${url}`);
      }

      pup.use(adb({
        blockTrackers: true
      }));

      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);
    
      if (lib.config().debug == true) console.log("[linkvertise] Launching browser...");
      let a = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(a);
      let p = await b.newPage();

      if (lib.config().debug == true) console.log("[linkvertise] Launched. Opening page...");

      await p.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 13_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1");
      await p.goto(url);
      await p.waitForTimeout(3000);

      if ((await p.$(".captcha-content"))) {
        if (lib.config().debug == true) console.log(`[linkvertise] CAPTCHA was found, relaunching with CAPTCHA support...`);
        await b.close();

        if (lib.config().captcha.active == false) {
          throw "Captcha service is required for this link, but this instance doesn't support it."
        }

        pup.use(cap({
          provider: {
            id: lib.config().captcha.service,
            token: lib.config().captcha.key
          }
        }));

        let args = (lib.config().defaults?.puppeteer || {headless: true});
        b = await pup.launch(lib.removeTor(args));
        p = await b.newPage();
        if (opt.referer) {
          if (lib.config().debug == true) console.log("[linkvertise] Going to referer URL first...");
          await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
        }
      
        if (lib.config().debug == true) console.log("[linkvertise] Launched. Reopening page...");
        await p.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 13_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1");
        await p.goto(url);
        await p.waitForTimeout(3000);
        if (lib.config().debug == true) console.log("[linkvertise] Done. Solving CAPTCHA...");
        await p.solveRecaptchas();
        if (lib.config().debug == true) console.log(`[linkvertise] Solved CAPTCHA, continuing as normal...`);
      } else {
        if (lib.config().debug == true) console.log(`[linkvertise] No CAPTCHAs, continuing as normal...`) 
      }

      if ((await p.url()) == "https://linkvertise.com/") throw "The link is dead.";

      if (lib.config().debug == true) console.log("[linkvertise] Counting down...");
      await p.waitForSelector(".lv-dark-btn");
      let u = await follow(p, b);

      await b.close();

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function follow(p) {
  p.click("lv-button > .lv-button-component.new-button-style.lv-dark-btn.ng-star-inserted");
  if (lib.config().debug == true) console.log("[linkvertise] Clicking button...");
  try {
    if (lib.config().debug == true) console.log("[linkvertise] Setting up listener for network events...");
    let a = await fireWhenFound(p);
    if (lib.config().debug == true) console.log("[linkvertise] Closing browser...");
    return a;
  } catch(err) {
    throw err;
  }
}

async function fireWhenFound(p) {
  return new Promise(function(resolve, reject) {
    p.on("response", async function(res) {
      let a = new URL((await res.url()));
      if (a.host == "publisher.linkvertise.com") {
        if (a.pathname.startsWith("/api/v1/") && (await (await(res.request()).method())) == "POST" && a.pathname.includes("/target")) {
          try {
            let a = (await res?.json());
            if (lib.config().debug == true) console.log("[linkvertise] Got URL that met requirements, parsing...");
            if (a?.data?.target) resolve(a.data.target);
            else reject("Redirect not found.");
          } catch(err) {
            console.log("[silent error] Error extracting linkvertise URL.", err.stack);
          }
        } else if (a.pathname.startsWith("/api/v1/") && (await (await(res.request()).method())) == "POST" && a.pathname.includes("/paste")) {
          try {
            let a = (await res?.json());
            if (lib.config().debug == true) console.log("[linkvertise] Got URL that met requirements, parsing...");
            if (a?.data?.paste) resolve(a.data.paste);
            else reject("Redirect not found.");
          } catch(err) {
            console.log("[silent error] Error extracting linkvertise URL.", err.stack);
          }
        } else {
          if (lib.config().debug == true && a.hostname.includes("linkvertise")) console.log(`[linkvertise] Ignoring request ${(await (await(res.request()).method()))} "${(await res.url())}" from listener.`);
        }
      }
    });
  });
}