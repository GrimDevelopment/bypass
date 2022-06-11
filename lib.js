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

      f = await extractor.get(url, opt);

      if (typeof f == "string") {
        if (!this.isUrl(f)) {
          throw "Invalid URL from backend.";
        } 
    

        let d = {
          "destination": f,
          "original-url": url,
          "date-solved": (new Date() * 1)
        }

        if (opt.allowCache !== "false") {
          if (opt.ignoreCache == "false") {
            await links.findOneAndReplace({"original-url": url}, d);
          } else {
            await links.insertOne(d);
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
    if (config["captcha"]["active"] == false) return null;
    const tc = new two.Solver(config["captcha"]["key"]);
    let ref = opt.referer;
    switch(type) {
      case "recaptcha":
        return (await tc.recaptcha(sitekey, ref)).data;
      case "hcaptcha":
        return (await tc.hcaptcha(sitekey, ref)).data;
      default:
        return null;
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