var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const Util = use('lib/util.js');
const Global_Func = use("lib/global_func.js");

var mysql = require('mysql');

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

//slack
var Slack = require('slack-node');
 
webhookUri = process.env.CROWDTICKET_SLACK_WEBHOOK_URI;
 
let slack = new Slack();
slack.setWebhook(webhookUri);
////////////

const DEFAULT_DONATION_PRICE = 3000;
const DEFAULT_DONATION_PRICE_USD = 3;
const PAY_SERIALIZER_ONETIME = "onetime";

function setDonationMessages(req, res, callback, callbackError) {
  const isSecret = req.body.data.isSecret;
  const comment_text = req.body.data.comment_text;

  if(comment_text === undefined || comment_text === null || comment_text === ''){
    return callback(null);
  }

  const store_id = req.body.data.store_id;
  const user_id = req.body.data.user_id;

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const insertDonationMessageData = {
    store_id: store_id,
    user_id: user_id,
    answer_comment_id: null,
    is_secret: isSecret,
    text: comment_text,
    created_at: date
  }

  db.INSERT("INSERT INTO donation_comments SET ?", insertDonationMessageData, (result_insert_donation_message) => {
    const donation_message_id = result_insert_donation_message.insertId;
    return callback(donation_message_id);
  }, (error) => {
    return callbackError();
  })
}

router.post('/pay/isp', function(req, res){
  const store_id = req.body.data.store_id;
  const user_id = req.body.data.user_id;

  const name = req.body.data.name;
  const contact = req.body.data.contact;
  const email = req.body.data.email;

  const count = req.body.data.count;
  const total_price = req.body.data.total_price;
  const total_price_usd = req.body.data.total_price_usd;

  const merchant_uid = req.body.data.merchant_uid;
  const pay_method = req.body.data.pay_method;

  const currency_code = req.body.data.currency_code;
  let pg = req.body.data.pg;

  let post_id = req.body.data.post_id;
  if(post_id === undefined || post_id === null){
    post_id = null;
  }

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  if(store_id === undefined || store_id === null || store_id === ''){
    return res.json({
      state: res_state.error,
      message: 'store id error (donation pay)',
      result: {}
    })
  }

  if(user_id === undefined || user_id === null || user_id === '' || user_id === 0){
    return res.json({
      state: res_state.error,
      message: 'user id error (donation pay)',
      result: {}
    })
  }

  if(pg === undefined || pg === null){
    pg = null;
  }

  setDonationMessages(req, res, 
  (donation_comment_id) => {
    const insertDonationData = {
      store_id: store_id,
      user_id: user_id,
      item_id: null,
      orders_item_id: null,
      state: Types.order.ORDER_STATE_APP_STORE_STANBY,
      count: count,
      price: DEFAULT_DONATION_PRICE,
      total_price: total_price,
      price_USD: DEFAULT_DONATION_PRICE_USD,
      total_price_USD: total_price_usd,
      name: name,
      contact: contact,
      email: email,
      currency_code: currency_code,
      merchant_uid: merchant_uid,
      pay_method: pay_method,
      pg: pg,

      donation_comment_id: donation_comment_id,
      is_heart: false,

      post_id: post_id,
      // imp_uid: imp_uid,
  
      created_at: date,
      updated_at: date,
      confirm_at: date
    }
  
    db.INSERT("INSERT INTO orders_donations SET ?", insertDonationData, (result_insert_orders_donations) => {
      const donation_order_id = result_insert_orders_donations.insertId;
  
      return res.json({
        result:{
            state: res_state.success,
            order_id: donation_order_id
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '도네이션 추가 에러',
        result: {}
      })
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '도네이션 메세지 추가 에러',
      result: {}
    })
  })
});


router.post('/pay/onetime', function(req, res){
  const _data = req.body.data;
  const user_id = req.body.data.user_id;

  const store_id = req.body.data.store_id;

  const name = req.body.data.name;
  const contact = req.body.data.contact;
  const email = req.body.data.email;

  const count = req.body.data.count;
  const total_price = count * DEFAULT_DONATION_PRICE;

  const merchant_uid = req.body.data.merchant_uid;
  const pay_method = req.body.data.pay_method;

  const currency_code = req.body.data.currency_code;

  const customer_uid = Util.getPayNewCustom_uid(user_id);

  const store_title = req.body.data.store_title;
  const store_contact = req.body.data.store_contact;

  let post_id = req.body.data.post_id;
  if(post_id === undefined || post_id === null){
    post_id = null;
  }

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  if(store_id === undefined || store_id === null || store_id === ''){
    return res.json({
      state: res_state.error,
      message: 'store id error (donation pay)',
      result: {}
    })
  }

  if(user_id === undefined || user_id === null || user_id === '' || user_id === 0){
    return res.json({
      state: res_state.error,
      message: 'user id error (donation pay)',
      result: {}
    })
  }

  const paymentData = {
    store_id: _data.store_id,
    card_number: _data.card_number,
    expiry: Util.getCardExpire(_data.card_yy, _data.card_mm),
    amount: _data.total_price, //onetime total_price는 order_id의 db 조회해서 total_price와 비교한다.
    merchant_uid: merchant_uid,
    birth: _data.card_birth,
    customer_uid: customer_uid,
    pwd_2digit: _data.card_pw_2digit,
    name: _data.title,
    buyer_name: _data.name,
    buyer_email: _data.email,
    buyer_tel: _data.contact
  };

  iamport.subscribe.onetime({
    ...paymentData
  }).then((result) => {
      // To do
      // console.log(result);
      //status: 'paid',
      if(result.status === 'paid'){
          //결제 성공
          // if(process.env.APP_TYPE !== 'local'){
          //   senderOrderCompleteAlarm(item_id, user_id, email, item_order_id, store_id, item_title, total_price, name, date, requestContent);
          // }

          // req.body.data.pay_method = result.pay_method;

        setDonationMessages(req, res, 
        (donation_comment_id) => {
          const serializer_uid = PAY_SERIALIZER_ONETIME

          let _imp_meta = {
            serializer_uid: serializer_uid,
            merchant_uid: result.merchant_uid,
            customer_uid: customer_uid
          };

          _imp_meta = JSON.stringify(_imp_meta);

          const insertDonationData = {
            store_id: store_id,
            user_id: user_id,
            item_id: null,
            orders_item_id: null,
            state: Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION,
            count: count,
            price: DEFAULT_DONATION_PRICE,
            total_price: total_price,
            price_USD: 0,
            total_price_USD: 0,
            name: name,
            contact: contact,
            email: email,
            currency_code: currency_code,
            merchant_uid: result.merchant_uid,
            pay_method: pay_method,
            imp_uid: result.imp_uid,
            serializer_uid: serializer_uid,
            imp_meta: _imp_meta,
            donation_comment_id: donation_comment_id,
            is_heart: false,
            post_id: post_id,

            created_at: date,
            updated_at: date,
            confirm_at: date
          }

          db.INSERT("INSERT INTO orders_donations SET ?", insertDonationData, (result_insert_orders_donations) => {
            const donation_order_id = result_insert_orders_donations.insertId;
            
            if(process.env.APP_TYPE !== 'local'){
              slack.webhook({
                channel: "#결제알림",
                username: "알림bot",
                text: `(후원)\n플레이스: ${store_title}\n한화: ${_data.total_price}원\n달러: $${0}\n주문자명: ${_data.name}`
              }, function(err, response) {
                console.log(err);
              });

              Global_Func.sendKakaoAlimTalk({
                templateCode: 'Kalarm16v1',
                to: store_contact,
                donation_user_name: name,
                creator_name: store_title,
                coffee_count: count,
                place_manager_url: 'ctee.kr/manager/place'
              })
            }

            return res.json({
              result:{
                  state: res_state.success,
                  order_id: donation_order_id
              }
            })
          }, (error) => {
            return res.json({
              state: res_state.error,
              message: '도네이션 추가 에러'
            })
          })
        }, (error) => {
          return res.json({
            state: res_state.error,
            message: '도네이션 메시지 추가 에러'
          })
        })  
      }else{
        // console.log("success");
        return res.json({
            state: res_state.error,
            message: result.fail_reason,
        });
      }
      // console.log(result);
  }).catch((error) => {
      return res.json({
        state: res_state.error,
        message: error.message,
      })
  });
  
})

router.post('/total/count', function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT SUM(count) AS total_count FROM orders_donations WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION]);

  db.SELECT(querySelect, {}, (result) => {
    const data = result[0];

    let total_count = data.total_count;
    if(total_count === null){
      total_count = 0;
    }
    return res.json({
      result: {
        state: res_state.success,
        total_count: total_count
      }
    })
  })
})

router.post('/any/total/count', function(req, res){
  const store_id = req.body.data.store_id;

  const select_currency_code = req.body.data.select_currency_code

  let querySelect = '';
  if(select_currency_code === undefined || select_currency_code === null){
    querySelect = mysql.format("SELECT SUM(count) AS total_count FROM orders_donations WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION]);
  }
  else {
    querySelect = mysql.format("SELECT SUM(count) AS total_count FROM orders_donations WHERE store_id=? AND state=? AND currency_code=?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, select_currency_code]);
  }
  
  db.SELECT(querySelect, {}, (result) => {
    const data = result[0];

    let total_count = data.total_count;
    if(total_count === null){
      total_count = 0;
    }
    return res.json({
      result: {
        state: res_state.success,
        total_count: total_count
      }
    })
  })
})

router.post('/any/list/rank', function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT MAX(id) AS id, user_id, SUM(count) AS count, name FROM orders_donations WHERE store_id=? AND state=? GROUP BY user_id ORDER BY count DESC, id DESC LIMIT ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, 5]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
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

router.post('/my/total/count', function(req, res){
  const user_id = req.body.data.user_id;
  const currency_code = req.body.data.currency_code;

  const querySelect = mysql.format("SELECT SUM(count) AS total_count FROM orders_donations WHERE user_id=? AND state=? AND currency_code=?", [user_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, currency_code]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          total_count: 0
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        total_count: data.total_count
      }
    })
  })
});

router.post('/my/total/price', function(req, res){
  const user_id = req.body.data.user_id;
  const currency_code = req.body.data.currency_code;

  const querySelect = mysql.format("SELECT SUM(total_price) AS total_price, SUM(total_price_USD) AS total_price_USD FROM orders_donations WHERE user_id=? AND state=? AND currency_code=?", [user_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, currency_code]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          total_price: 0,
          total_price_usd: 0
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        total_price: data.total_price,
        total_price_usd: data.total_price_USD
      }
    })
  })
});

router.post('/my/bestcreator', function(req, res){
  const user_id = req.body.data.user_id;
  const currency_code = req.body.data.currency_code;

  const querySelect = mysql.format("SELECT MAX(id) AS id, store_id, user_id, SUM(total_price) AS total_price FROM orders_donations WHERE user_id=? AND state=? AND currency_code=? GROUP BY store_id ORDER BY total_price DESC, id DESC LIMIT ?", [user_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, currency_code, 1]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: {
            place_id: 0
          }
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          place_id: data.store_id
        }
      }
    })
  })
});

router.post('/my/list/get', function(req, res){
  const user_id = req.body.data.user_id;

  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const currency_code = req.body.data.currency_code;
  
  const querySelect = mysql.format("SELECT orders_donation.post_id, donation_comment.answer_comment_id, orders_donation.user_id, orders_donation.is_heart, donation_comment.text, donation_comment.is_secret, orders_donation.donation_comment_id, orders_donation.id, orders_donation.state, orders_donation.created_at, orders_donation.count, store.user_id AS place_user_id, store.title FROM orders_donations AS orders_donation LEFT JOIN stores AS store ON orders_donation.store_id=store.id LEFT JOIN donation_comments AS donation_comment ON orders_donation.donation_comment_id=donation_comment.id WHERE orders_donation.user_id=? AND orders_donation.currency_code=? AND (orders_donation.state=? OR orders_donation.state=? OR orders_donation.state=?) ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [user_id, currency_code, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, Types.order.ORDER_STATE_CANCEL, Types.order.ORDER_STATE_APP_STORE_PAYMENT, limit, skip]);

  // const querySelect = mysql.format("SELECT orders_donation.id, orders_donation.state, orders_donation.created_at, orders_donation.count, store.user_id AS place_user_id, store.title FROM orders_donations AS orders_donation LEFT JOIN stores AS store ON orders_donation.store_id=store.id WHERE orders_donation.user_id=? AND orders_donation.currency_code=? AND (orders_donation.state=? OR orders_donation.state=? OR orders_donation.state=?) ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [user_id, currency_code, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, Types.order.ORDER_STATE_CANCEL, Types.order.ORDER_STATE_APP_STORE_PAYMENT, limit, skip]);
  
  db.SELECT(querySelect, {}, (result) => {
    // if(result.length === 0){
    //   return res.json({
    //     state: res_state.error,
    //     message: '주문 정보 조회 오류',
    //     result:{}
    //   })
    // }

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      const created_at = moment_timezone(data.created_at).format('YYYY.MM.DD');

      result[i].created_at = created_at;
    }

    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/total/price', function(req, res){
  const store_id = req.body.data.store_id;

  const select_currency_code = req.body.data.select_currency_code;

  let querySelect = '';
  if(select_currency_code === undefined || select_currency_code === null){
    querySelect = mysql.format("SELECT SUM(total_price) AS total_price FROM orders_donations WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION]);
  }else{
    querySelect = mysql.format("SELECT SUM(total_price) AS total_price, SUM(total_price_USD) AS total_price_usd FROM orders_donations WHERE store_id=? AND state=? AND currency_code=?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, select_currency_code]);
  }

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          total_price: 0,
          total_price_usd: 0
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        total_price: data.total_price,
        total_price_usd: data.total_price_usd
      }
    })
  })
});

router.post("/manager/list", function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const store_id = req.body.data.store_id;
  const select_currency_code = req.body.data.select_currency_code;

  let querySelect = ''
  if(select_currency_code === undefined || select_currency_code === null){
    querySelect = mysql.format("SELECT currency_code, total_price_USD, id, count, total_price, created_at, name, user_id  FROM orders_donations WHERE store_id=? AND state=? ORDER BY id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, limit, skip]);
  }else{
    querySelect = mysql.format("SELECT currency_code, total_price_USD, id, count, total_price, created_at, name, user_id  FROM orders_donations WHERE store_id=? AND state=? AND currency_code=? ORDER BY id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, select_currency_code,limit, skip]);
  }

  

  db.SELECT(querySelect, {}, (result) => {

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];
      const created_at = moment_timezone(data.created_at).format('YYYY-MM-DD');
      result[i].created_at = created_at;
    }

    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

function cancelDonation (orders_donation_id, successCallBack, errorCallBack) {
  if(orders_donation_id === undefined || orders_donation_id === null){
    return successCallBack();
  }

  db.UPDATE("UPDATE orders_donations SET state=? WHERE id=?", [Types.order.ORDER_STATE_CANCEL, orders_donation_id], 
  (result) => {
      return successCallBack();
  }, (error) => {
      return errorCallBack();
  })
}

router.post("/cancel", function(req, res){
  const donation_order_id = req.body.data.donation_order_id;
  const user_id = req.body.data.user_id;
  // const order_user_id = req.body.data.order_user_id;
  
  const querySelect = mysql.format("SELECT id, total_price_USD, currency_code, merchant_uid, user_id, total_price, state, orders_item_id, created_at FROM orders_donations WHERE id=? AND user_id=?", [donation_order_id, user_id]);

  // const querySelect = mysql.format("SELECT merchant_uid, user_id, total_price FROM orders AS _order WHERE _order.id=?", [order_id]);
  db.SELECT(querySelect, {}, (result_select_order) => {
    if(result_select_order.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보가 없습니다.',
        result:{}
      })
    }

    const orderData = result_select_order[0];

    if(orderData.orders_item_id !== null){
      return res.json({
        state: res_state.error,
        message: '상품을 같이 주문한 후원 입니다. 나의 콘텐츠 주문에서 취소 해주세요.',
        result:{}
      })
    }

    const nowDateMoment = moment_timezone();
    const nowDateMiliSec = nowDateMoment.format("x");

    const expireDay = moment_timezone(orderData.created_at).format("YYYY-MM-DD 23:59:59");
    const expireMoment = moment_timezone(expireDay).add(DONATION_CANCEL_OVER_TIME_DAYS, 'days')
    const expireTimeMiliSecond = expireMoment.format('x');

    if(nowDateMiliSec > expireTimeMiliSecond){
      return res.json({
        state: res_state.error,
        message: '7일이 지난 후원 입니다. 취소가 불가능 합니다.',
        result:{}
      })
    }


    let merchant_uid = orderData.merchant_uid;
    let amount = orderData.total_price;

    if(orderData.currency_code === Types.currency_code.US_Dollar){
      amount = orderData.total_price_USD;
    }

    if(amount > 0){
      if(orderData.serializer_uid && orderData.serializer_uid === 'scheduled'){
        
      }else{
        iamport.payment.cancel({
          merchant_uid: merchant_uid,
          amount: amount
        }).then(function(result_iamport){
          
          cancelDonation(donation_order_id, 
          (success) => {
            return  res.json({
              result:{
                state: res_state.success
              }
            })
          }, (error) => {
            return res.json({
              state: res_state.error,
              message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다. (후원 취소 실패)',
              result:{}
            })
          });
          
        }).catch(function(error){
          return res.json({
            state: res_state.error,
            message: error.message,
            result:{}
          })
        })
      }
    }else{
      return res.json({
        state: res_state.error,
        message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다.(금액 오류)',
        result:{}
      })
    }
  })
  
})

router.post('/is/mydonation', function(req, res){
  const user_id = req.body.data.user_id;
  const orders_donation_id = req.body.data.orders_donation_id;
  if(user_id === undefined || user_id === null || user_id <= 0) {
    return res.json({
      state: res_state.error,
      message: '유저 정보가 없습니다. 로그인 후 이용 바랍니다.'
    })
  }

  const selectQuery = mysql.format("SELECT user_id FROM orders_donations WHERE id=?", [orders_donation_id])
  db.SELECT(selectQuery, {}, (result) => {
    if(result.length === 0) {
      return res.json({
        state: res_state.error,
        message: '후원 정보가 없습니다.',
        result: {}
      })
    }

    const data = result[0];
    if(data.user_id !== user_id){
      return res.json({
        state: res_state.error,
        message: '후원 내역 조회 에러',
        result: {}
      })
    }else {
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }

  })
})

const DONATION_CANCEL_OVER_TIME_DAYS = 7;
router.post('/info', function(req, res){
  const donation_order_id = req.body.data.donation_order_id;
  const user_id = req.body.data.user_id;
  if(user_id === undefined || user_id === null || user_id <= 0) {
    return res.json({
      state: res_state.error,
      message: '유저 정보가 없습니다. 로그인 후 이용 바랍니다.'
    })
  }

  const selectQuery = mysql.format("SELECT orders_donation.currency_code, orders_donation.pg, orders_donation.total_price_USD, store.user_id AS place_user_id, store.title AS place_title, orders_donation.pay_method, orders_donation.contact, orders_donation.item_id, orders_donation.orders_item_id, orders_donation.item_id,  orders_donation.state, orders_donation.count, orders_donation.email, orders_donation.total_price, orders_donation.created_at FROM orders_donations AS orders_donation LEFT JOIN stores AS store ON orders_donation.store_id=store.id WHERE orders_donation.id=? AND orders_donation.user_id=?", [donation_order_id, user_id]);

  db.SELECT(selectQuery, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '후원 정보 조회 에러',
        result: {}
      })
    }

    const data = result[0];
    let created_at = moment_timezone(data.created_at).format('YYYY.MM.DD');

    //날짜 강제 셋팅
    const nowDateMoment = moment_timezone();
    const nowDateMiliSec = nowDateMoment.format("x");

    const expireDay = moment_timezone(data.created_at).format("YYYY-MM-DD 23:59:59");
    const expireMoment = moment_timezone(expireDay).add(DONATION_CANCEL_OVER_TIME_DAYS, 'days')
    const expireTimeMiliSecond = expireMoment.format('x');

    let isCancelOver = false;
    if(nowDateMiliSec > expireTimeMiliSecond){
      isCancelOver = true;
    }

    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data,
          created_at: created_at,
          isCancelOver: isCancelOver
        }
      }
    })
  });
})

router.post('/any/list/get/thumb', function(req, res){

  const store_id = req.body.data.store_id;
  const user_id = req.body.data.user_id;

  let limit = req.body.data.limit;
  let skip = req.body.data.skip;
  
  const querySelect = mysql.format("SELECT donation_comment.answer_comment_id, orders_donation.is_hide, orders_donation.created_at, orders_donation.id AS donation_id, donation_comment.is_secret, donation_comment.text, user.name, user.nick_name, orders_donation.user_id, orders_donation.donation_comment_id, orders_donation.count, orders_donation.is_heart FROM orders_donations AS orders_donation LEFT JOIN users AS user ON orders_donation.user_id=user.id LEFT JOIN donation_comments AS donation_comment ON donation_comment.id=orders_donation.donation_comment_id WHERE orders_donation.store_id=? AND orders_donation.state=? AND orders_donation.is_hide=? ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, false,limit, skip]);
  
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/list/get/thumb/last', function(req, res){
  const store_id = req.body.data.store_id;
  const user_id = req.body.data.user_id;

  let limit = req.body.data.limit;
  let skip = req.body.data.skip;
  
  const querySelect = mysql.format("SELECT orders_donation.id AS donation_id, donation_comment.is_secret, donation_comment.text, user.name, user.nick_name, orders_donation.user_id, orders_donation.donation_comment_id, orders_donation.count, orders_donation.is_heart FROM orders_donations AS orders_donation LEFT JOIN users AS user ON orders_donation.user_id=user.id LEFT JOIN donation_comments AS donation_comment ON donation_comment.id=orders_donation.donation_comment_id WHERE orders_donation.store_id=? AND orders_donation.state=? AND orders_donation.is_hide=? ORDER BY orders_donation.id ASC LIMIT 1", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, false]);
  
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result:{
          state: res_state.success,
          donation_id: null
        }
      })
    }
    
    const data = result[0];
    return res.json({
      result:{
        state: res_state.success,
        donation_id: data.donation_id
      }
    })
  })
});

router.post('/my/donation/answer/get', function(req, res){
  const answer_comment_id = req.body.data.answer_comment_id;

  const querySelect = mysql.format("SELECT store.title AS store_title, donation_comment.user_id, donation_comment.text FROM donation_comments AS donation_comment LEFT JOIN stores AS store ON donation_comment.store_id=store.id WHERE donation_comment.id=?", [answer_comment_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '도네이션 답 ID값이 없음.',
        result: {}
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

router.post('/manager/list/get', function(req, res){
  //후원 관리 리스트
  const sort_type = req.body.data.sort_type;
  const store_id = req.body.data.store_id;

  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  let selectQuery = '';
  if(sort_type === 'SELECT_DONATION_ONLY'){
    selectQuery = mysql.format("SELECT orders_donation.id, orders_donation.user_id, orders_donation.donation_comment_id, orders_donation.count, donation_comment.answer_comment_id, donation_comment.text, orders_donation.is_heart, donation_comment.is_secret FROM orders_donations AS orders_donation LEFT JOIN donation_comments AS donation_comment ON orders_donation.donation_comment_id=donation_comment.id WHERE orders_donation.store_id=? AND orders_donation.state=? AND orders_donation.donation_comment_id IS NULL ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, limit, skip]);

  }else if(sort_type === 'SELECT_DONATION_MESSAGE'){
    selectQuery = mysql.format("SELECT orders_donation.id, orders_donation.user_id, orders_donation.donation_comment_id, orders_donation.count, donation_comment.answer_comment_id, donation_comment.text, orders_donation.is_heart, donation_comment.is_secret FROM orders_donations AS orders_donation LEFT JOIN donation_comments AS donation_comment ON orders_donation.donation_comment_id=donation_comment.id WHERE orders_donation.store_id=? AND orders_donation.state=? AND orders_donation.donation_comment_id IS NOT NULL ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, limit, skip]);
  }else{
    selectQuery = mysql.format("SELECT orders_donation.id, orders_donation.user_id, orders_donation.donation_comment_id, orders_donation.count, donation_comment.answer_comment_id, donation_comment.text, orders_donation.is_heart, donation_comment.is_secret FROM orders_donations AS orders_donation LEFT JOIN donation_comments AS donation_comment ON orders_donation.donation_comment_id=donation_comment.id WHERE orders_donation.store_id=? AND orders_donation.state=? ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, limit, skip]);
  }


  // const selectQuery = mysql.format("SELECT orders_donation.id, orders_donation.user_id, orders_donation.donation_comment_id, orders_donation.count, donation_comment.answer_comment_id, donation_comment.text, orders_donation.is_heart, donation_comment.is_secret FROM orders_donations AS orders_donation LEFT JOIN donation_comments AS donation_comment ON orders_donation.donation_comment_id=donation_comment.id WHERE orders_donation.store_id=? AND orders_donation.state=? ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, limit, skip]);

  db.SELECT(selectQuery, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })  
})

router.post('/manager/heart/get', function(req, res){
  const donation_id = req.body.data.donation_id;

  const selectQuery = mysql.format("SELECT is_heart FROM orders_donations WHERE id=?", [donation_id])
  db.SELECT(selectQuery, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          is_heart: false
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        is_heart: data.is_heart
      }
    })
  })
})

router.post('/manager/heart/set', function(req, res){
  const donation_id = req.body.data.donation_id;
  const is_heart = req.body.data.is_heart;

  const data = {
    is_heart: is_heart
  }

  db.UPDATE("UPDATE orders_donations SET ? WHERE id=?", [data, donation_id], (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '도네이션 하트 업데이트 오류',
      result: {}
    })
  })
})

router.post('/manager/answer/get', function(req, res){
  const answer_comment_id = req.body.data.answer_comment_id;

  const selectQuery = mysql.format("SELECT text FROM donation_comments WHERE id=?", [answer_comment_id])
  db.SELECT(selectQuery, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          text: ''
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        text: data.text
      }
    })
  })
})

router.post('/manager/answer/set', function(req, res){
  const donation_comment_id = req.body.data.donation_comment_id;
  const text = req.body.data.text;
  const store_user_id = req.body.data.store_user_id;
  const store_id = req.body.data.store_id;

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const insertMessageAnswer = {
    user_id: store_user_id,
    store_id: store_id,
    answer_comment_id: null,
    is_secret: true,
    text: text,
    created_at: date
  };

  db.INSERT("INSERT INTO donation_comments SET ?", [insertMessageAnswer], 
  (result_insert_donation_comment) => {
    const answer_comment_id = result_insert_donation_comment.insertId;
    const updateMessageData = {
      answer_comment_id: answer_comment_id
    }

    db.UPDATE("UPDATE donation_comments SET ? WHERE id=?", [updateMessageData, donation_comment_id], 
    (result_update) => {
      return res.json({
        result: {
          state: res_state.success,
          answer_comment_id: answer_comment_id
        }
      })
    }, (error_update) => {
      return res.json({
        state: res_state.error,
        message: '도네이션 메시지 업데이트 에러',
        result: {}
      })
    })
  }, (error_insert_donation_comment) => {
    return res.json({
      state: res_state.error,
      message: '도네이션 메시지 추가 에러',
      result: {}
    })
  })
})

router.post('/hide/set', function(req, res){
  const donation_id = req.body.data.donation_id;
  const is_hide = req.body.data.is_hide;

  const orders_donation_data = {
    is_hide: is_hide
  }

  db.UPDATE("UPDATE orders_donations SET ? WHERE id=?", [orders_donation_data, donation_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '후원 숨기기 에러',
      result: {}
    })
  })
})

module.exports = router;