var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');

//slack
var Slack = require('slack-node');
 
webhookUri = process.env.CROWDTICKET_SLACK_WEBHOOK_URI;
 
slack = new Slack();
slack.setWebhook(webhookUri);
////////////

router.post('/get', function(req, res){
  const store_id = req.body.data.store_id;

  if(store_id === undefined || store_id === null || store_id === ''){
    return res.json({
      state: res_state.error,
      message: 'store id error(get)',
      result: {}
    })
  }

  const querySelect = mysql.format("SELECT id, channel, name, tier, tier_is_discussion, email, contact, opinion, categorys, updated_at FROM ad_consultings WHERE store_id=?", [store_id]);
  db.SELECT(querySelect, {}, (result) => {

    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...result[0]
        }
      }
    })

  });

});

router.post('/save', function(req, res){
  const store_id = req.body.data.store_id;

  if(store_id === undefined || store_id === null || store_id === ''){
    return res.json({
      state: res_state.error,
      message: 'store id error(save)',
      result: {}
    })
  }

  var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const channel = req.body.data.channel;

  const name = req.body.data.name;
  const tier = req.body.data.tier;
  const tier_is_discussion = req.body.data.tier_is_discussion;
  const email = req.body.data.email;
  const contact = req.body.data.contact;
  const opinion = req.body.data.opinion;
  const categorys = req.body.data.categorys.toString();
  const is_consulting = false;
  const created_at = date;
  const updated_at = date;
  const consulting_at = date;


  const querySelect = mysql.format("SELECT id FROM ad_consultings WHERE store_id=?", [store_id]);
  db.SELECT(querySelect, {}, (result) => {

    let isInsert = false;
    if(result.length === 0) {
      isInsert = true;
    }

    
    if(isInsert){
      const ad_consultings = {
        store_id: store_id,
        channel: channel,
        name: name,
        tier: tier,
        tier_is_discussion: tier_is_discussion,
        email: email,
        contact: contact,
        opinion: opinion,
        categorys: categorys,
        is_consulting: is_consulting,
        created_at: created_at,
        updated_at: updated_at,
        consulting_at: null
      }

      db.INSERT("INSERT INTO ad_consultings SET ?;", ad_consultings, function(result_insert){
        console.log("success!!!!!!!");
        if(result_insert === undefined){
          return res.json({
            state: 'error',
            message: 'ad_consultings insert error!',
            result: {
            }
          });
        }

        slack.webhook({
          channel: "#광고신청-업데이트",
          username: "신청bot",
          text: `[광고-신규]\n이름: ${name}\nemail: ${email}`
        }, function(err, response) {
          console.log(err);
        });

        return res.json({
          result: {
            state: res_state.success,
          }
        });
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: error,
          result:{}
        })
      })
    }else{
      const data = result[0];

      const ad_consultings = {
        // store_id: store_id,
        channel: channel,
        name: name,
        tier: tier,
        tier_is_discussion: tier_is_discussion,
        email: email,
        contact: contact,
        opinion: opinion,
        categorys: categorys,
        is_consulting: is_consulting,
        // created_at: created_at,
        updated_at: updated_at,
        consulting_at: null
      }

      db.UPDATE("UPDATE ad_consultings SET ? WHERE id=?", [ad_consultings, data.id], function(result_update){

        slack.webhook({
          channel: "#광고신청-업데이트",
          username: "업데이트bot",
          text: `[광고-업데이트]\n이름: ${name}\nemail: ${email}`
        }, function(err, response) {
          console.log(err);
        });

        return res.json({
          result: {
            state: res_state.success,
          }
        });
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: '광고 정보 저장 에러',
          result: {
          }
        })
      });
    }
  })
});

module.exports = router;