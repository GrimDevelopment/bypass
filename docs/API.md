# API Documentation

This is the documentation to using our API in a project of some kind.

## Notice

When using our API, no matter the instance, you must follow our [license terms](../LICENSE). This includes **giving attribution even when you use a private instance**. [Learn more here](https://choosealicense.com/licenses/agpl-3.0/). 

## Endpoints

Click to expand each endpoint.

<details>
  <summary>
    <code>GET /api/bypass</code> - Get a bypass
  </summary>

### Parameters

|Name|Type|Required|Description|
|---|---|---|---|
|`url`|A URL encoded string.|Yes|The URL of the adlink you want to bypass.|
|`ignoreCache`|`boolean`: `true`/`false`|No|Determines if you want to avoid using the cache for your solution.|
|`allowCache`|`boolean`: `true`/`false`|No|Determines if you don't want to have your link's solution be in the cache.|
|`ignoreFF`|`boolean`: `true`/`false`|No|Determines if you don't want to avoid checking FastForward's Crowd Bypass for a destination.|
|`allowFF`|`boolean`: `true`/`false`|No|Determines if you don't want to sync certain types of links to FastForward's Crowd Bypass.|


### Responses

A successful response would look like this.

```json
{
  "success": true, // Detemines success of request.
  "destination": "https://git.gay/a/bifm", // Destination of URL.
  "originalUrl": "https://ouo.io/2dktqo", // The original URL.
  "dateSolved": 1655685246159, // JS Date() output
  "fromCache": true, // Determines if the solution came from the BIFM instance's cache or not.
  "fromFastforward": false // Determines if the solution came from FastForward's Crowd Bypass feature or not.
}
```

An errored response would look like this.

```json
{
  "success": false,
  "error": "Navigation timeout of 30000 ms exceeded",
  "fromBackend": true
}
```
</details>