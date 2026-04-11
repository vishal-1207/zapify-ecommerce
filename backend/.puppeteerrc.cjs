const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to be within the project directory.
  // This ensures the browser persists across Render's build and run environments.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
