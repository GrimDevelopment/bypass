const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["xpshort.com"],
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      let args = (lib.config.defaults?.puppeteer || {headless: true});

      if (lib.config.debug == true) console.log("[longwp] Launching browser...");
      b = await pw.firefox.launch(args);
      let p = await b.newPage();

      if (lib.config.debug == true) console.log("[longwp] Done, opening page...");
      await p.goto(url, {waitUntil: "networkidle"});

      if (lib.config.debug == true) console.log("[longwp] Done, starting continous function...");
      let u = await cont(p);
      await b.close();
      return u;
    } catch(err) {
      throw err;
    }
  }
}

async function cont(p, n) {
  try {
    if ((await p.$("#wpsafelink-landing"))) {
      if (lib.config.debug == true) console.log("[longwpsafe] Handling landing page...");
      if (lib.config.debug == true) console.log("[longwpsafe] Found landing page, parsing...");
      await p.evaluate(function() {
        document.querySelector("#wpsafelink-landing").submit(); 
      });
      await p.waitForLoadState("networkidle");
      return (await cont(p));
    } else if ((await p.$("#getlinkbtn a"))) {
      if (lib.config.debug == true) console.log("[longwpsafe] Found JSON link, parsing...");
      let j = await p.evaluate(function () {
        return atob(document.querySelector("#getlinkbtn a").href.split("safelink_redirect=")[1]);
      });
      j = JSON.parse(j);
      j = (j.safelink || j.second_safelink_url);
      return j;
    } else {
      if (lib.config.debug == true) console.log("[longwp] Nothing found, waiting...");
      await p.waitForLoadState("networkidle");
      if (!n) n = 0;
      if (n >= 10) throw "Redirect not found.";
      return (await cont(p, n));
    }
  } catch(err) {
    if (err.message == "Execution context was destroyed, most likely because of a navigation.") return (await cont(p));
    throw err;
  }
}