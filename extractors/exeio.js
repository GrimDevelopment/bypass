const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib")

module.exports = {
  hostnames: ["exe.io", "exey.io"],
  get: async function(url) {
    let b;
    try {
      pup.use(stl());

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);

      await p.waitForNavigation();

      p = await cont(p, url);
      await b.close();
      return p;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, url) {
  try {
    if ((await p.$(".box-main > #before-captcha"))) {
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForNavigation();
      return (await cont(p, url));
    } else if ((await p.$("#invisibleCaptchaShortlink"))) {
      let sk = await p.evaluate(function() {
        return document.querySelector("iframe[title='recaptcha challenge expires in two minutes']").src.split("k=")[1].split("&")[0]
      });
      console.log(sk);
      let c = await lib.solve(sk, "recaptcha", {referer: (await p.url())});
      await p.evaluate(`document.querySelector("[name='g-recaptcha-response']").value = "${c}";`);
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForNavigation();
      return (await cont(p, url));
    } else if ((await p.$(".procced > .btn.get-link.text-white"))) {
      await p.waitForSelector(".procced > .btn.get-link.text-white:not(.disabled)");
      let r = await p.evaluate(function() {
        return document.querySelector(".procced > .btn.get-link.text-white").href
      });
      return r;
    }
  } catch(err) {
    throw err;
  }
}