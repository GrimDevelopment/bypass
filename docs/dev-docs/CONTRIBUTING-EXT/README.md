# Contributing Extractors

If you'd like to contribute your own code, first all we want to say thank you for even considering it. It's quite kind of you to offer your expertise on the subject. Before you do though, we want to offer some guidence on how to do it.

First, we recommend learning to reverse engineer website in general before anything. This means knowing your way around DevTools (otherwise known as "Inspect Element"), among other factors of your browser and the site you're going to attempt writing code to bypass.

Specifically, you also should know how to write code in Node.js, and have experience with the `axios`, `puppeteer` and `cheerio` packages.

## Guidelines for New Extractors

The site must not already solveable under normal circumstances with BIFM. A good frame of reference for "normal circumstances" is the official instance (https://bifm.tacohitbox.com/). We also require that atleast one request to retrieve the destination URL. 

## Guidelines for Updating Extractors

Your update must improve the extractor by either eliminating the need for a CAPTCHA solver, moving from Puppeteer to Axios, or simply fixing a bug.

If you think you're ready, you can move onto the [basics of writing a bypass](./WRITING-EXTRACTORS.md)