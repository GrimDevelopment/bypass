# API Documentation

This is the documentation to using our API in a project of some kind.

## Notice

When using our API, no matter the instance, you must follow our [license terms](../LICENSE). This includes **giving attribution even when you use a private instance**. [Learn more here](https://choosealicense.com/licenses/agpl-3.0/). 

## Endpoints

<details>
  <summary>
    <code>GET /api/bypass</code> - Get a bypass
  </summary>

### Parameters

|Name|Type|Required|Description|
|---|---|---|---|
|`url`|A URL encoded string.|Yes|The URL of the adlink you want to bypass.|
|`ignoreCache`|`boolean`: `true` or `false`|No|Determines if you want to avoid using the cache for your solution.|
|`allowCache`|`boolean`: `true` or `false`|No|Determines if you don't want to have your link's solution be in the cache.|

### Responses

A successful response would look like this.

```json
{
  "success": true, // Detemines success of request.
  "destination": "https://git.gay/a/bifm", // Destination of URL.
  "original-url": "https://ouo.io/2dktqo", // The original URL.
  "date-solved": 1655685246159, // JS Date() output
  "from-cache": true, // Determines if the solution came from the BIFM instance's cache or not.
  "from-fastforward": false // Determines if the solution came from FastForward's Crowd Bypass feature or not.
}
```

An errored response would look like this.

```json
{
  "success": false,
  "error": "Navigation timeout of 30000 ms exceeded",
  "from-backend": true
}
```
</details>