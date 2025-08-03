const { OpenAI } = require("openai");
const {
  openAiOrganization,
  openAiProject,
  openAiToken,
} = require("../config.json");

const openai = new OpenAI({
  organization: openAiOrganization,
  project: openAiProject,
  apiKey: openAiToken,
});

module.exports = openai;
