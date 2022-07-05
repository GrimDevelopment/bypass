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
  else throw "Couldn't find proper config.";
}

const config = require("./config.json");
const two = require("2captcha");
const axios = require("axios");
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
  get: async function(url, opt) {
    try {
      if (new URL(url).host.substring(new URL(url).host.length - 8) == "carrd.co") url = url.split("#")[0];

      let ex = await ext.fromUrl(url);
      let extractor = require(`${__dirname}/extractors/${ex}`);

      if (opt.ignoreCache) opt.ignoreCache = parseBool(opt.ignoreCache);
      if (opt.allowCache) opt.allowCache = parseBool(opt.allowCache);
      if (opt.ignoreFF) opt.ignoreFF = parseBool(opt.ignoreFF);
      if (opt.allowFF) opt.allowFF = parseBool(opt.allowFF);

      if (config.debug == true) console.log(`[extract] Starting "${url}"`, opt)

      if (config.db.active == true) {
        await waitUntilDbConnected();
        if (opt.ignoreCache !== true) {
          if (config.debug == true) console.log("[db] Checking DB for desination...");
          let f = await this.db.get(url);
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
        let r = await this.fastforward.get(url);
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
      
      f = await extractor.get(url, opt);

      if (config.debug == true) console.log(`[extract] Finished "${url}", ${JSON.stringify(opt)} [Solution: ${(JSON.stringify(f) || f)}]`);

      if (typeof f == "string" || typeof f == "object" && !f.destinations) {
        if (!this.isUrl((f.destination || f)) || (f.destination || f) == url) {
          if (ex !== "linkvertise.js") {
            if (config.debug == true) console.log("[extract] URL was invalid.", (f.destination||f), url);
            throw "Invalid URL from backend.";
          } else {
            if (config.debug == true) console.log("[extract] URL was invalid, but it was ignored because it was a Linkvertise link.", url);
          }
        } 

        if (config.debug == true) console.log("[extract] Got one link, proceeding...");

        let iu = this.isUrl((f.destination || f));

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
          await this.fastforward.send(url, f);
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
          if (!this.isUrl(d.destinations[a])) delete d.destinations[a]; // removes non-urls
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
  }, 
  solve: async function(sitekey, type, opt) {
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
          a = (await(tc.imageCaptcha(sitekey))).data;
          if (config.debug == true) console.log("[captcha] Solved image captcha.", a);
          return a;
        default:
          console.log(`[captcha] Invalid parameters were given to CAPTCHA solver.`)
          throw "Parameters for CAPTCHA solver are incorrect.";
      }
    }
    
  },
  cookieString: function(co) {
    let s = ``;
    for (let c in co) {
      if (co[c].value == "deleted") continue;
      s = `${s} ${co[c].name}=${encodeURIComponent(co[c].value)};`;
    }
    s = s.substring(0, s.length - 1);
    return s.substring(1);
  },
  fastforward: {
    get: async function(url, igcb) {
      try {
        if ((isCrowdBypass(new URL(url).hostname) || igcb == true)) {
          let b = `domain=${new URL(url).hostname}&path=${new URL(url).pathname.substring(1)}${new URL(url).search}`;
          if (config.debug == true) console.log(`[fastforward] Made body content: `, b);
          if (config.debug == true) console.log("[fastforward] Checking FastForward crowd bypass...");
          let d = await axios({
            method: "POST",
            url: "https://crowd.fastforward.team/crowd/query_v1",
            data: b,
            validateStatus: function() {return true} // Prevent status errors
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
        throw err;
      }
    },
    send: async function(url, dest, igcb) {
      try {
        if ((isCrowdBypass(new URL(url).hostname) || igcb == true)) {
          let b = `domain=${new URL(url).hostname}&path=${new URL(url).pathname.substring(1)}${new URL(url).search}&target=${encodeURIComponent(dest)}`;
          if (config.debug == true) console.log(`[fastforward] Made body content: `, b);
          if (config.debug == true) console.log("[fastforward] Sending to FastForward crowd bypass...");

          let d = await axios({
            method: "POST",
            url: "https://crowd.fastforward.team/crowd/contribute_v1",
            data: b,
            validateStatus: function() {return true} // Prevent status errors
          });

          if (config.debug == true) console.log("[fastforward] Recieved response", d.status, d.data);

          if (d.status == 201) return true;
          else {
            console.log(`[silent error] FastForward error:\nInvalid response code: ${d.status}\n${d.data}`);
            return null;
          }
        }
      } catch(err) {
        throw err;
      }
    }
  },
  byteCount: function(string) {return encodeURI(string).split(/%..|./).length - 1;},
  config: function() {return config;},
  isUrl: function(url) {
    try {
      let u = new URL(url);
      if (u?.protocol !== null) return true;
      else return false;
    } catch(err) {
      return false;
    }
  },
  db: {
    get: async function(url) {
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
  },
  removeTor: function(args) {
    for (let b in args?.args) {
      if (args?.args?.includes("proxy-server")) {
        let c = new URL(a[b].split("=")[1]);
        if ((c.hostname == "localhost" || c.hostname == "127.0.0.1") && c.port == "9050") {
          delete a[b];
          if (config.debug == true) console.log("[lib] Removed Tor from Puppeteer arguments, due to compatibility issues.");
        }
        else continue; 
      }
    }
    return args;
  },
  cloudflare: {
    check: async function(p) {
      return (await p.evaluate(function() {
        if (document.title.includes("| Cloudflare")) return true;
        else return false;
      }));
    },
    solve: async function(p, attempt) {
      let cfd = await this.check(p);
      if (cfd !== true) {
        if (config.debug == true) console.log("[cloudflare] No protection found, sending back current page object.");
        return p;
      }

      if (config.debug == true) console.log("[cloudflare] Detected Cloudflare protection, looking for the CAPTCHA...");
    
      try {
        await p.waitForSelector("#cf-hcaptcha-container", {timeout: (1000 * 3)});
        if (config.debug == true) console.log("[cloudflare] Found regular CAPTCHA, solving...");
        await p.solveRecaptchas();
      } catch(e) {
        try {
          if (config.debug == true) console.log("[cloudflare] No regular CAPTCHA found, checking for click CAPTCHA...");
          if ((await p.$("#cf-norobot-container"))) {
            if (config.debug == true) console.log("[cloudflare] Found click CAPTCHA, clicking button and continuing...");
            await p.click("#cf-norobot-container");
          } else {
            if (config.debug == true) console.log("[cloudflare] No click CAPTCHA found, continuing page...");
          }
        } catch(e) {
          if (e.message !== "Execution context was destroyed, most likely because of a navigation.") {
            throw e;
          }
        }
      }
    
      try {
        cf = await p.evaluate(function() {
          if (document.title.includes("| Cloudflare")) return true;
          else return false;
        });
      } catch(e) {
        if (e.message !== "Execution context was destroyed, most likely because of a navigation.") throw e;
        return p;
      }
      
    
      if (cf == true) {
        if (config.debug == true) console.log("[cloudflare] Solved CAPTCHA. Waiting for page to refresh...");
        await p.waitForNavigation({waitUntil: "networkidle2"});
        cc = ((attempt + 1) || 0);
        if (config.debug == true) console.log("[cloudflare] Cloudflare bypass attempt", cc);
        if (cc >= 9) {
          if (config.debug == true) console.log("[cloudflare] Cloudflare bypass attempt has exceeded ten times, quitting...");
          throw "Could not bypass Cloudflare.";
        }
        return (await this.solve(p, cc));
      } else {
        try {
          await p.waitForNavigation({waitUntil: "networkidle2", timeout: (1000 * 5)});
        } catch(e) {
          await p.waitForTimeout(1000);
        }
        if (config.debug == true) console.log("[cloudflare] Was a normal CF redirect, sending back original page object...");
        return p;
      }
    }
  }
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