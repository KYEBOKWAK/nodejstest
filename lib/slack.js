const env = require('dotenv');
require('dotenv').config();

let Slack = require('slack-node');
 
let slack = new Slack();
slack.setWebhook(process.env.CROWDTICKET_SLACK_WEBHOOK_URI);

module.exports = slack;