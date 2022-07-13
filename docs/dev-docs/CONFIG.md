# Configuration

This is a quick start guide on configuring your BIFM server.

## Example

```json
{
  "captcha": {
    "active": false, // accepted values: true, false
    "service": "2captcha", // accepted values: "2captcha"
    "key": "" // enter your api key here
  },
  "db": {
    "active": false, // accepted values: true, false
    "url": "mongodb://127.0.0.1:27017/bifm" // accepted values: any valid mongoDB url
  },
  "http": {
    "port": 32333 // accepted values: any valid http ports
  }, 
  "debug": false, // accepted values: true, false
  "fastforward": true, // accepted values: true, false
  "alert": "", // any string that isn't ""
  "defaults": { // defaults for scrapers
    "axios": { // axios-type scrapers
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0", // the default user agent
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" // accept header
      }
    },
    "puppeteer": { // puppeteer-type scrapers, here are the default launching headers.
      "headless": true
    }
  }
}
```

## Definitions

- `captcha` is on object for captcha-solving service, required for certain solvers.
  - `active` determines whether or not the CAPTCHA solver is enabled.
  - `service` determines which service is used for captcha-solving, like [2captcha (affiliate link)](https://2captcha.com?from=12366899).
  - `key` is the key used for your captcha-solving service.
- `db` is the database used by BIFM.
  - `active` determines whether or not the DB feature is enabled.
  - `url` is the URL to the MongoDB database.
- `http` contains the HTTP settings for the server.
  - `port` is the port used for BIFM.
- `debug` determines the status of the server, whether or not it's in debug mode. 
- `fastforward` deteremines if FastForward's Crowd Bypass server queries are allowed from your server.
- `alert` is text that is displayed on your server's homepage.
- `defaults` is an object containing default information for scrapers, like launching arguments for puppeteer or headers for Axios.
  - `axios` is an object of the axios-type scrapers, setting defaults such as headers for each request.
  - `puppeteer` is the `.launch()` object for `puppeteer-extra`. Allows disabling 

### Debug mode

Debug mode being set to `true` currently:
- Makes errors more specific.
- May log certain things that may compromise user security.

Debug mode being set to `false` currently:
- Makes errors only show the *message* rather than the stack.
- Keeps logging to an absolute minimum whenever possible.

### Heroku Enviroment Variables

You can set each individually when you don't have a `config.json` file in the root of BIFM's folder. Like so:

```sh
PORT

CAPTCHA_ACTIVE
CAPTCHA_SERVICE
CAPTCHA_KEY

DB_ACTIVE
DB_URL

BIFM_DEBUG
FASTFORWARD
ALERT
```

Or you can set a variable called `CONFIG_TEXT` with a stringified version of a config.json file compatible with BIFM.