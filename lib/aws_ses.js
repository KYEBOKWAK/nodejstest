const env = require('dotenv');
require('dotenv').config();

let aws = require('aws-sdk');
let ses = new aws.SES({ 
  accessKeyId: process.env.AWS_S3_KEY,
  secretAccessKey: process.env.AWS_S3_SECRET,
  region: process.env.AWS_S3_REGION,
});

module.exports = ses;