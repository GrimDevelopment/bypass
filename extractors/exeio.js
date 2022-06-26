const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib")

module.exports = {
  hostnames: ["exe.io", "exey.io"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config().debug == true) console.log("[exeio] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();

      await p.goto(url);

      if (!(await p.url()).includes("exey.io")) {
        if (lib.config().debug == true) console.log("[exeio] Launched. Skipping first page...");
        await p.waitForNavigation();
      }

      if (lib.config().debug == true) console.log("[exeio] Starting continous function...");
      
      p = await cont(p, url, b);
      
      await b.close();
      return p;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, url, b) {
  try {
    if ((await p.$(".box-main > #before-captcha"))) {
      if (lib.config().debug == true) console.log("[exeio] Skipping non-CAPTCHA page...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForNavigation();
      return (await cont(p, url, b));
    } else if ((await p.$("#invisibleCaptchaShortlink"))) {
      if (lib.config().debug == true) console.log("[exeio] Retrieving sitekey...");
      let sk = await p.evaluate(function() {
        return document.querySelector("iframe[title='recaptcha challenge expires in two minutes']").src.split("k=")[1].split("&")[0]
      });
      if (lib.config().debug == true) console.log("[exeio] Retrieved. Solving CAPTCHA...");
      let c = await lib.solve(sk, "recaptcha", {referer: (await p.url())});
      if (lib.config().debug == true) console.log("[exeio] Solved CAPTCHA. Enterring solution and submitting form...");
      await p.evaluate(`document.querySelector("[name='g-recaptcha-response']").value = "${c}";`);
      p.on("dialog", function(d) {
        if (lib.config().debug == true) console.log("[exeio] Recieved a dialog, auto-accepting.");
        d.accept();
      })
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      if (lib.config().debug == true) console.log("[exeio] Submitted. Waiting...");
      await p.waitForNavigation();
      return (await cont(p, url, b));
    } else if ((await p.$(".procced > .btn.get-link.text-white"))) {
      if (lib.config().debug == true) console.log("[exeio] Counting down...");
      await p.waitForSelector(".procced > .btn.get-link.text-white:not(.disabled)");
      let r = await p.evaluate(function() {
        return document.querySelector(".procced > .btn.get-link.text-white").href
      });
      return r;
    } else {
      throw "The exe.io link is dead.";
    }
  } catch(err) {
    throw err;
  }
}