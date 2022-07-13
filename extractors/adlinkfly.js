const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: ["shortly.xyz"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().fastforward == true && opt.ignoreFF !== true) {
        let r = await lib.fastforward.get(url, true);
        if (r !== null) {
          return {destination: r, fastforward: true};
        }
      }

      let hn = new URL(url).hostname;
      if (antiAd(hn) == false) pup.use(adb());
      else if (lib.config().debug == true) console.log("[adlinkfly] Disabled adblock due to issues with the site.");

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      if (lib.config().debug == true) console.log("[adlinkfly] Launching browser...");
      let args = (lib.config().defaults?.puppeteer || {headless: true});;
      b = await pup.launch(args);
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[adlinkfly] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle2"});

      if (lib.config().debug == true) console.log("[adlinkfly] Done. Starting continuous function...");

      let u = (await cont(p, url));
      await b.close();
      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, url, cfc) {
  let hn = new URL(url).hostname;
  let chn = new URL((await p.url())).hostname;

  if (multidomain(hn).length > 1) {
    console.log(multidomain(hn));
    let n = [];
    let dd = multidomain(hn);
    for (let c in dd) {
      if (dd[c] !== chn) n.push(dd[c]);
    }
    if (n.length == multidomain(hn).length) {
      return (await p.url());
    }
  } else {
    if (hn !== chn) {
      return (await p.url());
    }
  }

  if (lib.config().debug == true) console.log("[adlinkfly] Attempting to find CAPTCHA...");
  let isCaptcha = await p.evaluate(function () {
    if (document.querySelector("#link-view > p")?.innerHTML?.includes("Please check the captcha")) return true;
    else return false;
  });

  if (isCaptcha) {
    if (lib.config().debug == true) console.log("[adlinkfly] Found CAPTCHA. Solving CAPTCHA...");
    await p.solveRecaptchas();
    if (lib.config().debug == true) console.log("[adlinkfly] Solved CAPTCHA. Continuing page...");
  } else {
    if (lib.config().debug == true) console.log("[adlinkfly] No CAPTCHA found. Continuing page...");
  }

  if (lib.config().debug == true) console.log("[adlinkfly] Attempting to find Cloudflare protection....");
  let cf = await lib.cloudflare.check(p);
  if (cf == true) {
    if (lib.config().debug == true) console.log("[adlinkfly] Found CloudFlare protection, bypassing...");
    p = await lib.cloudflare.solve(p);
  }

  let bd = await p.evaluate(function() {return document.body.innerHTML});
  if (bd.split(`document.getElementById('click').style.display = 'none';\n\t\tdocument.getElementById('`)[1]) {
    if (lib.config().debug == true) console.log("[adlinkfly] Found hidden CAPTCHA, unhiding and solving...");
    let id = bd.split(`document.getElementById('click').style.display = 'none';\n\t\tdocument.getElementById('`)[1].split(`'`)[0];
    await p.evaluate(`document.getElementById('${id}').style.display = 'block'`);
    await p.waitForTimeout(5000);
    await p.solveRecaptchas();
  }

  if ((await p.$("#countdown"))) {
    if (lib.config().debug == true) console.log("[adlinkfly] Retreiving link...");
    await p.waitForSelector(".btn-success.btn-lg:not(.disabled):not([disabled]):not([href='javascript: void(0)'])");
    let r = await p.evaluate(function() {return document.querySelector(".btn-success").href});
    
    return r;
  } else {  
    if ((await p.$("form > div[style='display:none;'] > *[name='_method']")) || (await p.$("[name='hidden'][value='hidden']"))) {
      if (lib.config().debug == true) console.log("[adlinkfly] Auto-submitting form...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
    
      hn = await new URL(url).hostname;
      if (antiAd(hn) == true) {
        await p.waitForNavigation({waitUntil: "domcontentloaded"});
      } else {
        await p.waitForNavigation({waitUntil: "networkidle0"});
      }
      return (await cont(p, url));
    } else {
      return (await p.url());
    }
  }
}

function antiAd(hn) {
  switch(hn) {
    case "median.uno":
    return true;

    default:
    return false;
  }
}

function multidomain(hn) {
  // use this to prevent too many 
  switch(hn) {
    case "median.uno":
    return ["mdn.world", "techydino.net", "median.uno"];
    
    default:
    return [hn];
  }
}