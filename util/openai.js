const { OpenAI } = require("openai");

const openai = new OpenAI({
  organization: process.env.OPENAI_ORGANIZATION,
  project: process.env.OPENAI_PROJECT,
  apiKey: process.env.OPENAI_TOKEN,
});

module.exports = openai;
