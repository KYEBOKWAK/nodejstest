var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

const Types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const moment = require('moment');

var mysql = require('mysql');
const Util = use('lib/util.js');

const global = use('lib/global_const.js');

//slack
const slack = use('lib/slack');
////////////


router.post('/add', function(req, res){
  const user_id = req.body.data.user_id;
  const target_id = req.body.data.target_id;
  const target_type = req.body.data.target_type;
  const reason = req.body.data.reason;

  const target_content = req.body.data.target_content;
  const target_store_title = req.body.data.target_store_title;
  const target_item_title = req.body.data.target_item_title;

  const contents = req.body.data.contents;

  var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let reportData = {
    user_id: user_id,
    target_id: target_id,
    target_type: target_type,
    reason: reason,
    created_at: date
  }

  db.INSERT("INSERT INTO reports SET ?", reportData, 
  (result) => {

    // if(process.env.APP_TYPE !== 'local'){
      let slack_title = '';
      let slack_text = '';

      if(target_type === Types.report.comment){
        slack_title = '[코멘트]';
      }

      if(contents){
        //기존 신고 방식 수정하기 귀찮아서 그냥 contents 추가함.
        slack_text = `${contents}`;
      }else{
        slack_text = `${slack_title}\n플레이스명: ${target_store_title}\n상품명: ${target_item_title}\n코멘트: ${target_content}\n신고이유: ${reason}`;
      }

      slack.webhook({
        channel: "#bot-신고하기",
        username: "신고bot",
        text: slack_text
      }, function(err, response) {
        console.log(err);
      });
    // }
    

    return res.json({
      result: {
        state: res_state.success
      }
    })
  })
})

module.exports = router;