# How to Write Extractors

This is the very basics of how BIFM works.

Each bypass for a site is in the `extractors/` folder in the root of the BIFM folder. For example, `bc.vc`'s bypass is `extractors/bcvc.js`. 

This is called modularity, it makes it very easy to contribute to BIFM and makes BIFM in general more organized.

## Starting out

Before you begin, make sure it [doesn't already work in this version of BIFM](../INSTANCE.md). A lot of popular adlink sites tend to reuse code, espescially from [`adlinkfly`](../../extractors/adlinkfly.js).

To really get started, you need to make a file in the `extractors/` folder. Name it to be consistent between the others. 

For example, if your module was going to be for a website called `link.com`, name your extractor `linkcom.js`. However, if it's a unique name `mboost.me` or something like that, you can shorten it to `mboost.js`.

## Choosing extractor type

When in doubt, use `axios` & `cheerio` over `puppeteer`. Puppeteer can be very useful for getting around sites that use CAPTCHAs or already have bypasses in [FastForward](https://fastforward.team), but Puppeteer can take up resources very quickly, as it's an entire browser window (hidden, of course) just to scrape a webpage.

### Axios + Cheerio

Copy and paste this template into your extractor.

```js
const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  requiresCaptcha: false,
  get: async function(url, opt) {
    if (lib.config().debug == true) console.log("[scraper] Requesting page...");
    let resp = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      }
    });

    if (lib.config().debug == true) console.log("[scraper] Got page. Parsing page...");
    let $ = cheerio.load(resp.data);

    // do stuff with resp.data here
    // or cheerio via $

    let r = resp.data.split("whatever")[2]; // whatever your end result is, dont use this obviously though, it's an example
    return r;
  }
};
```

Before you do anything, add the domain name (or names) to the hostnames array at the beginning of the exports. That way, the library code can find your scraper. If the domains for your site is `link.com`, then your array should just be `["link.com"]`.

Obviously mess with headers and other details as needed. Then, you can scrape the result you need to get the end URL, once your code finds it, be sure to return it. You need to return it, otherwise you will get the error `Invalid response from backend.`

### Puppeteer

Copy and paste this template into your extractor.

```js
const pup = require("puppeteer-extra");
//const stl = require("puppeteer-extra-plugin-stealth");
//const adb = require("puppeteer-extra-plugin-adblocker");
//const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  requiresCaptcha: true,
  get: async function(url) {
    let b;
    try {
      pup.use(stl());
      /* 
        Delete the portion above and uncomment this if the site 
        
        let stlh = stl();
        stlh.enabledEvasions.delete("iframe.contentWindow");
        pup.use(stlh);
      
      */

      /*
        pup.use(adb()); 

        Uncomment this to enable the adblocker.
      */

      /* 
        pup.use(cap({
          provider: {
            id: lib.config().captcha.service,
            token: lib.config().captcha.key
          }
        }));

        Uncomment the portion above if the site given uses CAPTCHAs.
      */


      if (lib.config().debug == true) console.log("[scraper] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      if (lib.config().debug == true) console.log("[scraper] Launched. Going to page...");
      p.goto(url);

      // put your code here :p

      let r = await p.url(); // insert your solution here.
      await b.close();
      return r;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}
```

Before you do anything, add the domain name (or names) to the hostnames array at the beginning of the exports. That way, the library code can find your scraper. If the domains for your site is `link.com`, then your array should just be `["link.com"]`.

Obviously mess with headers and other details as needed. Then, you can scrape the result you need to get the end URL, once your code finds it, be sure to return it. You need to return it, otherwise you will get the error `Invalid response from backend.`

## Additional Information

Before pull requesting, add logging to your extractor. This makes it easy to debug if/when your extractor becomes out of date.

Logging with BIFM is as simple as below:

```js
if (lib.config().debug == true) console.log("[<scraper name>] <infomation of what's happening>");
```

For example, if you're parsing JSON left in the page, do the following:

```js
if (lib.config().debug == true) console.log("[scraper] Parsing JSON data...");
```