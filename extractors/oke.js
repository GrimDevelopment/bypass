const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");

module.exports = {
  "hostnames": ["oke.io"],
  "requires-captcha": false,
  get: async function(url) {
    let b;
    try {
      pup.use(stl());

      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);

      await p.evaluate(function() {
        document.querySelector("form").submit();
      });

      await p.waitForNavigation();
      await p.waitForSelector(".getlinkbtn:not([href='javascript: void(0)']");
      let l = await p.evaluate(function() {return document.querySelector(".getlinkbtn").href});

      await b.close();
      return l;
    } catch(err) {
      if (b !== undefined) await b.close();
    }
  }
}