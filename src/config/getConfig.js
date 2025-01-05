const config = require("./secrets.json");
const axios = require("axios");
const { jsonToEnv } = require("json-to-env-converter");

const getConfig = async () => {
  // Set initial config from secrets.json
  jsonToEnv(config);

  const API_URL = process.env.NODE_ENV === "production" ?
    process.env.SECRETS_API_URL_PROD :
    process.env.SECRETS_API_URL_DEV;


  try {
    const { data } = await axios.get(API_URL, {
      headers: {
        "x-api-key": process.env.SECRETS_API_KEY
      },
      params: {
        projectName: process.env.NODE_ENV === "production" ? "xlsx2csv-prod" : "xlsx2csv-dev"
      }
    });

    return data;
  } catch (error) {
    console.error(error);
    return {}
  }
};

module.exports = getConfig;
