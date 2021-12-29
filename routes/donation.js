var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const Util = use('lib/util.js');

var mysql = require('mysql');

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

//slack
var Slack = require('slack-node');
 
webhookUri = process.env.CROWDTICKET_SLACK_WEBHOOK_URI;
 
slack = new Slack();
slack.setWebhook(webhookUri);
////////////

const DEFAULT_DONATION_PRICE = 3000;
const PAY_SERIALIZER_ONETIME = "onetime";

router.post('/pay/isp', function(req, res){
  const store_id = req.body.data.store_id;
  const user_id = req.body.data.user_id;

  const name = req.body.data.name;
  const contact = req.body.data.contact;
  const email = req.body.data.email;

  const count = req.body.data.count;
  const total_price = count * DEFAULT_DONATION_PRICE;

  const merchant_uid = req.body.data.merchant_uid;
  const pay_method = req.body.data.pay_method;

  const currency_code = req.body.data.currency_code;

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

  const insertDonationData = {
    store_id: store_id,
    user_id: user_id,
    item_id: null,
    orders_item_id: null,
    state: Types.order.ORDER_STATE_APP_STORE_STANBY,
    count: count,
    price: DEFAULT_DONATION_PRICE,
    total_price: total_price,
    price_USD: 0,
    total_price_USD: 0,
    name: name,
    contact: contact,
    email: email,
    currency_code: currency_code,
    merchant_uid: merchant_uid,
    pay_method: pay_method,
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
      message: '도네이션 추가 에러'
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
          created_at: date,
          updated_at: date,
          confirm_at: date
        }

        db.INSERT("INSERT INTO orders_donations SET ?", insertDonationData, (result_insert_orders_donations) => {
          const donation_order_id = result_insert_orders_donations.insertId;
      
          slack.webhook({
            channel: "#결제알림",
            username: "알림bot",
            text: `(후원)\n플레이스: ${_data.title}\n후원: ${_data.total_price}\n주문자명: ${_data.name}`
          }, function(err, response) {
            console.log(err);
          });

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

  const querySelect = mysql.format("SELECT SUM(count) AS total_count FROM orders_donations WHERE user_id=? AND state=?", [user_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION]);

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

  const querySelect = mysql.format("SELECT SUM(total_price) AS total_price FROM orders_donations WHERE user_id=? AND state=?", [user_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          total_price: 0
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        total_price: data.total_price
      }
    })
  })
});

router.post('/my/bestcreator', function(req, res){
  const user_id = req.body.data.user_id;

  const querySelect = mysql.format("SELECT MAX(id) AS id, store_id, user_id, SUM(total_price) AS total_price FROM orders_donations WHERE user_id=? AND state=? GROUP BY store_id ORDER BY total_price DESC, id DESC LIMIT ?", [user_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, 1]);

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
  
  const querySelect = mysql.format("SELECT orders_donation.id, orders_donation.state, orders_donation.created_at, orders_donation.count, store.user_id AS place_user_id, store.title FROM orders_donations AS orders_donation LEFT JOIN stores AS store ON orders_donation.store_id=store.id WHERE orders_donation.user_id=? AND (orders_donation.state=? OR orders_donation.state=? OR orders_donation.state=?) ORDER BY orders_donation.id DESC LIMIT ? OFFSET ?", [user_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, Types.order.ORDER_STATE_CANCEL, Types.order.ORDER_STATE_APP_STORE_PAYMENT, limit, skip]);
  
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

  const querySelect = mysql.format("SELECT SUM(total_price) AS total_price FROM orders_donations WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          total_price: 0
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        total_price: data.total_price
      }
    })
  })
});

router.post("/manager/list", function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const store_id = req.body.data.store_id;

  let querySelect = mysql.format("SELECT id, count, total_price, created_at, name, user_id  FROM orders_donations WHERE store_id=? AND state=? ORDER BY id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION, limit, skip]);

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

cancelDonation = (orders_donation_id, successCallBack, errorCallBack) => {
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
          
          this.cancelDonation(donation_order_id, 
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

  const selectQuery = mysql.format("SELECT store.user_id AS place_user_id, store.title AS place_title, orders_donation.pay_method, orders_donation.contact, orders_donation.item_id, orders_donation.orders_item_id, orders_donation.item_id,  orders_donation.state, orders_donation.count, orders_donation.email, orders_donation.total_price, orders_donation.created_at FROM orders_donations AS orders_donation LEFT JOIN stores AS store ON orders_donation.store_id=store.id WHERE orders_donation.id=? AND orders_donation.user_id=?", [donation_order_id, user_id]);

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

module.exports = router;