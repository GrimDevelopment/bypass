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
    "url": "mongodb://127.0.0.1:27017/bifm" // accepted values: any valid mongoDB url
  },
  "http": {
    "port": 32333 // accepted values: any valid http ports
  }, 
  "debug": false // accepted values: true, false
}
```

## Definitions

- `captcha` is on object for captcha-solving service, required for certain solvers.
  - `active` determines whether or not the captcha-solver is enabled.
  - `service` determines which service is used for captcha-solving, like [2captcha (affiliate link)](https://2captcha.com?from=12366899).
  - `key` is the key used for your captcha-solving service.
- `db` is the database used by BIFM.
  - `url` is the URL to the MongoDB database.
- `http` contains the HTTP settings for the server.
  - `port` is the port used for BIFM.
- `debug` determines the status of the server, whether or not it's in debug mode. 

### Debug mode

Debug mode being set to `true` currently:
- Makes errors more specific.
- May log certain things that may compromise user security.

Debug mode being set to `false` currently:
- Makes errors only show the *message* rather than the stack.
- Keeps logging to an absolute minimum whenever possible.