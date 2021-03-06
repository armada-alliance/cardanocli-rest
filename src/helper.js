const { dirname, resolve } = require("path");
const fs = require("fs");
const CardanoCli = require("cardanocli-js");

const PUBLIC_TMP = "/tmp";
const ROOT_DIR = dirname(require.main.filename);
const ABSOLUTE_TMP = resolve(`${ROOT_DIR}/../public${PUBLIC_TMP}`);

/**
 * @typedef {Object} app_config
 * @property {object} cli - Cli config
 * @property {string} cli.network - Cardano network to be used [Default: 'mainnet']
 * @property {string} cli.era - Cardano era to be used [Default: 'allegra']
 * @property {string} cli.dir - Directory where file are created. [Default: '.']
 * @property {string} cli.shelleyGenesisPath - Shelley Genesis file location.
 * @property {string} cli.socketPath - cardano-node socket directory path. [Default: null]
 * @property {object} helper - Helper config
 * @property {number} helper.tmpFileTTL - Time in seconds after which download files are removed
 */

/**
 * @type {app_config} config - App Configuration object
 */
const config = (function () {
  "use strict";

  const yaml = require("js-yaml");
  const fs = require("fs");
  let content = "";
  let config = {};

  try {
    content = fs.readFileSync("./config.yaml", "utf8");
  } catch (e) {
    throw (
      "config.yaml not found! Tips: copy and update config.yaml.dist" + "\n" + e
    );
  }

  try {
    config = yaml.load(content);
  } catch (e) {
    throw "config.yaml incorrect YAML format!" + "\n" + e;
  }

  return config;
})();

/**
 * @type {app_config} config - App Configuration object
 */
exports.config = config;

/**
 * @type {CardanoCli} cardanoCli - CardanoCli object
 */
exports.cardanoCli = new CardanoCli({
  network: config.cli.network,
  era: config.cli.era,
  dir: config.cli.dir,
  shelleyGenesisPath: config.cli.shelleyGenesisPath,
  socketPath: config.cli.socketPath,
});

/**
 * @param {Request} request - ExpressJs Request object
 * @param  {...string} args - Exploded path string to be added
 * @returns {string} - Full url string
 */
exports.generateUrl = (request, ...args) =>
  `${request.protocol}://${request.get("host")}${args.join("/")}`;

/**
 * @param {*} filePath - Target file path
 * @param {*} symlinkName - Symlink file name
 */
exports.createSymlink = (filePath, symlinkName) => {
  const { resolve } = require("path");
  const fs = require("fs");
  const absBasePath = resolve(config.cli.dir);
  const absFilePath = resolve(filePath);

  // Security: Allow only download from 'config.cli.dir'
  if (
    0 === absFilePath.indexOf(absBasePath) &&
    fs.existsSync(absFilePath) &&
    fs.statSync(absFilePath).isFile()
  ) {
    fs.symlink(
      absFilePath,
      `${ABSOLUTE_TMP}/${symlinkName}`,
      (err) => err && console.log(err)
    );
  } else {
    throw new Error("Access denied!");
  }
};

/**
 * Clean Public temporary folder
 */
exports.cleanTMPFiles = () => {
  const cron = require("node-cron");
  const tmpFileTTL = config.helper.tmpFileTTL;

  cron.schedule("*/2 * * * *", () => {
    let files = fs.readdirSync(ABSOLUTE_TMP);
    let result = [];

    files.forEach((fileName) => {
      if (".gitkeep" !== fileName) {
        let filePath = `${ABSOLUTE_TMP}/${fileName}`;
        let fileStat = fs.lstatSync(filePath);
        let now = new Date(Date.now());
        let expireAt = new Date(
          new Date(fileStat.mtime).getTime() + tmpFileTTL * 1000
        );

        if (expireAt < now) {
          fs.unlinkSync(filePath);
          result.push(fileName);
        }
      }
    });

    let count = result.length;

    if (count) {
      let timestamp = new Date(Date.now());
      console.log(
        `[${timestamp.toISOString()}] Deleted ${count} expired file(s) in /public${PUBLIC_TMP} :`
      );
      console.log(result);
    }
  });
};
