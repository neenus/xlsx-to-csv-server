const fs = require("fs");
const path = require("path");

const cleanup = () => {

  const inputDir = `${__dirname}/../../storage/input`;
  const outputDir = `${__dirname}/../../storage/output`;
  const inputFiles = fs.readdirSync(inputDir);
  const outputFiles = fs.readdirSync(outputDir);

  inputFiles.forEach(file => file !== "input.txt" ? fs.unlinkSync(`${inputDir}/${file}`) : null);
  outputFiles.forEach(file => file !== "output.txt" ? fs.unlinkSync(`${outputDir}/${file}`) : null);
}

module.exports = cleanup