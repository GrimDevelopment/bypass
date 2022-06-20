const ext = require("./extractor");
const config = require("./config.json");
const two = require("2captcha");
const {MongoClient} = require("mongodb");
const client = new MongoClient(config["db"]["url"]);

(async function() {
  await client.connect();
  console.log(`[db] Connected to MongoDB database.`);
})();

const db = client.db("bifm");
const links = db.collection("links");

module.exports = {
  get: async function(url, opt) {
    try {
      let ex = await ext.fromUrl(url);
      let extractor = require(`${__dirname}/extractors/${ex}`);

      if (opt.ignoreCache !== "true") {
        let f = await links.findOne({"original-url": url});
        if (f !== null) {
          f._id = undefined;
          f["from-cache"] = true;
          f["from-fastforward"] = false;
          return f; 
        } 
      }

      if (this.config().debug == true) console.log(`Extracting ${JSON.stringify(opt)}`)
      f = await extractor.get(url, opt);
      if (this.config().debug == true) console.log(`- Extracted ${JSON.stringify(opt)} [Solution: ${f}]`);

      if (typeof f == "string") {
        if (!this.isUrl(f) || f == url) {
          throw "Invalid URL from backend.";
        } 

        let d = {
          "destination": f,
          "original-url": url,
          "date-solved": (new Date() * 1)
        }

        if (opt.allowCache !== "false") {
          if (opt.ignoreCache == "true") {
            if (this.config().debug == true) console.log(`Replacing old version of "${url}" in DB.`)
            await links.findOneAndReplace({"original-url": url}, d);
            if (this.config().debug == true) console.log(`- Replaced.`)
          } else {
            if (this.config().debug == true) console.log(`Adding to DB.`)
            await links.insertOne(d);
            if (this.config().debug == true) console.log(`- Added.`)
          }
        }

        d["_id"] = undefined;
        d["from-cache"] = false;
        d["from-fastforward"] = false;

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
    //    "referrer": "https://google.com"
    // }
    if (config["captcha"]["active"] == false) return null;
    if (this.config().captcha.service == "2captcha") {
      const tc = new two.Solver(config["captcha"]["key"]);
      let ref = opt.referer;
      
      if (this.config().debug == true) console.log(`Requesting CAPTCHA solve for a ${type} @ ${ref}`);
      let a;
      
      switch(type) {
        case "recaptcha":
          a = (await tc.recaptcha(sitekey, ref)).data;
          if (this.config().debug == true) console.log(`- Solved ${type} for "${ref}"`);
          return a; 
        case "hcaptcha":
          a = (await tc.hcaptcha(sitekey, ref)).data;
          if (this.config().debug == true) console.log(`- Solved ${type} for "${ref}"`);
          return a;
        default:
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
  byteCount: function(string) {return encodeURI(string).split(/%..|./).length - 1;},
  config: function() {return config;},
  isUrl: function(url) {return /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.test(url);}
}