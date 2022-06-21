const ext = require("./extractor");
const fs = require("fs");

if (!fs.existsSync("./config.json")) {
  if (fs.existsSync("./config.example.json")) fs.copyFileSync("./config.example.json");
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
    client = new MongoClient(config["db"]["url"]);
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
      let ex = await ext.fromUrl(url);
      let extractor = require(`${__dirname}/extractors/${ex}`);

      if (config.debug == true) console.log(`[extract] Starting "${url}"`, opt)

      if (config.db.active == true) {
        if (opt.ignoreCache !== "true" && opt.ignoreCache !== true) {
          if (config.debug == true) console.log("[db] Checking DB for desination...");
          let f = await links.findOne({"originalUrl": url});
          if (f == null) f = await links.findOne({"original-url": url});
          if (f !== null) {
            if (config.debug == true) console.log("[db] Sending DB response...");
            delete f._id;
            if (f["date-solved"]) {
              f = {
                dateSolved: f["date-solved"],
                originalUrl: f["original-url"],
                destination: f["destination"],
              }
              await links.findOneAndReplace({"original-url": url}, f);
            }
            f["fromCache"] = true;
            f["fromFastforward"] = false;
            return f; 
          } 
        }
      }

      if (config.fastforward == true && opt.ignoreFF !== "true" && opt.ignoreFF !== true) {
        let r = await this.fastforward.get(url);
        if (r !== null) {
          f = {
            dateSolved: "unknown",
            originalUrl: url,
            destination: r,
            fromCache: false,
            fromFastforward: true
          };
          return f;
        }
      } 
      
      f = await extractor.get(url, opt);
      if (config.debug == true) console.log(`[extract] Finished "${url}", ${JSON.stringify(opt)} [Solution: ${(f.destination || f.destinations || f)}]`);

      if (typeof f == "string") {
        if (!this.isUrl(f) || f == url) {
          throw "Invalid URL from backend.";
        } 

        let d = {
          "destination": f,
          "originalUrl": url,
          "dateSolved": (new Date() * 1)
        }

        if (config.fastforward == true && opt?.allowFF !== "false" && opt.allowFF !== false) {
          await this.fastforward.send(url, f);
        }

        if (config.db.active == true) {
          if (opt.allowCache !== "false" && opt.allowCache !== false) {
            if (opt.ignoreCache == "true" || opt.ignoreCache == true) {
              if (config.debug == true) console.log(`[db] Replacing old version of "${url}" in DB.`)
              await links.findOneAndReplace({"originalUrl": url}, d);
              if (config.debug == true) console.log(`[db] Replaced.`)
            } else {
              if (config.debug == true) console.log(`[db] Adding to DB.`)
              await links.insertOne(d);
              if (config.debug == true) console.log(`[db] Added.`)
            }
          }
        }

        delete d["_id"];
        d["fromCache"] = false;
        d["fromFastforward"] = false;

        return d;
      } else if (typeof f == "object") {
        // meant for sites like carrd when i add them
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
    if (config["captcha"]["active"] == false) return null;
    if (config.captcha.service == "2captcha") {
      const tc = new two.Solver(config["captcha"]["key"]);
      let ref = opt.referer;
      
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
            data: b
          });

          if (config.debug == true) console.log("[fastforward] Recieved response", d.status, d.data);

          if (d.status == 204) return null;
          else if (d.status == 200) return d.data;
          else throw "Invalid response status.";
        } else {
          if (config.debug == true) console.log("[fastforward] Tried to get FastForward URL, not acceptable URL.");
          return null;
        }
      } catch(err) {
        throw err;
      }
    },
    send: async function(url, dest) {
      try {
        if (config.fastforward == true) {
          let b = `domain=${new URL(url).hostname}&path=${new URL(url).pathname.substring(1)}${new URL(url).search}&target=${encodeURIComponent(dest)}`;
          if (config.debug == true) console.log(`[fastforward] Made body content: `, b);
          if (config.debug == true) console.log("[fastforward] Sending to FastForward crowd bypass...");

          let d = await axios({
            method: "POST",
            url: "https://crowd.fastforward.team/crowd/contribute_v1",
            data: b
          });

          if (config.debug == true) console.log("[fastforward] Recieved response", d.status, d.data);

          if (d.status == 201) return true;
          else throw "Invalid response status.";
        }
      } catch(err) {
        throw err;
      }
    }
  },
  byteCount: function(string) {return encodeURI(string).split(/%..|./).length - 1;},
  config: function() {return config;},
  isUrl: function(url) {return /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.test(url);}
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
      return true;
    default: 
      return false;
  }
}