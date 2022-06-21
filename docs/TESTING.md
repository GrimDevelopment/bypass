# Testing Extractors

Testing extractors is a simple way to see if an extractor is broken without turning on your server or database.

Here are the following ways to test extractors.

## Usage

Your terminal must be in the root of the BIFM folder to run the following commands.

It is recommended to turn on `debug` in your config before running the tests script.

```
node ./tests.js "[start domain/extractor name/index]" "[end domain/extractor name/index/'-']"
```

### Examples

If you want to run the boost.ink example and end it after:

```
node ./tests.js boost.ink -
```

Run all tests available: 

```
node ./tests.js 
```

Run linkvertise test and all after (alphabetically):

```
node ./tests.js "linkvertise (redirect)"
```