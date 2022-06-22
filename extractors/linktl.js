const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "link.tl",
    "link.parts",
    "lnkload.com"
  ],
  requiresCaptcha: true,
  get: async function(url) {
    let b;
    try {
      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      if (lib.config().debug == true) console.log("[linktl] Launching browser...");
      b = await pup.launch({headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"]});
      let p = await b.newPage();
      await p.goto(url);
      
      if (lib.config().debug == true) console.log("[linktl] Launched. Starting continous function...");
      p = (await cont(p, b));

      await b.close();
      return p;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, b) {
  if ((await p.$(".g-recaptcha"))) {
    if (lib.config().debug == true) console.log("[linktl] Opening CAPTCHA...");
    await p.click("#csubmit");
    await p.waitForTimeout(2000); // preventing bugs with captcha solver
    if (lib.config().debug == true) console.log("[linktl] Opened. Navigating out of popups...");
    await p.bringToFront();
    if (lib.config().debug == true) console.log("[linktl] Done. Solving CAPTCHA...");
    await p.solveRecaptchas();
    if (lib.config().debug == true) console.log("[linktl] Solved CAPTCHA. Waiting for next page to load.");
    await p.waitForNavigation();
    return (await cont(p, b));
  } else if ((await p.$("#get_link_btn"))) {
    if (lib.config().debug == true) console.log("[linktl] Retrieving URL from page...");
    let u = await p.evaluate(function() {
      return document.body.innerHTML.split(`goToUrl ("`)[1].split(`");`)[0];
    });
    if (lib.config().debug == true) console.log("[linktl] Got URL. Closing browser...");
    await b.close();
    return u;
  } else {
    await b.close();
    throw "Unknown solution, redirect not found";
  }
}