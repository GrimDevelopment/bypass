const pup = require("puppeteer-extra");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "link.tl",
    "link.parts",
    "lnkload.com"
  ],
  "requires-captcha": true,
  get: async function(url) {
    let b;
    try {
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
      let p = await b.newPage();

      await p.goto(url);
      
      p = (await cont(p, b));
      return p;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, b) {
  if ((await p.$(".g-recaptcha"))) {
    await p.click("#csubmit");
    await p.waitForTimeout(5000);
    await p.bringToFront();
    await p.solveRecaptchas();
    await p.waitForNavigation();
    return (await cont(p, b));
  } else if ((await p.$("#get_link_btn"))) {
    let u = await p.evaluate(function() {
      return document.body.innerHTML.split(`goToUrl ("`)[1].split(`");`)[0];
    });
    console.log(u)
    await b.close();
    return u;
  } else {
    await b.close();
    throw "Unknown solution, redirect not found";
  }
}