const ext = require("./extractor");
const fs = require("fs");

if (!fs.existsSync("./config.json")) {
  if (fs.existsSync("./config.example.json")) {
    fs.copyFileSync("./config.example.json", "./config.json");
    let d = JSON.parse(fs.readFileSync("./config.json"));

    if (!process.env.CONFIG_TEXT) {
      d.captcha = {};
      d.http = {};
      d.db = {}
      if (process.env.PORT) d.http.port = (parseInt(process.env.PORT) || 32333);

      d.captcha.active = (parseBool(process.env.CAPTCHA_ACTIVE) || false);
      d.captcha.service = (process.env.CAPTCHA_SERVICE || "");
      d.captcha.key = (process.env.CAPTCHA_KEY || "");

      d.db.active = (parseBool(process.env.DB_ACTIVE) || false);
      d.db.url = (process.env.DB_URL || "mongodb://127.0.0.1:27017/bifm");

      d.debug = (parseBool(process.env.BIFM_DEBUG) || false);
      d.fastforward = (parseBool(process.env.FASTFORWARD) || true);
      d.alert = (process.env.ALERT || "");
    } else {
      d = JSON.parse(process.env.CONFIG_TEXT);
      if (process.env.PORT) d.http.port = process.env.PORT; // for heroku support
    }
    d = JSON.stringify(d, null, 2);

    fs.writeFileSync("./config.json", d);
  }
  else throw "Couldn't find proper lib.config.";
}

const config = require("./config.json");
const two = require("2captcha");
const got = require("got");
const {MongoClient} = require("mongodb");
let client, db, links;

(async function() {
  if (config.db?.active !== false) {
    if (config.db.active == undefined) {
      config.db.active = true;
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
      console.log("[bifm] Please restart your BIFM instance.");
      process.exit();
    }
    client = new MongoClient(config.db.url);
    await client.connect();
    db = client.db("bifm");
    links = db.collection("links");
    if (config.debug == true) console.log(`[db] Connected to MongoDB database.`);
  } else {
    if (config.debug == true) console.log(`[db] Not connecting to MongoDB database.`);
  }
})();


module.exports = {
  get: get, 
  solve: solveCaptcha,
  solveThroughPage: solveThroughPage,
  cookieString: cookieString,
  fastforward: {
    get: ffGet,
    send: ffSend
  },
  byteCount: byteCount,
  config: config,
  isUrl: isUrl,
  db: {
    get: dbGet
  },
  cloudflare: {
    email: cfEmail
  },
  cacheCount: cacheCount,
  fixSubdomain: fixSubdomain
}

async function get(url, opt) {
  try {
    if (new URL(url).host.substring(new URL(url).host.length - 8) == "carrd.co") url = url.split("#")[0];

    let extractor = await ext.fromUrl(url);
    extractor = require(`./extractors/${extractor}`);

    if (opt.ignoreCache) opt.ignoreCache = parseBool(opt.ignoreCache);
    if (opt.allowCache) opt.allowCache = parseBool(opt.allowCache);
    if (opt.ignoreFF) opt.ignoreFF = parseBool(opt.ignoreFF);
    if (opt.allowFF) opt.allowFF = parseBool(opt.allowFF);

    if (config.debug == true) console.log(`[extract] Starting "${url}"`, opt)

    if (config.db.active == true) {
      await waitUntilDbConnected();
      if (opt.ignoreCache !== true) {
        if (config.debug == true) console.log("[db] Checking DB for desination...");
        let f = await dbGet(url);
        if (f !== null) {
          if (config.debug == true) console.log("[db] Found, sending solution...");
          f.fromCache = true;
          f.fromFastforward = false;
          return f;
        } else {
          if (config.debug == true) console.log("[db] Not found, continuing...");
        }
      }
    }

    if (config.fastforward == true && opt.ignoreFF !== true) {
      let r = await ffGet(url);
      if (r !== null) {
        f = {
          dateSolved: "unknown",
          originalUrl: url,
          destination: r,
          fromCache: false,
          fromFastforward: true,
          isURL: true
        };
        return f;
      }
    } 
    
    f = await extractor.get(fixSubdomain(url), opt);
    if (config.debug == true) console.log(`[extract] Finished "${url}", ${JSON.stringify(opt)} [Solution: ${(JSON.stringify(f) || f)}]`);

    if (typeof f == "string" || typeof f == "object" && !f.destinations) {
      if (!isUrl((f.destination || f)) || (f.destination || f) == url) {
        if (typeof (f.destination || f) == "string" && !extractor.hostnames.includes("linkvertise.com")) {
          if (config.debug == true) console.log("[extract] URL was invalid.", (f.destination||f), url);
          throw "Invalid URL from backend.";
        } else {
          if (config.debug == true) console.log("[extract] URL was invalid, but it was ignored because it was a Linkvertise link.", url);
        }
      } 

      if (config.debug == true) console.log("[extract] Got one link, proceeding...");

      let iu = isUrl((f.destination || f));

      let d = {
        destination: (f.destination || f),
        originalUrl: url,
        dateSolved: (new Date() * 1),
        isURL: iu
      };

      if (f.fastforward == true) {
        if (config.debug == true) console.log(`[extract] Detected FastForward response, correcting and sending...`);
        if (config.db.active == true) {
          if (opt.allowCache !== false) {
            if (config.debug == true) console.log("[db] Checking if data on this link already exists on the DB...");
            let f = await links.findOne({"originalUrl": url});
            if (f == null) f = await links.findOne({"original-url": url}); // older version compatibility
            if (f == null) {
              if (config.debug == true) console.log(`[db] Nothing found. Adding FastForward solution to DB...`)
              await links.insertOne(d);
              if (config.debug == true) console.log(`[db] Added.`);
            } else {
              if (config.debug == true) console.log(`[db] Data already exists. Continuing correcting and sending...`);
            }
          }
        }

        d.dateSolved = "unknown";
        d.fromCache = false;
        d.fromFastforward = true;
        return d;
      }

      if (config.fastforward == true && opt?.allowFF !== false) {
        await ffSend(url, (f.destination || f));
      }

      if (config.db.active == true) {
        if (opt.allowCache !== false) {
          if (opt.ignoreCache == true) {
            if (config.debug == true) console.log(`[db] Replacing old version of "${url}" in DB.`)
            await links.findOneAndReplace({"originalUrl": url}, d);
            if (config.debug == true) console.log(`[db] Replaced.`)
          } else {
            if (config.debug == true) console.log(`[db] Adding to DB...`)
            await links.insertOne(d);
            if (config.debug == true) console.log(`[db] Added.`)
          }
        }
      }

      delete d._id;
      d.fromCache = false;
      d.fromFastforward = false;

      return d;
    } else if (typeof f == "object" && f.destinations) {
      let d = {
        destinations: (f.destinations),
        originalUrl: url,
        dateSolved: (new Date() * 1)
      };

      for (let a in d.destinations) {
        if (!isUrl(d.destinations[a])) delete d.destinations[a]; // removes non-urls
      }

      d.destinations = [...new Set(d.destinations)]; // removes duplicates

      if (f.destinations.length == 0) {
        if (config.debug == true) console.log("[lib] Destination array size is 0, throwing error...");
        throw "Invalid response from backend.";
      } 

      if (config.db.active == true) {
        if (opt.allowCache !== false) {
          d.destinations = JSON.stringify(d.destinations);
          if (opt.ignoreCache == true) {
            if (config.debug == true) console.log(`[db] Replacing old version of "${url}" in DB.`)
            await links.findOneAndReplace({"originalUrl": url}, d);
            if (config.debug == true) console.log(`[db] Replaced.`)
          } else {
            if (config.debug == true) console.log(`[db] Adding to DB...`)
            await links.insertOne(d);
            if (config.debug == true) console.log(`[db] Added.`)
          }
          d.destinations = JSON.parse(d.destinations);
        }
      }

      delete d._id;
      d.fromCache = false;
      d.fromFastforward = false;

      return d;
    } else {
      throw "Invalid response from backend.";
    }
  } catch(err) {
    throw err;
  }
}

function isUrl(url) {
  try {
    let u = new URL(url);
    if (u?.protocol !== null) return true;
    else return false;
  } catch(err) {
    return false;
  }
}

async function cfEmail(data) {
  if (!data.includes("/cdn-cgi/l/email-protection#")) data = `/cdn-cgi/l/email-protection#${data}`;
  let a = data;
  let s = data.indexOf(`/cdn-cgi/l/email-protection`);
  let m = data.length;

  if (a && s > -1 && m > 28) {
    var j = 28 + s;
    s = '';
    if (j < m) {
      r = '0x' + a.substr(j, 2) | 0;
      for (j += 2; j < m && a.charAt(j) != 'X'; j += 2) s += '%' + ('0' + ('0x' + a.substr(j, 2) ^ r).toString(16)).slice(-2);
      j++;
      s = decodeURIComponent(s) + a.substr(j, m - j);
    }
    return s;
  } else {
    return null;
  }
}

async function cacheCount() {
  if (config.db?.active == false) return 0;
  if (links == undefined) await waitUntilDbConnected();
  return (((await (await links.find({})).toArray()).length) || 0);
}

async function dbGet(url) {
  if (links == undefined) await waitUntilDbConnected();
  let f = await links.findOne({"originalUrl": url});
  if (f !== null) {
    if (f.destinations) f.destinations = JSON.parse(f.destinations);
    if (f.destination && f.isURL == undefined || f.isURL == null) {
      f.isURL = require("./lib").isUrl(f.destination);
    }
    return f;
  } else {
    f = await links.findOne({"original-url": url}); // older version compatibility
    if (f !== null) {
      delete f._id;
      if (f["date-solved"]) {
        if (config.debug == true) console.log("[db] Updating old solution format from DB...");
        f = {
          dateSolved: f["date-solved"],
          originalUrl: f["original-url"],
          destination: f["destination"],
          isURL: require("./lib").isUrl(f["destination"])
        }
        delete f._id;
        await links.findOneAndReplace({"original-url": url}, f);
      }
      if (config.debug == true) console.log("[db] Sending DB response...");
      delete f._id;
      return f; 
    } else if (f == null) {
      f = await links.findOne({"url": url}); // older version compatibility
      if (f !== null) {
        if (config.debug == true) console.log("[db] Updating old solution format from DB...");
        f = {
          originalUrl: f["url"],
          destination: f["response"],
          dateSolved: (new Date(f.date) * 1)
        }
        delete f._id;
        await links.findOneAndReplace({"url": url}, f);
        delete f._id;
        return f;
      } else {
        return null;
      }
    }
  }
}



function fixSubdomain(url) {
  // function meant to be for sites that have you visit multiple different domains

  let h = new URL(url).hostname;
  switch(h) {
    case "go.birdurls.com":
    case "birdurls.com":
      return `https://birdurls.com/${url.split("/").slice(3).join("/")}`;
    
    case "owllink.net":
    case "go.owllink.net":
      return `https://owllink.net/${url.split("/").slice(3).join("/")}`;

    case "crazyblog.in":
    case "open.crazyblog.in":
    case "redd.crazyblog.in":
      url = url.replace("open.crazyblog.in", "redd.crazyblog.in");
      url = url.replace("//crazyblog.in", "//redd.crazyblog.in");
    return url;

    case "medipost.org":
    case "links.medipost.org":
    case "usalink.io":
      return `https://links.medipost.org/${url.split("/").slice(3).join("/")}`

    case "pdiskshortener.in":
      return `https://1.htlinks.in/${url.split("/").slice(3).join("/")}`;

    case "safelink.pandaznetwork.com":
      return `https://short.pandaznetwork.com/${url.split("/").slice(3).join("/")}`;

    
    default: return url;
  }
}

async function ffGet(url, igcb) {
  try {
    if ((isCrowdBypass(new URL(url).hostname) || igcb == true)) {
      let b = `domain=${new URL(url).hostname}&path=${new URL(url).pathname.substring(1)}${new URL(url).search}`;
      if (config.debug == true) console.log(`[fastforward] Made body content: `, b);
      if (config.debug == true) console.log("[fastforward] Checking FastForward crowd bypass...");
      let d = await got({
        method: "POST",
        url: "https://crowd.fastforward.team/crowd/query_v1",
        body: b,
        timeout: (5 * 1000),
        throwHttpErrors: false, // Prevent status errors
      });

      if (config.debug == true) console.log("[fastforward] Recieved response", d.status, d.data);

      if (d.status == 204) return null;
      else if (d.status == 200) return d.data;
      else {
        console.log(`[silent error] FastForward error:\nInvalid response code: ${d.status}\n${d.data}`);
        return null;
      }
    } else {
      if (config.debug == true) console.log("[fastforward] Tried to get FastForward URL, not acceptable URL.");
      return null;
    }
  } catch(err) {
    return null;
  }
}

async function ffSend(url, dest, igcb) {
  try {
    if ((isCrowdBypass(new URL(url).hostname) || igcb == true)) {
      let b = `domain=${new URL(url).hostname}&path=${new URL(url).pathname.substring(1)}${new URL(url).search}&target=${encodeURIComponent(dest)}`;
      if (config.debug == true) console.log(`[fastforward] Made body content: `, b);
      if (config.debug == true) console.log("[fastforward] Sending to FastForward crowd bypass...");

      let d = await got({
        method: "POST",
        url: "https://crowd.fastforward.team/crowd/contribute_v1",
        timeout: (7 * 1000),
        body: b,
        throwHttpErrors: false // Prevent status errors
      });

      if (config.debug == true) console.log("[fastforward] Recieved response", d.status, d.data);

      if (d.status == 201) return true;
      else {
        console.log(`[silent error] FastForward error:\nInvalid response code: ${d.status}\n${d.data}`);
        return null;
      }
    }
  } catch(err) {
    return null;
  }
}

async function solveCaptcha(sitekey, type, opt) {
  // opt value must be like:
  // {
  //    "referer": "https://google.com"
  // }
  if (config.captcha.active == false) return null;
  if (config.captcha.service == "2captcha") {
    const tc = new two.Solver(config["captcha"]["key"]);
    let ref = (opt?.referer || "unknown location");
    
    if (config.debug == true) console.log(`[captcha] Requesting CAPTCHA solve for a ${type} @ "${ref}"...`);
    let a;
    
    switch(type) {
      case "recaptcha":
        a = (await tc.recaptcha(sitekey, ref)).data;
        if (config.debug == true) console.log(`[captcha] Solved ${type} for "${ref}".`);
        return a; 
      case "hcaptcha":
        a = (await tc.hcaptcha(sitekey, ref)).data;
        if (config.debug == true) console.log(`[captcha] Solved ${type} for "${ref}".`);
        return a;
      case "image": 
        a = (await(tc.imageCaptcha(sitekey, (opt || {})))).data;
        if (config.debug == true) console.log("[captcha] Solved image captcha.", a);
        return a;
      default:
        console.log(`[captcha] Invalid parameters were given to CAPTCHA solver.`)
        throw "Parameters for CAPTCHA solver are incorrect.";
    }
  }
}

async function solveThroughPage(p) {
  try {
    let type = await p.evaluate(function() {
      if (document.querySelector("iframe[title='recaptcha challenge expires in two minutes']") || document.querySelector(".g-recaptcha")) return "recaptcha";
      else if (document.querySelector(".h-captcha") || document.querySelector("iframe[title='widget containing checkbox for hCaptcha security challenge']")) return "hcaptcha";
      else return null;
    });

    if (type == null) throw "Could not find CAPTCHA type.";
    if (config.debug == true) console.log("[captcha] Got CAPTCHA type:", type);

    let sk = await p.evaluate(function() {
      return (
        document.querySelector("iframe[title='recaptcha challenge expires in two minutes']")?.src.split("k=")[1].split("&")[0] ||
        document.querySelector(".g-recaptcha")?.getAttribute("data-sitekey") ||
        document.querySelector("iframe[title='widget containing checkbox for hCaptcha security challenge']").src.split("sitekey=")[1].split("&")[0] || 
        document.querySelector(".h-captcha")?.getAttribute("data-sitekey")
      );
    });
    
    if (config.debug == true) console.log("[captcha] Got sitekey:", sk);

    if (config.debug == true) console.log("[captcha] Retrieved. Solving CAPTCHA...");
    let c = await solveCaptcha(sk, type, {referer: (await p.url())});

    // callback-based captchas
    if (type == "hcaptcha") {
      let id = await p.evaluate(function() {return document.querySelector("iframe[title='widget containing checkbox for hCaptcha security challenge']").src.split("id=")[1].split("&")[0];});

      let json = JSON.stringify({id: id, label: "challenge-closed", source: "hcaptcha", contents: {event: 'challenge-passed', expiration: 120, response: c}});
      await p.evaluate(`window.postMessage('${json}', '*');`);
    } else {
      let captchaObject = await p.evaluate(function() {return ___grecaptcha_cfg?.clients?.[0]});
      for (let index in captchaObject) {
        for (let index_ in index) {
          console.log(captchaObject[index][index_]);
          break;
        }
        break;
      }

    }
    

    if (config.debug == true) console.log("[captcha] Solved CAPTCHA. Enterring solution and submitting form...");
    await p.evaluate(`document.querySelector("[name='g-recaptcha-response']").value = "${c}";`);
    if (type == "hcaptcha") await p.evaluate(`document.querySelector("[name='h-captcha-response']").value = "${c}";`);
  } catch(err) {
    throw err;
  }
}

function cookieString(co) {
  let s = ``;
  for (let c in co) {
    if (co[c].value == "deleted") continue;
    s = `${s} ${co[c].name}=${encodeURIComponent(co[c].value)};`;
  }
  s = s.substring(0, s.length - 1);
  return s.substring(1);
}

function byteCount(string) {
  return encodeURI(string).split(/%..|./).length - 1;
}

function isCrowdBypass(host) {
  switch(host) {
    case /wadooo\.com|gotravelgo\.space|pantauterus\.me|liputannubi\.net/:
    case "rom.io":
    case "lnk2.cc":
    case /ouo\.(press|io)/:
    case /za\.(gl|uy)/:
    case "zee.gl":
    case /uiz\.(io|app)|moon7\.xyz/:
    case "fc.lc":
    case "fc-lc.com":
    case "elil.cc":
    case "cpmlink.net":
    case /(shon|likn)\.xyz|sloomp\.space/:
    case "cshort.org":
    case "shorten.sh":
    case "gplinks.co":
    case "exe.io":
    case "exey.io":
    case "za.gl":
    case "zee.gl":
    case "za.uy":
      return true;
    default: 
      return false;
  }
}

async function waitUntilDbConnected() {
  return new Promise(function(resolve, reject) {
    try {
      let a = setInterval(function() {
        if (links !== undefined) {
          clearInterval(a);
          resolve(true);
        }
      }, 100);
    } catch(err) {
      reject(err);
    }
  });
}

function parseBool(data) {
  if (typeof data == "string") data = data.toLowerCase();
  switch(data) {
    case "true":
    case "tru":
    case "tr":
    case "t":
    case "y":
    case "ye":
    case "yes":
      return true;
    case "false":
    case "fals":
    case "fal":
    case "fa":
    case "f":
    case "no":
    case "n":
      return false;
    default:
      return data;
  }
}