var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
var Types_Sort = use('lib/Types_Sort.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const Commision = use('lib/Commision.js');

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


function setPlaceCategory(store_id, select_category_datas, callback) {
  if(select_category_datas === undefined || select_category_datas.length === 0){
    return callback();
  }

  let _insertQueryArray = [];
  let _insertOptionArray = [];

  for(let i = 0 ; i < select_category_datas.length ; i++){
    const data = select_category_datas[i];
    let queryObject = {
      key: i,
      value: "INSERT INTO select_category_places SET ?;"
    }

    let insertObject = {
      key: i,
      value: {
        store_id: store_id,
        categories_place_id: data.id
      }
    }

    _insertQueryArray.push(queryObject);
    _insertOptionArray.push(insertObject);
  }

  db.INSERT_MULITPLEX(_insertQueryArray, _insertOptionArray, (result) => {
    return callback();
  }, (error) => {
    return callback();
  })
}

function createOnOffData(store_id, callback) {
  let _insertQueryArray = [];
  let _insertOptionArray = [];

  for(let i = 0 ; i < Types.default_onoff_datas.length ; i++){
    const data = Types.default_onoff_datas[i];
    let queryObject = {
      key: i,
      value: "INSERT INTO onoffs SET ?;"
    }

    let insertObject = {
      key: i,
      value: {
        store_id: store_id,
        type: data.type,
        is_on: false,
        order_number: data.order_number
      }
    }

    _insertQueryArray.push(queryObject);
    _insertOptionArray.push(insertObject);
  }

  db.INSERT_MULITPLEX(_insertQueryArray, _insertOptionArray, (result) => {
    return callback();
  }, (error) => {
    return callback();
  })
}

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

    let select_category_datas = req.body.data.select_category_data;
    if(select_category_datas === undefined){
      select_category_datas = [];
    }
    // const collect_category = req.body.data.collect_category;

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
      collect_category: null,
      created_at: created_at,
      updated_at: updated_at
    }

    db.INSERT("INSERT INTO stores SET ?", placeData, 
    (result_insert) => {
      
      createOnOffData(result_insert.insertId, () => {
        setPlaceCategory(result_insert.insertId, select_category_datas, () => {
          let collect_category = [];
          for(let i = 0 ; i < select_category_datas.length ; i++){
            const _data = select_category_datas[i];
            collect_category.push(_data.text);
          }
  
          if(process.env.APP_TYPE !== 'local'){
            slack.webhook({
              channel: "#bot-플레이스신청",
              username: "신청bot",
              text: `[플레이스신청]\n플레이스명: ${title}\n이메일: ${email}\n연락처: ${contact}\n가입경로: ${collect_join_path}\n활동채널: ${collect_channel}\n채널주소: ${channel_url}\n카테고리: ${collect_category.toString()}\nalias: https://ctee.kr/place/${alias}`
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
          }
    
          return res.json({
            result: {
              state: res_state.success,
              store_id: result_insert.insertId
            }
          })
        })
      });
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

router.post('/manager/commision/info', function(req, res){
  const store_id = req.body.data.store_id;

  // const default_commision = Commision.Default + Commision.Default_PG;
  if(!store_id){
    return res.json({
      state: res_state.error,
      message: '플레이스 ID 조회 오류 (commision info)',
      result: {}
    });
  }

  let commisionData = {
    default: Commision.Default,
    default_pg: Commision.Default_PG,
    default_promotion_value: null,
    promotion_start_at: null,
    promotion_end_at: null
  }

  const querySelect = mysql.format("SELECT value, start_at, end_at FROM commisions WHERE store_id=?", [store_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      console.log('조회된 값이 없음');
      // return callback(default_commision);
      return res.json({
        result: {
          state: res_state.success,
          ...commisionData
        }
      })
    }

    const data = result[0];
    if(data.start_at === null && data.end_at === null){
      commisionData = {
        ...commisionData,
        default_promotion_value: data.value,
        promotion_start_at: null,
        promotion_end_at: null
      }

      return res.json({
        result: {
          state: res_state.success,
          ...commisionData
        }
      })
    }
    
    const now_at_x = moment_timezone().format('x');
    const start_at_x = moment_timezone(data.start_at).format('x');
    const end_at_x = moment_timezone(data.end_at).format('x');

    if(start_at_x <= now_at_x &&
      now_at_x <= end_at_x ){
      commisionData = {
        ...commisionData,
        default_promotion_value: data.value,
        promotion_start_at: moment_timezone(data.start_at).format('YY.MM.DD'),
        promotion_end_at: moment_timezone(data.end_at).format('YY.MM.DD')
      }
    }else{
      commisionData = {
        ...commisionData,
        default_promotion_value: null,
        promotion_start_at: null,
        promotion_end_at: null
      }
    }

    return res.json({
      result: {
        state: res_state.success,
        ...commisionData
      }
    })
  })
})

router.get('/any/fanevent/list', function(req, res){
  const store_user_id = Number(req.query.store_user_id);
  const sort_type = Number(req.query.sort_type);
  // console.log(store_user_id);

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let selectQuery = '';
  if(sort_type === Types_Sort.place_event.all){
    selectQuery = mysql.format("SELECT id, project_type, poster_url, poster_renew_url FROM projects WHERE user_id=? AND state=? AND funding_closing_at IS NOT NULL ORDER BY funding_closing_at DESC", [store_user_id, Types.project.STATE_APPROVED]);
  }else if(sort_type === Types_Sort.place_event.playing){
    selectQuery = mysql.format("SELECT id, project_type, poster_url, poster_renew_url FROM projects WHERE user_id=? AND state=? AND funding_closing_at >= ? ORDER BY funding_closing_at DESC", [store_user_id, Types.project.STATE_APPROVED, date]);
  }else{
    selectQuery = mysql.format("SELECT id, project_type, poster_url, poster_renew_url FROM projects WHERE user_id=? AND state=? AND funding_closing_at < ? ORDER BY funding_closing_at DESC", [store_user_id, Types.project.STATE_APPROVED, date]);
  }

  db.SELECT(selectQuery, {}, 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.get('/any/fanevent/count', function(req, res){
  const store_user_id = Number(req.query.store_user_id);

  const selectQuery = mysql.format("SELECT COUNT(id) AS project_count FROM projects WHERE user_id=? AND state=? AND funding_closing_at IS NOT NULL", [store_user_id, Types.project.STATE_APPROVED]);

  db.SELECT(selectQuery, {}, 
  (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          count: 0
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        count: result[0].project_count
      }
    })
  })
})

router.get('/any/title/rand', function(req, res){
  const querySelect = mysql.format("SELECT title FROM stores WHERE state=? ORDER BY RAND() LIMIT 1", [Types.store.STATE_APPROVED]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          store_title: ''
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        store_title: data.title
      }
    })
  })
})

router.post("/file/download/delete", function(req, res){
  const files_downloads_id = req.body.data.files_downloads_id;
  db.DELETE("DELETE FROM files WHERE id=?", files_downloads_id, (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '이미지 DB 삭제 실패',
      result:{}
    })
  })
});

router.post("/file/business/get", function(req, res){
  const target_id = req.body.data.target_id;

  const querySelect = mysql.format("SELECT id, originalname, target_type FROM files WHERE target_id=? AND (target_type=? OR target_type=?)", [target_id, Types.file_upload_target_type.business_card, Types.file_upload_target_type.business_bank_copy]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/any/onoff/list", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT store_id, type, is_on, order_number FROM onoffs WHERE store_id=? ORDER BY order_number", store_id);
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          list: []
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/onoff/set", function(req, res){
  const store_id = req.body.data.store_id;
  const type = req.body.data.type;
  const is_on = req.body.data.is_on;
  const order_number = req.body.data.order_number;

  let onoffData = {
    store_id: store_id,
    type: type,
    is_on: is_on,
    order_number: order_number
  }

  const querySelect = mysql.format("SELECT id FROM onoffs WHERE store_id=? AND type=?", [store_id, type])

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      //값이 없으면 insert
      db.INSERT("INSERT INTO onoffs SET ?", [onoffData], (result) => {
        return res.json({
          result: {
            state: res_state.success
          }
        })
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: 'on off insert 실패',
          result: {}
        })
      })
    }else{
      //값이 있으면 update
      db.UPDATE("UPDATE onoffs SET ? WHERE store_id=? AND type=?", [onoffData, store_id, type], (result) => {
        return res.json({
          result: {
            state: res_state.success
          }
        })
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: 'on off update 실패',
          result: {}
        })
      })
    }
  })
})

router.post('/any/onoff/get', function(req, res){
  const store_id = req.body.data.store_id;
  const type = req.body.data.type;

  const querySelect = mysql.format("SELECT id, is_on FROM onoffs WHERE store_id=? AND type=?", [store_id, type]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      //값이 없으면 기본으로 on 이다.
      return res.json({
        state: res_state.success,
        result: {
          is_on: true
        }
      })
    }
    
    const data = result[0];
    return res.json({
      state: res_state.success,
      result: {
        is_on: data.is_on
      }
    })
  })

});

router.post("/any/home/item/list", function(req, res){
  const store_id = req.body.data.store_id;
//order_number
  const querySelect = mysql.format("SELECT id FROM items WHERE store_id=? AND state<>? ORDER BY order_number LIMIT ?", [store_id, Types.item_state.SALE_STOP, 3]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/any/home/fanevent/list", function(req, res){
  // const store_id = req.body.data.store_id;
  const store_user_id = req.body.data.store_user_id;
//order_number
  const querySelect = mysql.format("SELECT id, project_type, poster_url, poster_renew_url FROM projects WHERE user_id=? AND state=? AND funding_closing_at IS NOT NULL ORDER BY funding_closing_at DESC LIMIT ?", [store_user_id, Types.project.STATE_APPROVED, 3]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/bg/get', function(req, res){
  const store_id = req.body.data.store_id;
  const store_alias = req.body.data.store_alias;

  const querySelect = mysql.format("SELECT thumb_img_url FROM stores WHERE id=? OR alias=?", [store_id, store_alias]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '상점 정보 조회 불가'
      })
    }

    let data = result[0];

    return res.json({
      result:{
        state: res_state.success,
        thumb_img_url: data.thumb_img_url
      }
    })
  })
})

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