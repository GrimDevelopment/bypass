const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  "requires-captcha": true,
  get: async function(url) {
    let b;
    try {
      pup.use(stl());

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      b = await pup.launch({headless: false});
      let p = await b.newPage();
      await p.goto(url);

      return (await cont(p, url));
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, url) {
  let isCaptcha = await p.evaluate(function () {
    if (document.querySelector("#link-view > p")?.innerHTML?.includes("Please check the captcha")) return true;
    else return false;
  });

  if (isCaptcha) await p.solveRecaptchas();

  if ((await p.$("#countdown"))) {
    await p.waitForSelector(".btn-success.btn-lg:not(.disabled)");
    let r = await p.evaluate(function() {return document.querySelector(".btn-success").href});
    return r;
  } else {  
    await p.evaluate(function() {
      document.querySelector("form").submit();
    });
  
    await p.waitForNavigation();
  
    if (new URL(await p.url()).hostname !== new URL(url).hostname) return p;
    else return (await cont(p, url));
  }
}