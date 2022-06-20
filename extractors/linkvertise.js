const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const lib = require("../lib");
const cap = require("puppeteer-extra-plugin-recaptcha");

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
  "requires-captcha": true,
  get: async function (url) {
    let b;
    try {
      // this may not work for pastes, will add support for them once i come across one

      pup.use(adb());
    
      b = await pup.launch({headless: true});
      let p = await b.newPage();

      await p.setUserAgent("Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36");
      await p.goto(url);

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

        b = await pup.launch({headless: true});
        p = await b.newPage();

        await p.goto(url);
        await p.waitForTimeout(3000); 
        await p.solveRecaptchas();
        if (lib.config().debug == true) console.log(`[linkvertise] Solved captcha.`);
      } else {
        if (lib.config().debug == true) console.log(`[linkvertise] No captchas, continuing as normal.`) 
      }

      await p.waitForSelector(".lv-dark-btn");
      return (await follow(p, b));
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function follow(p, b) {
  p.click("lv-button > .lv-button-component.new-button-style.lv-dark-btn.ng-star-inserted");
  try {
    let a = await fireWhenFound(p);
    await b.close();
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
        if (a.data.target) resolve(a.data.target);
        else reject("Redirect not found.");
      } 
    });
  });
}