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
      
      await p.click("#csubmit");
      await new Promise(resolve => setTimeout(resolve, 1000));
      await p.bringToFront();

      await p.solveRecaptchas();
      await p.waitForNavigation();

      if ((await p.$("#get_link_btn"))) {
        let u = await p.evaluate(function() {
          return document.body.innerHTML.split(`goToUrl ("`)[1].split(`");`)[0];
        });
        await b.close();
        return u;
      } else {
        if (b !== undefined) await b.close();
        throw "Redirect not found.";
      }
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}