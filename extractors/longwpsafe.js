const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  get: async function(url, opt) {
    let b;
    try {
      pup.use(stl());
      pup.use(adb());

      let args = (lib.config().defaults?.puppeteer || {headless: true});

      b = await pup.launch(args);
      let p = await b.newPage();

      await p.goto(url, {waitUntil: "networkidle2"});

      let u = await cont(p);
      await b.close();
      return u;
    } catch(err) {
      throw err;
    }
  }
}

async function cont(p) {
  try {
    if ((await p.$("#wpsafelink-landing"))) {
      if (lib.config().debug == true) console.log("[longwpsafe] Found landing page, parsing...");
      await p.evaluate(function() {
        document.querySelector("#wpsafelink-landing").submit(); 
      });
      await p.waitForNavigation();
      return (await cont(p));
    } else if ((await p.$("#getlinkbtn a"))) {
      if (lib.config().debug == true) console.log("[longwpsafe] Found JSON link, parsing...");
      let j = await p.evaluate(function () {
        return atob(document.querySelector("#getlinkbtn a").href.split("safelink_redirect=")[1]);
      });
      j = JSON.parse(j);
      j = (j.safelink || j.second_safelink_url);
      return j;
    } else {
      if (lib.config().debug == true) console.log("[longwpsafe] Nothing found, waiting...");
      await p.waitForNavigation();
      return (await cont(p));
    }
  } catch(err) {
    if (err.message == "Execution context was destroyed, most likely because of a navigation.") return (await cont(p));
    throw err;
  }
}