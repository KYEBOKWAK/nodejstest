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

const slack = use('lib/slack');

const aws_sqs = use('lib/aws_sqs.js');

const crypto = require('crypto');

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
        is_on: data.is_on,
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

function insertPost(user_id, store_id, title, story, state, callBack = (isSuccess, fail_message = '') => {}){
  
  // let state = Types.post.none;
  // if(isSecret){
  //   state = Types.post.secret
  // }

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const postData = {
    page_id: 1,
    user_id: user_id,
    store_id: store_id,
    donation_id: null,  //생각해보니 이거 필요 없음.. 나중에 빼야지
    state: state,
    title: title,
    story: story,
    created_at: date,
    updated_at: date
  }

  db.INSERT("INSERT INTO posts SET ?", postData, 
  (result) => {
    return callBack(true, '');
  }, (error) => {
    return callBack(false,'포스트 추가 실패(1)');
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
      
      insertPost(place_user_id, result_insert.insertId, `👏 ${title}님이 플레이스를 개설하였습니다.`, '', Types.post.none, (isSuccess, fail_message) => {
        if(!isSuccess){
          return res.json({
            state: res_state.error,
            message: '플레이스 추가 에러 (최초 포스트 등록 실패)',
            result: {}
          })
        }

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


router.get('/any/detail/info', function(req, res){
  const store_id = Number(req.query.store_id);
  const store_alias = req.query.store_alias;

  const querySelect = mysql.format("SELECT store.state, store.representative_post_id, store.representative_type, store.contact, store.representative_item_id, store.user_id AS store_user_id, store.content AS store_content, user.nick_name, store.id, store.title, store.alias, store.thumb_img_url, store.user_id, profile_photo_url FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE store.id=? OR store.alias=?", [store_id, store_alias]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '플레이스 정보 조회 불가.'
      })
    }

    let data = result[0];
    if(data.representative_type === null){
      //null인 경우는 이전 데이터 이므로 item을 강제 셋팅 한다.
      data.representative_type = Types.representative.item
    }


    return res.json({
      result:{
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
});

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

router.post("/file/delete", function(req, res){
  const files_id = req.body.data.files_id;
  db.DELETE("DELETE FROM files WHERE id=?", files_id, (result) => {
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
  const querySelect = mysql.format("SELECT id FROM items WHERE store_id=? AND state<>? ORDER BY order_number ASC, id DESC LIMIT ?", [store_id, Types.item_state.SALE_STOP, 3]);

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

router.post("/file/download/list", function(req, res){
  const store_item_id = req.body.data.store_item_id;
  const file_upload_target_type = req.body.data.file_upload_target_type;

  const querySelect = mysql.format("SELECT id, url, size, originalname, file_s3_key FROM files_downloads WHERE target_id=? AND target_type=? AND state=?", [store_item_id, file_upload_target_type, Types.files_downloads.none]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/file/delete/salefile", function(req, res){
  //판매중인 상품을 삭제 요청하기. state를 바꿔서 주기체크에서 확인 후 삭제함.
  const files_download_id = req.body.data.files_download_id;
  const target_type = req.body.data.target_type;

  db.UPDATE("UPDATE files_downloads SET state=? WHERE id=?", [Types.files_downloads.delete, files_download_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })  
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '파일 삭제 실패(update state)',
      result: {}
    })  
  })
})

router.post("/manager/commision/item/info", function(req, res){
  const item_id = req.body.data.item_id;
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT value FROM item_commisions WHERE store_id=? AND item_id=?", [store_id, item_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          value: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        value: data.value
      }
    })
  })
})

router.post("/manager/commision/item/info/onlyplace", function(req, res){
  const store_id = req.body.data.store_id;

  const nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
  const querySelect = mysql.format("SELECT id, start_at, end_at FROM item_commisions WHERE store_id=? AND (start_at <= ? AND end_at > ?) OR (start_at IS NULL AND end_at IS NULL)", [store_id, nowDate, nowDate]);
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          id: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        id: data.id
      }
    })
  })
});

router.post("/manager/order/list", function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const store_id = req.body.data.store_id;

  // const sort_state = req.body.data.sort_state;
  // const sort_item_id = req.body.data.sort_item_id;

  const state_currency_code = req.body.data.state_currency_code;

  let querySelect = '';

  if(state_currency_code === null){
    querySelect = mysql.format("SELECT orders_item.discount_price, orders_item.type_commision, orders_item.price_USD, orders_item.price, orders_item.total_price_USD, orders_item.currency_code, orders_item.updated_at, orders_item.confirm_at, orders_item.name, orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state < ? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_ERROR_START, limit, skip]);
  }else{
    querySelect = mysql.format("SELECT orders_item.discount_price, orders_item.type_commision, orders_item.price_USD, orders_item.price, orders_item.total_price_USD, orders_item.currency_code, orders_item.updated_at, orders_item.confirm_at, orders_item.name, orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.currency_code=? AND orders_item.state < ? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, state_currency_code, Types.order.ORDER_STATE_ERROR_START, limit, skip]);
  }
  

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

function sendKakaoAddAsk(user_id, item_id, ask_title, ask_date, contents, store_id, type) {
  if(process.env.APP_TYPE === 'local'){
    return;
  }

  db.SELECT("SELECT name, nick_name, email, contact FROM users WHERE id=?", [user_id], (result_user) => {
    if(!result_user || result_user.length === 0){
      return;
    }

    const user_data = result_user[0];
    let ask_name = user_data.nick_name;
    if(!ask_name || ask_name === ''){
      ask_name = user_data.name;
    }
    
    db.SELECT("SELECT item.title AS item_name, store.contact, store.title AS store_title FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id WHERE item.id=?", [item_id], (result) => {
      if(!result || result.length === 0){
        return;
      }

      const data = result[0];

      let linkUrl = '';
      let title = '';
      if(type === Types.ask.creator){
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'Kalarm17v2',
          to: data.contact,
          creator_name: data.store_title,
          item_name: data.item_name,
          ask_title: ask_title,
          ask_name: ask_name,
          ask_date: ask_date,
          link_url: 'ctee.kr/manager/place/?top=TAB_CONTENTS_STORE&sub=TAB_CONTENTS_STORE_SUB_CONTACT_LIST'
        });

        title = '문의하기_creator';
        linkUrl = `https://ctee.kr/admin/manager/place/${store_id}`;
      }else{
        linkUrl = `http://admin.crowdticket.kr`;
        title = '문의하기_admin';
      }
      
      slack.webhook({
        channel: "#bot-문의하기",
        username: "bot",
        text: `[${title}]\n플레이스명: ${data.store_title}\n상품명: ${data.item_name}\n문의자: ${ask_name}\n이메일: ${user_data.email}\n연락처: ${user_data.contact}\n제목: ${ask_title}\n내용: ${contents}\n관리페이지: ${linkUrl}`
      }, function(err, response) {
        // console.log(err);
      });
    })
  })
}

router.post("/ask/add", function(req, res){
  const user_id = req.body.data.user_id;
  const item_id = req.body.data.item_id;
  const store_id = req.body.data.store_id;
  const title = req.body.data.title;
  const contents = req.body.data.contents;
  const type = req.body.data.type;
  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let language_code = req.body.data.language_code;
  if(!language_code) {
    language_code = Types.language.kr
  }

  let askData = {
    user_id: user_id,
    item_id: item_id,
    store_id: store_id,
    title: title,
    contents: contents,
    created_at: date,
    type: type,
    language_code: language_code
  }

  db.INSERT("INSERT INTO asks SET ?", [askData], (result) => {

    sendKakaoAddAsk(user_id, item_id, title, date, contents, store_id, type);

    return res.json({
      result: {
        state: res_state.success,
        ask_id: result.insertId
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '문의하기 insert 실패',
      result: {}
    })
  })
})

router.post('/ask/get/my', function(req, res){
  let user_id = req.body.data.user_id;
  const _user_id = req.body.data._user_id;
  if(_user_id){
    user_id = _user_id;
  }

  let limit = req.body.data.limit;
  let skip = req.body.data.skip;
  
  const querySelect = mysql.format("SELECT id AS ask_id FROM asks WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?", [user_id, limit, skip]);
  
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/ask/info', function(req, res){
  const ask_id = req.body.data.ask_id;

  db.SELECT("SELECT item_id, store_id, title, contents, created_at FROM asks WHERE id=?", [ask_id], (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '문의하기 정보 조회 에러',
        result: {}
      })
    }

    const data = result[0];
    return res.json({
      result:{
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
});

router.post('/ask/files/list', function(req, res){
  const ask_id = req.body.data.ask_id;
  db.SELECT("SELECT id, url, originalname FROM files WHERE target_id=? AND target_type=?", [ask_id, Types.file_upload_target_type.ask_file], (result) => {
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

router.post('/ask/list', function(req, res){
  const store_id = req.body.data.store_id;
  const item_id = req.body.data.item_id;
  const filter_ask_answer = req.body.data.filter_ask_answer;

  let limit = req.body.data.limit;
  let skip = req.body.data.skip

  let filter_ask_answer_query = '';
  if(filter_ask_answer === Types.filter_ask_answer.all){
    filter_ask_answer_query = '';
  }else if(filter_ask_answer === Types.filter_ask_answer.wait){
    filter_ask_answer_query = 'AND ask_answer.id IS NULL';
  }else if(filter_ask_answer === Types.filter_ask_answer.answer_complite){
    filter_ask_answer_query = 'AND ask_answer.id IS NOT NULL';
  }

  let querySelect = '';
  if(item_id === null){
    querySelect = mysql.format(`SELECT ask.language_code, ask.id, ask.item_id, ask.store_id, ask.user_id, ask.title, ask.contents, ask.created_at FROM asks AS ask LEFT JOIN ask_answers AS ask_answer ON ask.id=ask_answer.ask_id WHERE ask.store_id=? AND ask.type=? ${filter_ask_answer_query} ORDER BY ask.id DESC LIMIT ? OFFSET ?`, [store_id, Types.ask.creator, limit, skip]);
  }else{
    querySelect = mysql.format(`SELECT ask.language_code, ask.id, ask.item_id, ask.store_id, ask.user_id, ask.title, ask.contents, ask.created_at FROM asks AS ask LEFT JOIN ask_answers AS ask_answer ON ask.id=ask_answer.ask_id WHERE ask.store_id=? AND ask.type=? AND ask.item_id=? ${filter_ask_answer_query} ORDER BY ask.id DESC LIMIT ? OFFSET ?`, [store_id, Types.ask.creator, item_id, limit, skip]);
  }

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/ask/answer/get', function(req, res){
  const ask_id = req.body.data.ask_id;

  db.SELECT("SELECT id, store_id, user_id, contents, created_at FROM ask_answers WHERE ask_id=?", [ask_id], (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
});

router.post("/ask/answer/update", function(req, res){
  const answer_id = req.body.data.answer_id;
  const contents = req.body.data.contents;

  const data = {
    contents: contents
  }

  db.UPDATE("UPDATE ask_answers SET ? WHERE id=?", [data, answer_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '문의 답변 업데이트 실패',
      result: {}
    })
  })
});

router.post("/ask/answer/delete", function(req, res){
  const answer_id = req.body.data.answer_id;

  db.DELETE("DELETE FROM ask_answers WHERE id=?", answer_id, 
  (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '문의하기 답변 삭제 실패',
      result:{}
    })
  })
})

function sendAlarmAddAnswer(user_id, store_title, item_title, ask_title, ask_date, ask_contents, answer_contents, ask_language_code, store_id, type) {
  if(process.env.APP_TYPE === 'local'){
    return;
  }

  db.SELECT("SELECT name, nick_name, contact, email FROM users WHERE id=?", [user_id], (result_user) => {
    if(!result_user || result_user.length === 0){
      return;
    }

    const user_data = result_user[0];
    let ask_name = user_data.nick_name;
    if(!ask_name || ask_name === ''){
      ask_name = user_data.name;
    }

    Global_Func.sendKakaoAlimTalk({
      templateCode: 'Kalarm18v1',
      to: user_data.contact,
      ask_name: ask_name,
      place_name: store_title,
      item_name: item_title,
      ask_title: ask_title,
      ask_date: ask_date,
      link_url: `ctee.kr/users/store/${user_id}/orders?menu=MENU_ASK_LIST`
    })

    let slack_title = '';
    let slack_link_url = '';
    if(type === Types.ask.creator) {
      slack_title = '답변_creator';
      slack_link_url = `https://ctee.kr/admin/manager/place/${store_id}`;
    }else{
      slack_title = '답변_admin';
      slack_link_url = `http://admin.crowdticket.kr`;
    }

    slack.webhook({
      channel: "#bot-문의하기",
      username: "bot",
      text: `[${slack_title}]\n플레이스명: ${store_title}\n상품명: ${item_title}\n문의자: ${ask_name}\n제목: ${ask_title}\n내용: ${ask_contents}\n답변: ${answer_contents}\n관리페이지: ${slack_link_url}`
    }, function(err, response) {
      console.log(err);
    });

    const mailMSG = {
      to: user_data.email,
      from: Templite_email.from(ask_language_code),
      subject: Templite_email.email_add_answer_requested.subject(ask_language_code),
      html: Templite_email.email_add_answer_requested.html(user_id, ask_name, item_title, store_title, ask_title, ask_date, ask_contents, answer_contents, ask_language_code)
    }
    sgMail.send(mailMSG).then((result) => {
        // console.log(result);
    }).catch((error) => {
        // console.log(error);
    })
  })
}

router.post("/ask/answer/add", function(req, res){
  const store_user_id = req.body.data.store_user_id;
  const ask_id = req.body.data.ask_id;
  const store_id = req.body.data.store_id;
  const contents = req.body.data.contents;
  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
  
  const ask_user_id = req.body.data.ask_user_id;
  const item_title = req.body.data.item_title;
  const store_title = req.body.data.store_title;
  const ask_title = req.body.data.ask_title;
  const ask_date = req.body.data.ask_created_at;
  const ask_contents = req.body.data.ask_contents;
  const ask_language_code = req.body.data.ask_language_code;

  let askData = {
    ask_id: ask_id,
    store_id: store_id,
    user_id: store_user_id,
    contents: contents,
    created_at: date
  }

  db.INSERT("INSERT INTO ask_answers SET ?", [askData], (result) => {
    sendAlarmAddAnswer(ask_user_id, store_title, item_title, ask_title, ask_date, ask_contents, contents, ask_language_code, store_id, Types.ask.creator);

    return res.json({
      result: {
        state: res_state.success,
        answer_id: result.insertId
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '문의하기 insert 실패',
      result: {}
    })
  })
});

router.post("/any/ask/answer/add/alarm", function(req, res){
  const ask_user_id = req.body.data.ask_user_id;
  const store_title = req.body.data.store_title;
  const item_title = req.body.data.item_title;
  const ask_title = req.body.data.ask_title;
  const ask_date = moment_timezone(req.body.data.ask_date).format('YYYY-MM-DD HH:mm:ss');
  const ask_contents = req.body.data.ask_contents;
  const contents = req.body.data.contents;
  const ask_language_code = req.body.data.ask_language_code;
  const store_id = req.body.data.store_id;

  sendAlarmAddAnswer(ask_user_id, store_title, item_title, ask_title, ask_date, ask_contents, contents, ask_language_code, store_id, Types.ask.admin);

  return res.json({
    state: res_state.success
  })
});

router.post("/any/item/price/info", function(req, res){

  const item_id = req.body.data.item_id;

  let currency_code = req.body.data.currency_code;
  if(currency_code === undefined || currency_code === null){
    currency_code = Types.currency_code.Won;
  }

  let language_code = req.body.data.language_code;
  if(language_code === undefined || language_code === null){
    language_code = Types.language.kr;
  }

  // const querySelect = mysql.format("SELECT item.is_adult, store.contact AS store_contact, item.editor_type, item.notice_user, item.simple_contents, item.story, item.price_USD, item.currency_code, item.category_top_item_id, item.category_sub_item_id, item.completed_type_product_answer, item.type_contents, item.id AS item_id, user.name AS user_name, user.id AS store_user_id, item.youtube_url, item.notice AS item_notice, item.product_category_type, item.ask_play_time, user.profile_photo_url, item.product_state, item.file_upload_state, store.title AS store_title, item.re_set_at, item.order_limit_count, item.state, item.ask, item.store_id, item.price, item.title, item.img_url, item.content, user.nick_name FROM items AS item LEFT JOIN stores AS store ON store.id=item.store_id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.id=?", store_item_id);

  //exchange_rate의 currency_code에 대한 정보는 1달러당 한화에 대한 정보이여서 KRW로 셋팅 했는데, 추후 환율에 대한 데이터가 많아지면 나의 currency로 정보를 바로 가져올 수 있어야 한다.
  const querySelect = mysql.format("SELECT item.discount_price, item.discount_started_at, item.discount_ended_at, exchange_rate.price AS exchange_price, item.price_USD, item.currency_code, item.id AS item_id, item.price FROM items AS item LEFT JOIN exchange_rates AS exchange_rate ON exchange_rate.currency_code=? WHERE item.id=?", [Types.currency_code.Won, item_id]);

  db.SELECT(querySelect, {}, (result) => {

    if(result.length === 0){
      return res.json({
        // state: res_state.error,
        // message: 'item 정보 없음 id : ' + store_item_id,
        result: {
          state: res_state.success,
          data: null
        }
      })
    }

    let data = result[0];

    let is_discount = false;
    let final_item_price = data.price;
    let discount_price = data.discount_price;
    if(discount_price > 0){
      //할인이 있으면 할인 조건이 맞는지 확인한다.
      if(data.discount_started_at && data.discount_ended_at){
        //시작값이 있으면 할인 기간인지 확인한다.
        let nowTime = moment_timezone().format('x');
        let startTime = moment_timezone(data.discount_started_at).format('x');
        let endTime = moment_timezone(data.discount_ended_at).format('x');

        if(nowTime >= startTime &&
          nowTime <= endTime){
            is_discount = true;
          }
      }else{
        is_discount = true;
      }
    }else{
      discount_price = 0;
    }

    data.is_discount = is_discount;

    if(!is_discount) {
      discount_price = 0;
    }

    if(final_item_price < 0 || final_item_price === null || final_item_price === undefined){
      final_item_price = 0;
    }

    if(currency_code === Types.currency_code.US_Dollar){
      const item_price = data.price;
      if(item_price === 0){
        data.price_USD = Number(item_price);
        data.currency_code = currency_code;
        data.discount_price_USD = 0;
      }else {
        const exchange_price = (item_price / data.exchange_price).toFixed(2);
        const exchange_discount_price = (discount_price / data.exchange_price).toFixed(2);
        data.price_USD = Number(exchange_price);
        data.currency_code = currency_code;
        data.discount_price_USD = Number(exchange_discount_price);
      }

      final_item_price = (data.price_USD - data.discount_price_USD).toFixed(2);
      final_item_price = Number(final_item_price);
    }else{
      final_item_price = data.price - discount_price;
    }

    data.language_code = language_code;
    data.final_item_price = final_item_price;

    return res.json({
      result:{
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })

  /*
  const item_id = req.body.data.item_id;
  const nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  db.SELECT("SELECT price, price_USD, currency_code, discount_price, discount_started_at, discount_ended_at FROM items WHERE id=? AND ((discount_price IS NOT NULL AND discount_started_at IS NULL AND discount_ended_at IS NULL) OR (discount_price IS NOT NULL AND discount_started_at <= ? AND discount_ended_at >= ?))", [item_id, nowDate, nowDate], (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }
    console.log(result);

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
  */
})

router.post('/any/item/discount/time/duration', function(req, res){
  const item_id = req.body.data.item_id;
  
  let nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  db.SELECT("SELECT discount_price, discount_started_at, discount_ended_at FROM items WHERE id=? AND discount_price IS NOT NULL AND discount_started_at <= ? AND discount_ended_at >= ? AND discount_started_at IS NOT NULL AND discount_ended_at IS NOT NULL", [item_id, nowDate, nowDate], (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }
    
    const data = result[0];

    nowDate = moment_timezone();
    const moment_ended_at = moment_timezone(data.discount_ended_at);

    // const duration_moment = moment_timezone.duration(nowDate.diff(moment_ended_at));
    const duration_moment = moment_timezone.duration(moment_ended_at.diff(nowDate));
    const duration_days = Math.floor(duration_moment.asDays());
    const duration_hours = Math.floor(duration_moment.asHours());
    const duration_min = Math.floor(duration_moment.asMinutes());

    return res.json({
      result: {
        state: res_state.success,
        data: {
          duration_days: duration_days,
          duration_hours: duration_hours,
          duration_min: duration_min
        }
      }
    })
  })
});

router.post("/file/customized/info", function(req, res){
  const file_id = req.body.data.file_id;

  db.SELECT("SELECT mimetype, is_delete, expired_at, originalname, file_s3_key, url FROM files WHERE id=?", [file_id], (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
})

router.post("/file/completed/info", function(req, res){
  const file_download_id = req.body.data.file_download_id;

  db.SELECT("SELECT size, originalname, file_s3_key, url FROM files_downloads WHERE id=?", [file_download_id], (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
})

router.get("/any/item/list/all", function(req, res){
  
  const store_id = Number(req.query.store_id);
  let querySelect = mysql.format("SELECT store.title AS store_title, item.id, item.title, item.img_url FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id WHERE item.store_id=? AND item.state<>? ORDER BY item.order_number ASC, item.id DESC", [store_id, Types.item_state.SALE_STOP]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

function decrypt(text) {
  try {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return null
  }

  /*
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  console.log(decipher);
  let decrypted = decipher.update(encryptedText);
  console.log(decrypted);
  console.log('-------');
  const test = decipher.final();
  console.log(test);
  return '';
  // decrypted = Buffer.concat([decrypted, decipher.final()]);
 
  // return decrypted.toString();
  */
}

router.post("/any/email/post/token/verify", function(req, res){
   // Must be 256 bits (32 characters)
   const toke = req.body.data.token;
   
   const decrypt_data = decrypt(toke);
   if(!decrypt_data){
     return res.json({
       state: res_state.error,
       message: '유효하지 않는 정보 입니다.(Invalid information.)'
     })
   }

   const decrypt_data_json = JSON.parse(decrypt_data);
   return res.json({
     result: {
       state: res_state.success,
       data: decrypt_data_json
     }
   })
})

router.get("/any/subscribe/place/count", function(req, res){
  const store_id = Number(req.query.store_id);

  db.SELECT("SELECT COUNT(id) AS subscribe_total_count FROM user_subscribes WHERE store_id=? AND is_subscribe=?", [store_id, true], (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          subscribe_total_count: 0
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        subscribe_total_count: data.subscribe_total_count
      }
    })
  })
})

router.get("/any/subscribe/user/list", function(req, res){
  const user_id = Number(req.query.user_id);

  db.SELECT("SELECT id, store_id, is_subscribe FROM user_subscribes WHERE user_id=? AND is_subscribe=?", [user_id, true], (result) => {
    if(!result){
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

router.get("/any/subscribe/info", function(req, res){
  const store_id = Number(req.query.store_id);
  const user_id = Number(req.query._user_id);
  if(user_id === 0){
    return res.json({
      state: res_state.error,
      message: '유저 정보 에러',
      result: {}
    })
  }

  db.SELECT("SELECT id, is_subscribe, is_popup_order FROM user_subscribes WHERE store_id=? AND user_id=?", [store_id, user_id], (result) => {
    if(!result){
      return res.json({
        state: res_state.error,
        message: '구독 정보 조회 에러',
        result: {}
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  });
})

router.post("/subscribe/ispopup", function(req, res){
  const store_id = req.body.data.store_id;
  const user_id = req.body.data.user_id;
  const is_show_popup_in_order = req.body.data.is_show_popup_in_order;

  const updateData = {
    is_popup_order: is_show_popup_in_order
  }

  //값이 있는데, is_subscribe값이 false면 true로 업데이트 해준다.
  db.UPDATE("UPDATE user_subscribes SET ? WHERE store_id=? AND user_id=?", [updateData, store_id, user_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '구독 팝업 업데이트 실패',
      result: {}
    })
  })
});

router.post("/any/subscribe/subscribe", function(req, res){
  const store_id = req.body.data.store_id;
  const user_id = req.body.data._user_id;
  const is_show_popup_in_order = req.body.data.is_show_popup_in_order;
  const is_subscribe = req.body.data.is_subscribe;
  if(user_id === 0){
    return res.json({
      state: res_state.error,
      message: '유저 정보 에러',
      result: {}
    })
  }

  db.SELECT("SELECT id, is_subscribe FROM user_subscribes WHERE store_id=? AND user_id=?", [store_id, user_id], (result) => {
    if(!result){
      return res.json({
        state: res_state.error,
        message: '구독 정보 조회 에러',
        result: {}
      })
    }

    let nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    if(result.length > 0){
      const data = result[0];
      if(data.is_subscribe){
        return res.json({
          state: res_state.error,
          message: '이미 구독을 했습니다.',
          result: {}
        })
      }

      let updateData = {
        is_subscribe: true,
        updated_at: nowDate
      }

      if(is_show_popup_in_order !== undefined){
        updateData = {
          ...updateData,
          is_popup_order: is_show_popup_in_order
        }
      }

      if(is_subscribe !== undefined){
        updateData = {
          ...updateData,
          is_subscribe: is_subscribe
        }
      }

      //값이 있는데, is_subscribe값이 false면 true로 업데이트 해준다.
      db.UPDATE("UPDATE user_subscribes SET ? WHERE store_id=? AND user_id=?", [updateData, store_id, user_id], 
      (result) => {
        return res.json({
          result: {
            state: res_state.success,
          }
        })
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: '구독 업데이트 실패',
          result: {}
        })
      })
    }else{

      let insertData = {
        store_id: store_id,
        user_id: user_id,
        is_subscribe: true,
        is_popup_order: false,
        created_at: nowDate,
        updated_at: nowDate
      }

      if(is_show_popup_in_order !== undefined){
        insertData = {
          ...insertData,
          is_popup_order: is_show_popup_in_order
        }
      }

      if(is_subscribe !== undefined){
        insertData = {
          ...insertData,
          is_subscribe: is_subscribe
        }
      }

      db.INSERT("INSERT INTO user_subscribes SET ?", insertData, (result_insert) => {
        return res.json({
          result: {
            state: res_state.success,
          }
        })
      }, (error_insert) => {
        return res.json({
          state: res_state.error,
          message: '구독 추가 실패',
          result: {}
        })
      })
    }
  });
})

router.post("/any/subscribe/unsubscribe", function(req, res){
  const store_id = req.body.data.store_id;
  const user_id = req.body.data._user_id;

  let nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const updateData = {
    is_subscribe: false,
    updated_at: nowDate
  }

  //값이 있는데, is_subscribe값이 false면 true로 업데이트 해준다.
  db.UPDATE("UPDATE user_subscribes SET ? WHERE store_id=? AND user_id=?", [updateData, store_id, user_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '구독 업데이트 실패',
      result: {}
    })
  })
})

router.post("/any/subscribe/auto/set", function(req, res){
  //섭스크라이브 테스트를 위한 자동 셋팅. 리얼에는 안들어감.
  if(process.env.APP_TYPE === 'real' ||
  process.env.APP_TYPE === 'qa'){
    return res.json({
      test: '리얼임.'
    })
  }
  db.SELECT("SELECT id FROM stores", [], (result_stores) => {
    let nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    // console.log(result_stores);


    let promise_list = [];
    

    for(let i = 0 ; i < result_stores.length ; i++){
      const storeData = result_stores[i];
      const store_id = storeData.id;

      const promise = new Promise((resolve, reject) => {
        db.SELECT("SELECT user_id FROM orders_items WHERE store_id=? AND state=? GROUP BY user_id", [store_id, 16], (result_orders) => {

          let promise2_list = [];
          for(let j = 0 ; j < result_orders.length ; j++){
            const orderData = result_orders[j];
            const user_id = orderData.user_id;

            const promise2 = new Promise((resolve2, reject2) => {
              // db.SELECT("SELECT user_id FROM user_subscribes")
              db.SELECT("SELECT id FROM user_subscribes WHERE store_id=? AND user_id=?", [store_id, user_id], (result_select_subscribes) => {
                if(result_select_subscribes.length === 0){

                  const user_subscribes_data = {
                    store_id: store_id,
                    user_id: user_id,
                    is_subscribe: true,
                    is_popup_order: false,
                    created_at: nowDate,
                    updated_at: nowDate
                  }

                  db.INSERT("INSERT INTO user_subscribes SET ?", user_subscribes_data, (result_insert) => {
                    console.log('>>>>>>>>>>>>')
                    console.log(`store id: ${store_id} user id: ${user_id}`);
                    // console.log(result_orders);;
                    console.log('<<<<<<<<<<<<')
                    resolve2();
                  }, (error_insert) => {
                    console.log(error_insert);
                    reject2();
                  })
                }else{
                  console.log('중복 ID: ' + user_id);
                  resolve2();
                }
              })
            });

            promise2_list.push(promise2);             
          }
          
          Promise.all(promise2_list).then((values) => {
            // console.log(values);
            resolve();
          });
        })
        
      });

      promise_list.push(promise)
    }
    
    Promise.all(promise_list).then((values) => {
      // console.log(values);
      console.log("!?!?!?");
      return res.json({
        test: 'aaa'
      })
    });
    
  })
})

module.exports = router;