var express = require('express');
var app = express();
var router = express.Router();
const cors = require('cors');
const use = require('abrequire');

const Util = use('lib/util.js');
const res_state = use('lib/res_state.js');

var db = use('lib/db_sql.js');
var mysql = require('mysql');
// const types = use('lib/types.js');

const moment = require('moment');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

app.use(express.json())
app.use(cors());

//slack
var Slack = require('slack-node');
 
webhookUri = process.env.CROWDTICKET_SLACK_WEBHOOK_URI;
 
slack = new Slack();
slack.setWebhook(webhookUri);
////////////

router.post('/ask/filedownload', function(req, res){
  const user_id = req.body.data.user_id;
  const order_id = req.body.data.order_id;
  const email = req.body.data.email;
  const go_url = req.body.data.go_url;

  slack.webhook({
    channel: "#bot-파일전송요청",
    username: "알림bot",
    text: ` 유저ID: ${user_id}\n email: ${email}\n 주문ID: ${order_id}\n 주문서 바로가기: ${go_url}`
  }, function(err, response) {
    // console.log(err);
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  });
})


module.exports = router;