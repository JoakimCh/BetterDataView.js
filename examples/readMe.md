# How to run the example

## Using browser:
To easily launch a server for testing purposes you can use `npm` to install `static-server` or `http-server`:
```bash
npm install --global static-server
```
Then you can run this command in the main directory:
```bash
static-server
```
After that you should be able to run the example by going to:
http://127.0.0.1:8080/examples/

Make sure that you use a proper browser like the latest version of Chromium/Chrome or Firefox.

---
## Using Node.js
Make sure that you use an updated version of Node.js with support for ES modules. Most likely you will need to run the script using the `--experimental-modules` flag. Like this:
```bash
node --experimental-modules example_1.js
```
If you also want to be able to use `require()` in the same script then you can implement it like this:
```js
// Implement the old require function
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
// Now you can use require() to require whatever
```

## Using Deno (from deno.land, yeah check it out)
```bash
deno run example_1.js
```

## Conclusion
Using ES modules are awesome since the same script works everywhere without needing any tools to proccess it.
