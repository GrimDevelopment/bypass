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
  get: async function (url) {
    let b;
    try {
      // this may not work for pastes, will add support for them once i come across one

      pup.use(adb({
        blockTrackers: true
      }));

      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);
    
      if (lib.config().debug == true) console.log("[linkvertise] Launching browser...");
      b = await pup.launch({headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"]});
      let p = await b.newPage();

      await p.setUserAgent("Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36");
      await p.goto(url);

      if (lib.config().debug == true) console.log("[linkvertise] Waiting to see if CAPTCHA shows up...");
      await p.waitForTimeout(3000); // this is just for waiting to see if a captcha shows up
      if ((await p.$(".captcha-content"))) {
        if (lib.config().debug == true) console.log(`[linkvertise] CAPTCHA was found, relaunching with CAPTCHA support.`);
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

        b = await pup.launch({headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"]});
        p = await b.newPage();

        if (lib.config().debug == true) console.log("[linkvertise] Reopening page...");
        await p.goto(url);
        await p.waitForTimeout(3000); 
        if (lib.config().debug == true) console.log("[linkvertise] Solving CAPTCHA...");
        await p.solveRecaptchas();
        if (lib.config().debug == true) console.log(`[linkvertise] Solved CAPTCHA.`);
      } else {
        if (lib.config().debug == true) console.log(`[linkvertise] No CAPTCHAs, continuing as normal.`) 
      }

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
      if (a.pathname.startsWith("/api/v1/") && (await (await(res.request()).method())) == "POST" && a.pathname.includes("/target")) {
        let a = (await res.json());
        if (lib.config().debug == true) console.log("[linkvertise] Got URL that met requirements, parsing...");
        if (a.data.target) resolve(a.data.target);
        else reject("Redirect not found.");
      } else {
        if (lib.config().debug == true && a.hostname.includes("linkvertise")) console.log(`[linkvertise] Ignoring request ${(await (await(res.request()).method()))} "${(await res.url())}" from listener.`);
      }
    });
  });
}