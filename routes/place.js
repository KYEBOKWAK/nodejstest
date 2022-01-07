var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

// const moment = require('moment');

var mysql = require('mysql');
// const Util = use('lib/util.js');

// const global = use('lib/global_const.js');
// const axios = require('axios');

const Templite_email = use('lib/templite_email');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//slack
var Slack = require('slack-node');
 
webhookUri = process.env.CROWDTICKET_SLACK_WEBHOOK_URI;
 
slack = new Slack();
slack.setWebhook(webhookUri);
////////////

/*
var aws = require('aws-sdk');
var s3 = new aws.S3({ 
  accessKeyId: process.env.AWS_S3_KEY,
  secretAccessKey: process.env.AWS_S3_SECRET,
  region: process.env.AWS_S3_REGION,
});
*/

const Global_Func = use("lib/global_func.js");

router.post('/create', function(req, res){
  const place_user_id = req.body.data.place_user_id;

  const selectQuery = mysql.format('SELECT id FROM stores WHERE user_id=?', place_user_id);

  db.SELECT(selectQuery, {}, (result_select) => {
    if(result_select.length > 0){
      return res.json({
        state: res_state.error,
        message: '이미 개설된 플레이스가 있습니다.',
        result: {}
      })
    }

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    const state = Types.store.STATE_APPROVED;
    const tier = Types.tier_store.enter;
    const title = req.body.data.name;
    const email = req.body.data.email;
    const contact = req.body.data.contact;
    const alias = req.body.data.alias;
    const collect_join_path = req.body.data.collect_join_path;
    const collect_channel = req.body.data.collect_channel;
    const collect_category = req.body.data.collect_category;

    let channel_url = req.body.data.channel_url;
    if(channel_url === undefined){
      channel_url = '이전버전에서 신청함';
    }

    const created_at = date;
    const updated_at = date;

    const placeData = {
      user_id: place_user_id,
      state: state,
      tier: tier,
      title: title,
      email: email,
      contact: contact,
      alias: alias,
      account_name: '',
      account_number: '',
      account_bank: '',
      collect_join_path: collect_join_path,
      collect_channel: collect_channel,
      collect_category: collect_category,
      created_at: created_at,
      updated_at: updated_at
    }

    db.INSERT("INSERT INTO stores SET ?", placeData, 
    (result_insert) => {

      slack.webhook({
        channel: "#bot-플레이스신청",
        username: "신청bot",
        text: `[플레이스신청]\n플레이스명: ${title}\n이메일: ${email}\n연락처: ${contact}\n가입경로: ${collect_join_path}\n활동채널: ${collect_channel}\n채널주소: ${channel_url}\n카테고리: ${collect_category}\nalias: https://ctee.kr/place/${alias}`
      }, function(err, response) {
        console.log(err);
      });

      const mailMSG = {
        to: email,
        from: '크티<contact@ctee.kr>',
        subject: Templite_email.email_join_place.subject,
        html: Templite_email.email_join_place.html(title)
      }
      sgMail.send(mailMSG).then((result) => {
          // console.log(result);
      }).catch((error) => {
          // console.log(error);
      })

      Global_Func.sendKakaoAlimTalk({
        templateCode: 'Kalarm15v1',
        to: contact
      })

      return res.json({
        result: {
          state: res_state.success,
          store_id: result_insert.insertId
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '플레이스 추가 에러',
        result: {}
      })
    });
  });
});

router.post('/any/item/isadult', function(req, res){
  const item_id = req.body.data.item_id;
  const selectQuery = mysql.format('SELECT item.is_adult, item.store_id, store.alias FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id WHERE item.id=?', item_id);

  db.SELECT(selectQuery, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '상품 ID 조회 오류(is_adult)'
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        is_adult: data.is_adult,
        store_id: data.store_id,
        store_alias: data.alias
      }
    })
  })
});

/*
router.post('/file/size/s3', function(req, res){

  s3.headObject({Key: 'banner/img-innerpiece-tarot@2x.png',
  Bucket: process.env.AWS_S3_BUCKET}, (err, metadata) => {
    // console.log('check' + files_downloads_id + '/' + file_s3_key);
    if (err && err.code === 'NotFound') {  
      // Handle no object on cloud here
      // console.log(err);
      
      return res.json({
        result: {
          state: res_state.success,
          size: 0
        }
      });
    } else {
      // console.log(metadata.ContentLength);
      return res.json({
        result: {
          state: res_state.success,
          size: metadata.ContentLength
        }
      });
    }
  });
})
*/


module.exports = router;