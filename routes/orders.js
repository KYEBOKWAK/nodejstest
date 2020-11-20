var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const moment = require('moment');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');
const Util = use('lib/util.js');

const global = use('lib/global_const.js');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const Templite_email = use('lib/templite_email');
const Global_Func = use("lib/global_func.js");

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

const CANCELLATION_FEES_RATE = 0.1;

router.post("/list", function(req, res){
  const user_id = req.body.data.user_id;

  const skip = req.body.data.skip;
  const TAKE = 3;

  //orders_goods
  // let queryOrderList = mysql.format("SELECT _order.id AS order_id, project.title, ticket.show_date, _order.created_at, poster_renew_url, poster_url, _order.total_price, _order.state, _order.deleted_at, _order.project_id, _order.ticket_id, _order.supporter_id FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.user_id=? ORDER BY _order.id DESC LIMIT ? OFFSET ?", [user_id, TAKE, skip]);

  let queryOrderList = mysql.format("SELECT order_goods.id AS order_goods_id, _order.id AS order_id, project.title, ticket.show_date, _order.created_at, poster_renew_url, poster_url, _order.total_price, _order.state, _order.deleted_at, _order.project_id, _order.ticket_id, _order.supporter_id FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id LEFT JOIN orders_goods AS order_goods ON order_goods.order_id=_order.id WHERE _order.user_id=? GROUP BY _order.id ORDER BY _order.id DESC LIMIT ? OFFSET ?", [user_id, TAKE, skip]);

  db.SELECT(queryOrderList, {}, function(result){
    return res.json({
      result:{
        state: res_state.success,
        orderList: result
      }
    })
  })
});

router.post("/state/project", function(req, res){
  // const project_id = req.body.data.project_id;
  // const ticket_id = req.body.data.ticket_id;
  const order_id = req.body.data.order_id;

  let queryOrder = mysql.format("SELECT state, deleted_at FROM orders AS _order WHERE _order.id=?", order_id);
  db.SELECT(queryOrder, {}, function(result_order){
    if(result_order.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보 없음',
        result: {
        }
      })
    }

    const order = result_order[0];
    if(order.deleted_at !== null){
      return res.json({
        result: {
          state: res_state.success,
          eventState: "취소"
        }
      })
    }

    let eventState = "참여";
    if(order.state >= types.order.ORDER_STATE_CANCEL_START && order.state <= types.order.ORDER_STATE_CANCEL)
    {
        //100~199
        //취소란
        eventState = "취소";

        if(order.state === types.order.ORDER_STATE_PROJECT_CANCEL){
          eventState = "실패";
        }
        else if(order.state === types.order.ORDER_STATE_PROJECT_PICK_CANCEL){
          eventState = "미당첨";
        }

        
    }
    else if(order.state >= types.order.ORDER_STATE_STAY && order.state <= types.order.ORDER_STATE_PAY_END)
    {
      //성공란 1~99
      eventState = "참여";
    }
    else if(order.state >= types.order.ORDER_STATE_ERROR_START && order.state <= types.order.ORDER_STATE_ERROR_END)
    {
      eventState = "에러";
    }

    
    return res.json({
      result: {
        state: res_state.success,
        eventState: eventState
      }
    })

  });
});

router.post("/state/pay", function(req, res){
  const order_id = req.body.data.order_id;
  
  let queryOrder = mysql.format("SELECT project.funding_closing_at, project.type, project.event_type,  project.pick_state, _order.state, _order.deleted_at, _order.created_at FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id WHERE _order.id=?", order_id);
  db.SELECT(queryOrder, {}, function(result_order){
    if(result_order.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보 없음',
        result: {
        }
      })
    }

    const order = result_order[0];
    
    if(order.deleted_at !== null){
      return res.json({
        result: {
          state: res_state.success,
          eventState: "취소"
        }
      })
    }

    let payState = getStateStringAttribute(order.state, order.pick_state, order.deleted_at, order.event_type, order.type, order.funding_closing_at);
    /*
    if(order.state >= types.order.ORDER_STATE_CANCEL_START && order.state <= types.order.ORDER_STATE_CANCEL)
    {
        //100~199
        //취소란
        payState = "결제취소";

        if(order.state === types.order.ORDER_STATE_PROJECT_CANCEL){
          payState = "목표 도달 실패";
        }else if(order.state === types.order.ORDER_STATE_PROJECT_PICK_CANCEL){
          payState = "미당첨";
        }

        
    }
    else if(order.state <= types.order.ORDER_STATE_PAY_END && order.state >= types.order.ORDER_STATE_STAY)
    {
      //성공란 1~99
      payState = "결제완료";

      if(order.state === types.order.ORDER_STATE_PAY_SCHEDULE){
        payState = "결제예약";
      }else if(order.state === types.order.ORDER_STATE_APP_PAY_WAIT){
        payState = "결제대기"
      }
    }
    else if(order.state >= types.order.ORDER_STATE_ERROR_START && order.state <= types.order.ORDER_STATE_ERROR_END)
    {
      payState = "결제에러";
    }
    */

    let wait_sec = 0;
    if(order.state === types.order.ORDER_STATE_APP_PAY_WAIT){
      wait_sec = Util.getWaitTimeSec(order.created_at);
    }

    
    return res.json({
      result: {
        state: res_state.success,
        payState: payState,
        payStateType: order.state,
        wait_sec: wait_sec
      }
    })

  });
});


router.post("/receipt/detail", function(req, res){
  // const user_id = req.body.data.user_id;
  const order_id = req.body.data.order_id;
  
  // let orderQuery = mysql.format("SELECT ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id, discount_id, goods_meta, _order.supporter_id, supporter.price AS supporter_price, type_commision, pay_method, _order.name, _order.email, _order.contact FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id LEFT JOIN supporters AS supporter ON supporter.id=_order.supporter_id WHERE _order.id=?", order_id);

  let orderQuery = mysql.format("SELECT ticket.category, categories_ticket.title AS categories_ticket_title, ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id, discount_id, goods_meta, _order.supporter_id, supporter.price AS supporter_price, type_commision, pay_method, _order.name, _order.email, _order.contact FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id LEFT JOIN supporters AS supporter ON supporter.id=_order.supporter_id LEFT JOIN categories_tickets AS categories_ticket ON categories_ticket.id=ticket.category WHERE _order.id=?", order_id);

  db.SELECT(orderQuery, [], (result_order) => {
    // console.log(result_order);
    if(result_order === undefined || result_order.length === 0){
      return res.json({
        state: res_state.none,
        result: {
        }
      })
    }

    const orderData = result_order[0];

    //goods 구매 정보도 가져온다.
    let goodsQuery = mysql.format("SELECT ticket_discount, count, _goods.price, goods_id, _goods.title FROM orders_goods AS _orders_goods LEFT JOIN goods AS _goods ON _orders_goods.goods_id=_goods.id WHERE _orders_goods.order_id=?;", orderData.id);
    // let discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE project_id=?;", orderData.project_id);
    let discountsQuery = "";
    if(orderData.discount_id !== null){
      // discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE discount_id=?;", orderData.discount_id);
      discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE id=?;", orderData.discount_id);
    }

    let goods_discounts_query = goodsQuery+discountsQuery;
    db.SELECT_MULITPLEX(goods_discounts_query, (result_goods_discounts) => {
      
      const GOODS_INDEX = 0;
      const DISCOUNT_INDEX = 1;
      let goodsDatas = [];
      let discountsDatas = [];

      // return;
      if(orderData.goods_meta !== "{}" && orderData.discount_id === null){
        //굿즈 데이터만 있을때
        goodsDatas = result_goods_discounts.concat();
      }else if(orderData.goods_meta === "{}" && orderData.discount_id !== null){
        discountsDatas = result_goods_discounts.concat();
      }else if(orderData.goods_meta !== "{}" && orderData.discount_id !== null){
        goodsDatas = result_goods_discounts[0];
        discountsDatas = result_goods_discounts[1];
      }

      // if(orderData.discount_id !== null){
      //   goodsDatas = result_goods_discounts[GOODS_INDEX];
      //   discountsDatas = result_goods_discounts[DISCOUNT_INDEX];
      // }

      /*
      const GOODS_INDEX = 0;
      const DISCOUNT_INDEX = 1;
      const goodsDatas = result_goods_discounts[GOODS_INDEX];
      const discountsDatas = result_goods_discounts[DISCOUNT_INDEX];
      */

      let select_tickets = [];
      let select_goods = [];

      let _total_ticket_price = 0;
      let _total_goods_discount_ticket= 0;
      let _total_goods_price= 0;

      let _total_support_price = 0;
      //티켓정보가 없으면 
      if(orderData.ticket_id !== null){
        const ticketObject = {
          id: orderData.ticket_id,
          count: orderData.count,
          show_date: orderData.show_date,
          price: orderData.ticket_price,
          category: orderData.category,
          categories_ticket_title: orderData.categories_ticket_title
        }

        select_tickets.push(ticketObject);

        _total_ticket_price = Number(orderData.ticket_price) * Number(orderData.count);
      }

      for(let i = 0 ; i < goodsDatas.length ; i++){
        const goodsObject = goodsDatas[i];
        const selectGoodsObject = {
          id: goodsObject.goods_id,
          count: goodsObject.count,
          title: goodsObject.title,
          discount_ticket_price: goodsObject.ticket_discount
        };
        select_goods.push(selectGoodsObject);

        _total_goods_price += Number(goodsObject.price) * Number(goodsObject.count);
        _total_goods_discount_ticket += Number(goodsObject.ticket_discount) * Number(goodsObject.count);
      }

      // for(let i = 0 ; i < discountsDatas.length ; i++){
      //   const discountData = discountsDatas[i];
      //   console.log(discountData);
      // }

      if(_total_ticket_price === 0){
        //티켓 값이 0원이면 할인도 안된다.
        _total_goods_discount_ticket = 0;
      }

      //총 티켓가격에서 할인가 적용한다.
      _total_ticket_price = _total_ticket_price - _total_goods_discount_ticket;
      if(_total_ticket_price < 0){
        _total_ticket_price = 0;
      }

      //날짜 체크해서 처리하기...
      // const waitSec = Util.getWaitTimeSec(orderData.created_at);
      // if(waitSec <= 0){
      //   //0보다 작으면 값을 바꿔줘야함.
      //   db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL_WAIT_PAY, orderData.id], (result_order_update) => {
      //     return res.json({
      //       state: res_state.none,
      //       result: {
      //       }
      //     });
      //   });

      //   return;
      // }
      // console.log(Util.getWaitTimeSec(orderData.created_at));

      let waitSec = 0;
      if(orderData.order_state === types.order.ORDER_STATE_APP_PAY_WAIT){
        waitSec = Util.getWaitTimeSec(orderData.created_at);
      }

      let _supporter_price = 0;
      if(orderData.supporter_price !== null){
        _supporter_price = orderData.supporter_price;
      }

      return res.json({
        result: {
          state: res_state.success,
          
          order_id: orderData.id,
          project_id: orderData.project_id,
          total_ticket_price: _total_ticket_price,
          total_discount_price: _total_goods_discount_ticket,
          total_goods_price: _total_goods_price,

          total_price: orderData.total_price,
          merchant_uid: orderData.merchant_uid,

          select_tickets: select_tickets.concat(),
          select_goods: select_goods.concat(),

          title: orderData.title,
          poster_renew_url: orderData.poster_renew_url,
          isDelivery: orderData.isDelivery,
          pay_type: orderData.pay_type,
          supporter_price: _supporter_price,
          type_commision: orderData.type_commision,
          pay_method: orderData.pay_method,
          created_at: orderData.created_at,

          order_state: orderData.order_state,

          contact: orderData.contact,
          name: orderData.name,
          email: orderData.email,

          wait_sec: waitSec,

          discount_info: [
            ...discountsDatas
          ]
          
        }
      })
    });
  })
});

router.post("/get/wait/orderdata", function(req, res){
  // const user_id = req.body.data.user_id;
  const order_id = req.body.data.order_id;
  
  // let orderQuery = mysql.format("SELECT ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.id=?", order_id);

  let orderQuery = mysql.format("SELECT ticket.category, categories_ticket.title AS categories_ticket_title, ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id, discount_id, goods_meta, _order.supporter_id, supporter.price AS supporter_price, type_commision, pay_method, _order.name, _order.email, _order.contact FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id LEFT JOIN supporters AS supporter ON supporter.id=_order.supporter_id LEFT JOIN categories_tickets AS categories_ticket ON categories_ticket.id=ticket.category WHERE _order.id=?", order_id);

  db.SELECT(orderQuery, [], (result_order) => {
    // console.log(result_order);
    if(result_order === undefined || result_order.length === 0){
      return res.json({
        state: res_state.none,
        result: {
        }
      })
    }

    const orderData = result_order[0];

    //goods 구매 정보도 가져온다.
    let goodsQuery = mysql.format("SELECT ticket_discount, count, _goods.price, goods_id, _goods.title FROM orders_goods AS _orders_goods LEFT JOIN goods AS _goods ON _orders_goods.goods_id=_goods.id WHERE _orders_goods.order_id=?;", orderData.id);
    let discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE project_id=?;", orderData.project_id);
    let goods_discounts_query = goodsQuery+discountsQuery;
    db.SELECT_MULITPLEX(goods_discounts_query, (result_goods_discounts) => {
      // console.log(result_goods_discounts);
      const GOODS_INDEX = 0;
      const DISCOUNT_INDEX = 1;
      const goodsDatas = result_goods_discounts[GOODS_INDEX];
      const discountsDatas = result_goods_discounts[DISCOUNT_INDEX];
      // console.log(goodsDatas);

      let select_tickets = [];
      let select_goods = [];

      let _total_ticket_price = 0;
      let _total_goods_discount_ticket= 0
      let _total_goods_price= 0
      //티켓정보가 없으면 
      if(orderData.ticket_id !== null){
        const ticketObject = {
          id: orderData.ticket_id,
          count: orderData.count,
          show_date: orderData.show_date,
          price: orderData.ticket_price,
          category: orderData.category,
          categories_ticket_title: orderData.categories_ticket_title
        }

        select_tickets.push(ticketObject);

        _total_ticket_price = Number(orderData.ticket_price) * Number(orderData.count);
      }

      for(let i = 0 ; i < goodsDatas.length ; i++){
        const goodsObject = goodsDatas[i];
        const selectGoodsObject = {
          id: goodsObject.goods_id,
          count: goodsObject.count,
          title: goodsObject.title,
          discount_ticket_price: goodsObject.ticket_discount
        };
        select_goods.push(selectGoodsObject);

        _total_goods_price += Number(goodsObject.price) * Number(goodsObject.count);
        _total_goods_discount_ticket += Number(goodsObject.ticket_discount) * Number(goodsObject.count);
      }

      if(_total_ticket_price === 0){
        //티켓 값이 0원이면 할인도 안된다.
        _total_goods_discount_ticket = 0;
      }

      //총 티켓가격에서 할인가 적용한다.
      _total_ticket_price = _total_ticket_price - _total_goods_discount_ticket;
      if(_total_ticket_price < 0){
        _total_ticket_price = 0;
      }

      //날짜 체크해서 처리하기...
      const waitSec = Util.getWaitTimeSec(orderData.created_at);
      if(waitSec <= 0){
        //0보다 작으면 값을 바꿔줘야함.
        //이거 주석 풀어줘야 함. 일단 테스트로 8 고정
        
        db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL_WAIT_PAY, orderData.id], (result_order_update) => {
          return res.json({
            state: res_state.error,
            message: '결제 가능 시간이 지났습니다.',
            result: {
            }
          });
        }, (error) => {
            return res.json({
              state: res_state.error,
              message: error,
              result: {
              } 
            })
        });
        
        return;
      }
      // console.log(Util.getWaitTimeSec(orderData.created_at));

      return res.json({
        result: {
          state: res_state.success,

          wait_sec: waitSec,
          order_id: orderData.id,
          project_id: orderData.project_id,
          total_ticket_price: _total_ticket_price,
          total_discount_price: _total_goods_discount_ticket,
          total_goods_price: _total_goods_price,

          total_price: orderData.total_price,
          merchant_uid: orderData.merchant_uid,

          select_tickets: select_tickets.concat(),
          select_goods: select_goods.concat(),

          title: orderData.title,
          poster_renew_url: orderData.poster_renew_url,
          isDelivery: orderData.isDelivery,
          pay_type: orderData.pay_type,

          discount_info: [
            ...discountsDatas
          ]
        }
      })
    });
  })
})

router.post("/eticket", function(req, res){
  const order_id = req.body.data.order_id;

  let queryOrder = mysql.format("SELECT _order.count, attended, _order.state, project.title, project.poster_renew_url, concert_hall, ticket.show_date FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON ticket.id=_order.ticket_id WHERE _order.id=?", order_id);

  db.SELECT(queryOrder, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보 오류'
      })
    }

    const orderData = result[0];

    return res.json({
      result:{
        
        state: res_state.success,
        data: {
          ...orderData
        }
      }
    })
  });

});

router.post("/attended", function(req, res){
  const order_id = req.body.data.order_id;

  db.UPDATE("UPDATE orders AS _order SET _order.attended=?", ["ATTENDED"], 
  (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: error,
      result: {}
    })
  })
});

router.post("/answer/get", function(req, res){
  const order_id = req.body.data.order_id;

  const querySelect = mysql.format("SELECT answer FROM orders WHERE id=?", order_id);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '질문이 없습니다.',
        result:{}
      })
    }

    const data = result[0];

    return res.json({
      result:{
        state: res_state.success,
        answer: data.answer
      }
    })
  })
})

router.post("/cancel", function(req, res){
  const order_id = req.body.data.order_id;
  const user_id = req.body.data.user_id;
  
  const querySelect = mysql.format("SELECT serializer_uid, merchant_uid, _order.user_id, project.event_type_sub, project.pick_state, ticket.show_date, _order.total_price, _order.state, _order.deleted_at, event_type, project.funding_closing_at, project.type, project.poster_url, _order.ticket_id FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON ticket.id=_order.ticket_id WHERE _order.id=?", [order_id]);

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
    if(orderData.user_id !== user_id){
      return res.json({
        state: res_state.error,
        message: '주문자 정보가 일치하지 않습니다.',
        result:{}
      })
    }

    if(orderData.total_price > 0){
      const amount = getRefundAmount(orderData.type, orderData.show_date, orderData.funding_closing_at, orderData.ticket_id, orderData.total_price, orderData.event_type);

      if(orderData.serializer_uid && orderData.serializer_uid === 'scheduled'){
        const customer_uid = Util.getPayNewCustom_uid(user_id);
        iamport.subscribe.unschedule({
          merchant_uid: orderData.merchant_uid,
          customer_uid: customer_uid
          // amount: amount
        }).then(function(result_iamport){
          db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL, order_id], 
          (result_order_update) => {
            return res.json({
              result:{
                state: res_state.success,
                order_state: types.order.ORDER_STATE_CANCEL
              }
            })
          }, (error) => {
            return res.json({
              state: res_state.error,
              message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다.',
              result:{}
            })
          })
        }).catch(function(error){
          return res.json({
            state: res_state.error,
            message: error.message,
            result:{}
          })
        })
      }else{
        iamport.payment.cancel({
          merchant_uid: orderData.merchant_uid,
          amount: amount
        }).then(function(result_iamport){
          db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL, order_id], 
          (result_order_update) => {
            return res.json({
              result:{
                state: res_state.success,
                order_state: types.order.ORDER_STATE_CANCEL
              }
            })
          }, (error) => {
            return res.json({
              state: res_state.error,
              message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다.',
              result:{}
            })
          })
        }).catch(function(error){
          return res.json({
            state: res_state.error,
            message: error.message,
            result:{}
          })
        })
      }
    }else{
      db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL, order_id], 
      (result_order_update) => {
        return res.json({
          result:{
            state: res_state.success,
            order_state: types.order.ORDER_STATE_CANCEL
          }
        })
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다.',
          result:{}
        })
      })
    }
  })
  
})


function isErrorOrder(state){
  if(state >= types.order.ORDER_STATE_ERROR_START)
  {
    return true;
  }

  return false;
}

function getIsCancel(state, deleted_at){
  if (deleted_at) {
    return true;
  }

  if(
    state === types.order.ORDER_STATE_CANCEL ||
    state === types.order.ORDER_STATE_PROJECT_CANCEL ||
    state === types.order.ORDER_STATE_PAY_ACCOUNT_NO_PAY || 
    state === types.order.ORDER_STATE_CANCEL_ACCOUNT_PAY)
  {
    return true;
  }

  return false;
}

function isEventTypeDefault(event_type){
  return event_type === types.project.EVENT_TYPE_DEFAULT;
}

function isAccountOrder(state){
  if(
    state === types.order.ORDER_STATE_PAY_ACCOUNT_STANDBY || 
    state === types.order.ORDER_STATE_PAY_ACCOUNT_SUCCESS ||
    state === types.order.ORDER_STATE_PAY_ACCOUNT_NO_PAY || 
    state === types.order.ORDER_STATE_CANCEL_ACCOUNT_PAY)
  {
    return true;
  }

  return false;
}

function isPickedComplete(pick_state){
  if(pick_state === types.project.PICK_STATE_PICKED)
  {
    return true;
  }

  return false;
}

function isFinished(funding_closing_at){
  if(!funding_closing_at || funding_closing_at === ''){
    return false;
  }
  
  let expireGap = moment_timezone(funding_closing_at).diff(moment_timezone());
  if(expireGap < 0){
    return true;
  }

  return false;
}

function isEventTypeInvitationEvent(event_type){
  return event_type === types.project.EVENT_TYPE_INVITATION_EVENT;
}

function isEventCustomType(event_type){
  return event_type === types.project.EVENT_TYPE_CUSTOM;
}

function isFundingType(type){
    return type === 'funding';
}

function isPick(state){
  if(state === types.order.ORDER_STATE_PROJECT_PICK_CANCEL)
  {
    return false;
  }

  return true;
}

function getStateStringAttribute(state, pick_state, deleted_at, event_type, type, funding_closing_at){
  if (deleted_at) {
      return '취소됨';
  }

  // $project = Project::find($this->project_id);
  // if(!$project)
  // {
  //   return "프로젝트 에러";
  // }

  if(state === types.order.ORDER_STATE_APP_PAY_WAIT){
    return '결제대기';
  }
  else if(state === types.order.ORDER_STATE_CANCEL_WAIT_PAY){
    return '자동취소됨';
  }
  else if(state === types.order.ORDER_STATE_CANCEL)
  {
    return '취소됨';
  }
  else if(state === types.order.ORDER_STATE_ERROR_NO_PAY_NINETY_EIGHT)
  {
    return '결제실패(결제에러)';
  }
  else if(state === types.order.ORDER_STATE_PROJECT_CANCEL)
  {
    return '목표 도달 실패';
  }
  else if(state === types.order.ORDER_STATE_PAY_SCHEDULE)
  {
    if(isPickedComplete(pick_state))
    {
      return '당첨 - 결제예약';
    }
    else if(isFinished(funding_closing_at))
    {
      return '결제완료';
    }
    else
    {
      return '결제예약';
    }
  }
  else if(state === types.order.ORDER_STATE_PAY_SCHEDULE_RESULT_FAIL)
  {
    if(isPickedComplete(pick_state))
    {
      return '당첨 - 결제실패';
    }

    return '결제실패(예약)';
  }
  else if(state === types.order.ORDER_STATE_STANDBY_START)
  {
    return '결제 에러(1)';
  }
  else if(state === types.order.ORDER_STATE_ERROR_PAY)
  {
    return '결제 에러(2)';
  }
  else if(state === types.order.ORDER_STATE_PAY_SUCCESS_NINETY_EIGHT)
  {
    return '결제완료';
  }
  else if(state === types.order.ORDER_STATE_PROJECT_PICK_CANCEL)
  {
    return '미당첨';
  }
  else if(state === types.order.ORDER_STATE_PAY_ACCOUNT_STANDBY)
  {
    return '입금대기';
  }
  else if(state === types.order.ORDER_STATE_PAY_ACCOUNT_NO_PAY)
  {
    return '미입금 취소됨';
  }
  else if(state === types.order.ORDER_STATE_CANCEL_ACCOUNT_PAY)
  {
    return '입금 취소함';
  }
  else if(state === types.order.ORDER_STATE_PAY_ACCOUNT_SUCCESS)
  {
    return '결제완료(입금확인)';
  }
  else if(state === types.order.ORDER_STATE_APP_STORE_PAYMENT)
  {
    return '승인대기'
  }
  else if(state === types.order.ORDER_STATE_APP_STORE_READY)
  {
    return '승인완료(콘텐츠 제작중)'
  }
  else if(state === types.order.ORDER_STATE_APP_STORE_SUCCESS)
  {
    return '크티 전달완료'
  }
  else if(state === types.order.ORDER_STATE_APP_STORE_RELAY_CUSTOMER)
  {
    return '고객 전달완료'
  }
  else if(state === types.order.ORDER_STATE_CANCEL_STORE_RETURN)
  {
    return '반려'
  }
  else if(state === types.order.ORDER_STATE_CANCEL_STORE_WAIT_OVER)
  {
    return '승인 만료(취소됨)'
  }


  //Lazy Eager 로딩 관련해서
  //$project = $this->getProject();

  if(isEventTypeInvitationEvent(event_type)){
    return '응모완료';
  }

  if(isEventCustomType(event_type)){
    return '신청완료';
  }

  if(state === types.order.ORDER_STATE_PAY)
  {
    if(isPickedComplete(pick_state))
    {
      return '당첨 - 결제완료';
    }
  }

  if (isFundingType(type) && !isFinished(funding_closing_at)) {
      return '결제예약';
  }

  return '결제완료';
}

function isOrderStateStandbyStart(state){
  return state === types.order.ORDER_STATE_STANDBY_START;
}

function isPaySuccess(state){
  if(state === types.order.ORDER_STATE_PAY)
  {
    return true;
  }

  return false;
}

function isFundingPayFail(state){
  if(state === types.order.ORDER_STATE_PAY_SCHEDULE_RESULT_FAIL)
  {
    return true;
  }

  return false;
}

function isOldProject(poster_url){
  if(poster_url)
  {
    return true;
  }

  return false;
}

function isPlaceTicket(show_date){
  //티켓이 있다면 환불 가능 날짜 가져오기.
  if(show_date === '0000-00-00 00:00:00')
  {
    //공연 미정이라면 funding 날로 잡는다.
    return false;
  }

  return true;
}

function getTicketReFundDate(show_date, funding_closing_at){
  let refundDay = show_date;

  //티켓이 있다면 환불 가능 날짜 가져오기.
  //if((int)date('Y', strtotime($refundDay)) <= 0)
  if(isPlaceTicket(show_date) === false)
  {
    //공연 미정이라면 funding 날로 잡는다.
    refundDay = funding_closing_at;
  }

  return refundDay;
}

function canCancel(funding_closing_at, type, poster_url, state, deleted_at, ticket_id, show_date){
    //if ($this->deleted_at) {
    if (getIsCancel(state, deleted_at)) {
        return false;
    }

    let dday = 0;

    if(isOldProject(poster_url))
    {
      //예전 코드
      return false;
      // if (this.isFundingType(type)) {
      //     if (funding_closing_at) {
      //         $dday = strtotime('-1 days', strtotime($project->funding_closing_at));
      //     }
      // } else {
      //     $ticket = $this->getTicket();
      //     if ($ticket->delivery_date) {
      //         $before = strtotime('-1 days', strtotime($ticket->delivery_date));
      //         $dday = strtotime(date('Y-m-d', $before) . ' 23:59:59');
      //     }
      // }
    }
    else
    {
      let refundDay = 0;
      if (isFundingType(type))
      {
        if (funding_closing_at) {
            refundDay = funding_closing_at;
        }

        dday = moment_timezone(refundDay).add(-1, 'days');
      }
      else
      {
        if(isFinished(funding_closing_at))
        {
          //즉시 결제시 티켓 유무와 상관없이 프로젝트 종료 날이 지나면 무조건 취소 불가능하다
          return false;
        }

        if(ticket_id)
        {
          //티켓정보가 있다면, 공연 시작날 기준으로 환불
          refundDay = getTicketReFundDate(show_date, funding_closing_at);
        }
        else
        {
          refundDay = funding_closing_at;
        }

        // refundDay = date("Y-m-d 00:00:00", strtotime(refundDay));
        refundDay = moment_timezone(refundDay).format('YYYY-MM-DD 00:00:00');
        // dday = strtotime(refundDay);
        dday = refundDay;
      }

      //$dday = strtotime('-1 days', strtotime($refundDay));
    }

    // return $dday - time() > 0;
    let expireGap = moment_timezone(dday).diff(moment_timezone());
    return expireGap > 0;
}

function isPickType(event_type){
    //return $this->type === 'pick';
    return event_type === types.project.EVENT_TYPE_PICK_EVENT;
}

function isSaleType(type){
    return type === 'sale';
}

function isEventTypeGroupBuy(event_type){
  return event_type === types.project.EVENT_TYPE_GROUP_BUY;
}

function hasCancellationFees(type, show_date, funding_closing_at, ticket_id, event_type){
  
  if(isEventTypeGroupBuy(event_type)){
    return false;
  }

  if (isSaleType(type)) {
    if(ticket_id)
    {
      let refundDay = getTicketReFundDate(show_date, funding_closing_at);
      if (refundDay) {
          // let before =  strtotime('-9 days', strtotime($refundDay));
          let before = moment_timezone(refundDay).add(-9, 'days');
          let beforeReformat = moment_timezone(before).format('YYYY-MM-DD 00:00:00');
          // return strtotime(date('Y-m-d', $before) . ' 00:00:00') - time() < 0;
          return moment_timezone(beforeReformat).diff(moment_timezone()) < 0;

          // let before = strtotime('-9 days', strtotime($refundDay));
          // return strtotime(date('Y-m-d', $before) . ' 00:00:00') - time() < 0;
      }
    }
  }
  return false;
}

function getCancellationFees(type, show_date, funding_closing_at, ticket_id, total_price, event_type){
    if (hasCancellationFees(type, show_date, funding_closing_at, ticket_id, event_type)) {
        return total_price * CANCELLATION_FEES_RATE;
    }
    return 0;
}

function getRefundAmount(type, show_date, funding_closing_at, ticket_id, total_price, event_type){
    return total_price - getCancellationFees(type, show_date, funding_closing_at, ticket_id, total_price, event_type);
}

function getRefundPolicyTitle(event_type){
  if(isEventTypeDefault(event_type)){
    return '크티 취소/환불 규정';
  }else if(isEventTypeInvitationEvent(event_type)){
    return '초대권 신청 정책';
  }else if(isEventCustomType(event_type)){
    return '이벤트 신청 정책';
  }else{
    return '크티 취소/환불 규정';
  }
}

function isEventSubTypeSandBox(event_type_sub){
  return event_type_sub === types.project.EVENT_TYPE_SUB_SANDBOX_PICK;
}

function getRefundPolicyContent(event_type, type, funding_closing_at, event_type_sub){
  if(isEventTypeDefault(event_type)){
    if(type == 'funding'){
      return '본 프로젝트는 목표에 도달하여야 성공하는 프로젝트로, 티켓팅 마감일 하루 전까지는 언제든지 결제 예약을 수수료 없이 취소할 수 있습니다. 다만 티켓팅 마감 24시간 전부터는 프로젝트 진행자의 기대이익에 따라 취소가 불가능합니다.';
    }else{
      
        let funding_closing_date = moment_timezone(funding_closing_at).format("YYYY년 MM월 DD일");

        return `1. 본 이벤트의 티켓 구매, 후원 및 결제 취소 마감일은 ${funding_closing_date} 입니다.\n2. 마감일 이후에는 티켓의 판매가 이루어지지 않으며 이에 따라 ${funding_closing_date} 이후에는 환불이 불가능합니다.\n3. 이벤트의 관람일 9일전부터는 티켓금액의 10%가 취소 수수료로 부과됩니다.\n4. 관람일을 기준으로 10일 이상 남은 경우에는 취소 수수료가 없습니다.\n5. 구매하신 티켓의 관람 당일 환불은 불가능합니다.\n6. 티켓을 구매하지 않은 후원 및 굿즈 구매의 경우 결제 취소 시 환불 수수료가 붙지 않습니다.\n7. 티켓 환불은 사이트 오른쪽 상단 '결제확인' 탭에서 진행하시면 됩니다.`
        
      
    }
  }else if(isEventTypeInvitationEvent(event_type)){
    return `1. 초대권 신청은 티켓 예매가 아닙니다. <b>신청 후 당첨이 되어야만 티켓을 받으실 수 있습니다.\n2. 초대권 신청 내역 확인 및 취소는 오른쪽 상단 '결제확인' 탭에서 하실 수 있습니다.\n3. 초대권의 판매, 양도, 및 교환은 금지되어 있으며 이를 위반하여 발생하는 불이익에 대하여 크라우드티켓에서는 책임을 지지 않습니다.`

  }else if(isEventTypeGroupBuy(event_type)){
    // @if($project->isEventSubTypeWoongjinPlayCity())
    return `1. 본 상품은 한정 특가 공동구매 상품으로, 판매 기간 이후 취소 및 환불이 불가합니다.\n2. 판매 기간(2020-09-24 ~ 2020-09-29)에 한하여, 우측 상단 [결제 확인] 탭에서 취소 및 환불을 진행하실 수 있습니다.\n3. 판매 기간 내 고객센터 접수 시 100% 취소 및 환불 가능합니다.\n4. 카드사에 따라 취소 및 환불이 완료될 때까지 영업일 기준 약 2~3일이 소요될 수 있습니다.`
    // @endif()
  }else if(isEventCustomType(event_type)){
    return `1. 제출해주시는 정보는 이벤트 주관사 측으로 전달되며 추후 이벤트 진행을 위해 연락을 드릴 수 있습니다.\n2. 제출해주시는 정보는 이벤트 진행 목적 외의 용도로 사용되지 않습니다.\n3. 잘못된 정보를 기재하실 경우, 선정 대상에서 제외될 수 있으니 해당 부분 참고 부탁드립니다.`
  }else if(isPickType(event_type)){
  
    let funding_closing_date_without_time = moment_timezone(funding_closing_at).format("YYYY-MM-DD");
  
    if(isEventSubTypeSandBox(event_type_sub)){
      return `본 이벤트는 무료로 진행되며 별도의 수수료가 발생하지 않습니다.\n* 참가 내역 취소는 ${funding_closing_date_without_time} 까지 가능하며 이후에는 취소가 불가능합니다.`
    }else{
      return `본 프로젝트는 참가자로 선정된 경우에만 결제가 진행됩니다.\n* ${funding_closing_date_without_time} 이후 참여 취소 및 환불 불가능\n추첨이 시작되면 취소 및 환불이 불가능합니다.`
    }
  }
}

function receiptDeliveryTitleText(event_type_sub, isDelivery){
  if(isDelivery === 'FALSE'){
    return ''
  }

  if(isEventSubTypeSandBox(event_type_sub)){
    return '상품 배송지'
  }else{
    return '굿즈 배송지'
  }
}

router.post("/receipt/info", function(req, res){
  // const isSaleType = req.body.data.isSaleType;
  const order_id = req.body.data.order_id;
  const querySelect = mysql.format("SELECT isDelivery, postcode, address_main, address_detail, requirement, project.event_type_sub, project.pick_state, ticket.show_date, _order.total_price, _order.state, _order.deleted_at, event_type, project.funding_closing_at, project.type, project.poster_url, _order.ticket_id FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON ticket.id=_order.ticket_id WHERE _order.id=?", [order_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보가 없습니다.',
        result:{}
      })
    }

    let refundButtonText = '';
    let refundExplainText = '';
    let isRefundButtonDisable = false;
    const data = result[0];

    // let receiptDeliveryTitleText = receiptDeliveryTitleText(data.event_type_sub, data.isDelivery);

    let _receiptDeliveryTitleText = receiptDeliveryTitleText(data.event_type_sub, data.isDelivery)
    if(data.state === types.order.ORDER_STATE_CANCEL_WAIT_PAY){
      refundButtonText = '자동취소됨';
      refundExplainText = '결제 대기 시간 초과로 자동 취소됨.';
      isRefundButtonDisable = true;
      return res.json({
        result:{
          state: res_state.success,
          refundButtonText: refundButtonText,
          isRefundButtonDisable: isRefundButtonDisable,
          refundExplainText: refundExplainText,
          receiptDeliveryTitleText: _receiptDeliveryTitleText,
          postcode: data.postcode,
          address_main: data.address_main,
          address_detail: data.address_detail,
          requirement: data.requirement
          // refund_policy_title: refund_policy_title,
          // refund_policy_content: refund_policy_content
        }
      })
    }
    
    if(isErrorOrder(data.state)){
      isRefundButtonDisable = true;
      refundButtonText = "결제에러"; 
    }
    else{
      if(getIsCancel(data.state, data.deleted_at)){
        if(isEventTypeDefault(data.event_type)){
          if(isAccountOrder(data.state)){
            isRefundButtonDisable = true;
            refundButtonText = getStateStringAttribute(data.state, data.pick_state, data.deleted_at, data.event_type, data.type, data.funding_closing_at);
          }else{
            if (data.type === 'funding'){
              isRefundButtonDisable = true;
              refundButtonText = '취소됨';
            }else{
              isRefundButtonDisable = true;
              // refundButtonText = '환불됨';
              refundButtonText = '취소됨';
            }
          }
        }else if(isEventTypeInvitationEvent(data.event_type)){
          isRefundButtonDisable = true;
          refundButtonText = '취소됨';
        }else if(isEventCustomType(data.event_type)){
          isRefundButtonDisable = true;
          refundButtonText = '취소됨';
        }else{
          isRefundButtonDisable = true;
          refundButtonText = '취소됨';
        }
      }else{
        if(isOrderStateStandbyStart(data.state)){
          isRefundButtonDisable = true;
          refundButtonText = '결제 에러';
          refundExplainText = '카드 결제가 진행된 경우 크라우드티켓으로 연락주세요.';
        }else if(isPickedComplete(data.pick_state)){
          if(isPick(data.state)){
            if(isPaySuccess(data.state)){
              isRefundButtonDisable = true;
              refundButtonText = '참가확정';
              refundExplainText = '참가확정 및 결제가 완료되었습니다.';
            }else if(isFundingPayFail(data.state)){
              isRefundButtonDisable = true;
              refundButtonText = '참가확정(결제 실패)';
              refundExplainText = '카드 잔고부족, 한도초과 외 기타 문제로 결제가 실패되었습니다. 크라우드티켓에서 별도로 연락을 드리겠습니다.';
            }else{
              isRefundButtonDisable = true;
              refundButtonText = '참가확정';
              refundExplainText = '참가가 확정되어, 상단의 결제일에 결제가 진행됩니다.';
            }
          }else{
            isRefundButtonDisable = true;
            refundButtonText = '이벤트 당첨실패';
            refundExplainText = '아쉽게도 참가자 명단에 선정되지 못하셨습니다. 티켓 결제정보는 자동으로 취소 및 삭제되었습니다.';
          }

        }else if (canCancel(data.funding_closing_at, data.type, data.poster_url, data.state, data.deleted_at, data.ticket_id, data.show_date)){
          isRefundButtonDisable = false;
          if(isEventTypeDefault(data.event_type) || isPickType(data.event_type)){
            if (data.type === 'funding'){
              refundButtonText = '취소하기';
            }else{
              if(isAccountOrder(data.state)){
                isRefundButtonDisable = true;
                refundButtonText = getStateStringAttribute(data.state, data.pick_state, data.deleted_at, data.event_type, data.type, data.funding_closing_at);
              }else{
                refundButtonText = '환불하기';
              }

              if (hasCancellationFees(data.type, data.show_date, data.funding_closing_at, data.ticket_id, data.event_type)){
                  refundExplainText = `환불 정책에 따라 취소 수수료 ${Util.getNumberWithCommas(getCancellationFees(data.type, data.show_date, data.funding_closing_at, data.ticket_id, data.total_price))}원이 차감된 ${Util.getNumberWithCommas(getRefundAmount(data.type, data.show_date, data.funding_closing_at, data.ticket_id, data.total_price, data.event_type))}원이 환불됩니다. \n 환불은 2~3일 정도 소요될 수 있습니다.`
              }
              
              // if($order->isAccountOrder()){
              // 
              //   refundExplainText = '계좌이체 후 환불을 원하실 경우, 크라우드티켓(070-8819-4308)으로 문의 바랍니다.'
              // 
              // }
            }
          }else if(isEventTypeInvitationEvent(data.event_type)){
            refundButtonText = '취소하기';
          }else if(isEventCustomType(data.event_type)){
            refundButtonText = '취소하기';
          }else{
            refundButtonText = '취소하기';
          }
        }else{
          if(isEventTypeDefault(data.event_type) || isPickType(data.event_type)){
            if (data.type === 'funding'){
              refundButtonText = '취소불가';
              isRefundButtonDisable = true;
              refundExplainText = '취소 가능 일자가 지났습니다.';
            }else{
              refundButtonText = '환불불가';
              isRefundButtonDisable = true;
              refundExplainText = '환불 가능 일자가 지났습니다.';
            }
          }else if(isEventTypeInvitationEvent(data.event_type)){
            refundButtonText = '취소불가';
            isRefundButtonDisable = true;
            refundExplainText = '취소 가능 일자가 지났습니다.';
          }else if(isEventCustomType(data.event_type)){
            refundButtonText = '취소불가';
            isRefundButtonDisable = true;
            refundExplainText = '취소 가능 일자가 지났습니다.';
          }else{
            refundButtonText = '취소불가';
            isRefundButtonDisable = true;
            refundExplainText = '취소 가능 일자가 지났습니다.';
          }
        }


      }
    }

    // let refund_policy_title = getRefundPolicyTitle(data.event_type);
    // let refund_policy_content = getRefundPolicyContent(data.event_type, data.type, data.funding_closing_at, data.event_type_sub);

    return res.json({
      result:{
        state: res_state.success,
        refundButtonText: refundButtonText,
        isRefundButtonDisable: isRefundButtonDisable,
        refundExplainText: refundExplainText,
        receiptDeliveryTitleText: _receiptDeliveryTitleText,
        postcode: data.postcode,
        address_main: data.address_main,
        address_detail: data.address_detail,
        requirement: data.requirement
      }
    })
  })
});

router.post("/refund/policy", function(req, res){
  const project_id = req.body.data.project_id;
  const querySelect = mysql.format("SELECT project.event_type_sub, event_type, project.funding_closing_at, project.type FROM projects AS project WHERE project.id=?", [project_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보가 없습니다.',
        result:{}
      })
    }

    const data = result[0];
    let refund_policy_title = getRefundPolicyTitle(data.event_type);
    let refund_policy_content = getRefundPolicyContent(data.event_type, data.type, data.funding_closing_at, data.event_type_sub);

    return res.json({
      result:{
        state: res_state.success,
        refund_policy_title: refund_policy_title,
        refund_policy_content: refund_policy_content
      }
    })
  })
});

router.post("/wait/sec", function(req, res){
  const order_id = req.body.data.order_id;
  const querySelect = mysql.format("SELECT created_at FROM orders WHERE id=?", [order_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '대기 시간 정보를 가져올 수 없습니다.',
        result:{}
      })
    }

    let data = result[0];
    const waitSec = Util.getWaitTimeSec(data.created_at);
    return res.json({
      result:{
        state: res_state.success,
        wait_sec: waitSec,
      }
    })
  });
});

router.post("/wait/cancel", function(req, res){
  const order_id = req.body.data.order_id;
  const user_id = req.body.data.user_id;

  const querySelect = mysql.format("SELECT user_id, created_at FROM orders WHERE id=?", [order_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '대기 주문 취소 실패',
        result:{}
      })
    }

    let data = result[0];
    if(data.user_id !== user_id){
      return res.json({
        state: res_state.error,
        message: '대기 주문 취소. 주문자 불일치',
        result:{}
      })
    }

    const waitSec = Util.getWaitTimeSec(data.created_at);
    if(waitSec > 0){
      //여기에 왔을땐 프론트에서 체크 해서 넘겨주지만 혹시 모르니..
      return res.json({
        result:{
          state: res_state.success,
          // wait_sec: waitSec,
        }
      })
    }

    db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL_WAIT_PAY, order_id], (result_order_update) => {
      // console.log(orderData.id + ' changed' + ' ORDER_STATE_CANCEL_WAIT_PAY');
      return res.json({
        state: res_state.none,
        result: {
        }
      });
    }, (error) => {
        
    });
    // const waitSec = Util.getWaitTimeSec(data.created_at);
    // return res.json({
    //   result:{
    //     state: res_state.success,
    //     wait_sec: waitSec,
    //   }
    // })
  });
})

router.post("/discount/info", function(req, res){
  const order_id = req.body.data.order_id;
  const queryOrder = mysql.format("SELECT percent_value FROM orders AS _order LEFT JOIN discounts AS discount ON discount.id=_order.discount_id WHERE _order.id=?", [order_id]);

  db.SELECT(queryOrder, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '할인 정보를 가져올 수 없음.',
        result:{}
      })
    }

    const data = result[0];
    return res.json({
      result:{
        total_discount_price: data.percent_value
      }
    })    
  })
});

router.post("/address/set", function(req, res){
  const order_id = req.body.data.order_id;
  const postcode = req.body.data.postcode;
  const address_main = req.body.data.address_main;
  const address_detail = req.body.data.address_detail;
  const requirement = req.body.data.requirement;


  db.UPDATE("UPDATE orders AS _order SET postcode=?, address_main=?, address_detail=?, requirement=? WHERE _order.id=?", [postcode, address_main, address_detail, requirement, order_id], 
  (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: 'error',
      message: '배송지 셋팅 실패',
      result: {
      }
    });
  })
});

/*
function getOrderStateStringAttribute(state){
  let string = '';
  if(state === types.order.ORDER_STATE_APP_STORE_PAYMENT){
     string = ''
  }else if(state === types.order.ORDER_STATE_APP_STORE_PAYMENT){

  }else if(state === types.order)
}
*/

function getStorePayState(state){
  if(state >= types.order.ORDER_STATE_ERROR_START){
    return '결제에러';
  }else if(state >= types.order.ORDER_STATE_CANCEL_START){
    return '결제취소';
  }else {
    return '결제완료';
  }
}

function getRefundPolicyStoreContent(){
  return `1. 모든 콘텐츠 주문은 크리에이터의 승인이 필요합니다.\n2. 크리에이터의 의사에 따라 콘텐츠 주문이 반려될 수 있습니다.\n3. 주문 날짜로부터 7일 안에 승인이 안되거나 반려될 경우 결제 금액은 전액 환불됩니다.\n4. 주문이 승인되기 전 구매자에 의한 주문 취소 및 환불이 가능합니다.\n5. 크리에이터가 주문을 승인한 이후에는 취소 및 환불이 불가능합니다. 단, 주문 날짜로부터 최대 14일 이내에 콘텐츠를 제공받지 못한 경우에는 결제 금액을 전액 환불해드립니다.\n6. 콘텐츠를 제공 받은 이후에는 단순 불만족 또는 변심으로 인한 환불이 불가능하니 유의해주세요.`;
  // return `1. 콘텐츠 주문 이후 크리에이터가 승인을 하기 전까지는 구매자에 의한 주문 취소 및 환불이 가능합니다.\n2. 콘텐츠 주문 날짜로부터 7일 이내에 주문 승인이 이루어지지 않거나 크리에이터에 의해 요청이 반려되는 경우 결제 금액은 전액 환불됩니다..\n3. 크리에이터가 주문을 승인한 이후에는 취소 및 환불이 불가능합니다. 단, 주문 날짜로부터 최대 14일 이내에 콘텐츠를 제공받지 못한 경우에만 결제 금액을 전액 환불해드립니다.\n4. 콘텐츠를 제공 받은 이후에는 콘텐츠에 대한 불만족 또는 단순 변심으로 인한 환불이 불가능한 점 유의해주세요.`
}

router.post("/store/info", function(req, res){
  const store_order_id = req.body.data.store_order_id;

  const querySelect = mysql.format('SELECT orders_item.user_id AS order_user_id, refund_reason, orders_item.state, orders_item.item_id, orders_item.store_id, orders_item.total_price, orders_item.contact, orders_item.email, orders_item.name, orders_item.requestContent, orders_item.created_at, item.price AS item_price, item.title AS item_title FROM orders_items AS orders_item LEFT JOIN items AS item ON item.id=orders_item.item_id WHERE orders_item.id=?', store_order_id);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보 조회 오류',
        result: {}
      })
    }

    let data = result[0];

    const _state_string = getStateStringAttribute(data.state, null, null, null, null, null);
    let refundButtonText = '';
    let isRefund = false;
    let refundPolicyText = getRefundPolicyStoreContent();
    
    let _card_state_text = '';
    if(data.total_price === 0){
      _card_state_text = '';
    }else{
      _card_state_text = getStorePayState(data.state);
    }

    if(data.state === types.order.ORDER_STATE_APP_STORE_PAYMENT){
      refundButtonText = "주문 취소";
      isRefund = true;
    }else if(data.state === types.order.ORDER_STATE_APP_STORE_READY){
      refundButtonText = "콘텐츠 준비중";
    }else if(data.state === types.order.ORDER_STATE_APP_STORE_SUCCESS){
      refundButtonText = "콘텐츠 제공 완료";
    }else if(data.state === types.order.ORDER_STATE_CANCEL_STORE_RETURN){
      refundButtonText = "반려됨";
    }else if(data.state === types.order.ORDER_STATE_CANCEL_STORE_WAIT_OVER){
      refundButtonText = "승인기간 만료(주문취소)";
    }else if(data.state === types.order.ORDER_STATE_CANCEL){
      refundButtonText = "취소됨";
    }
    else{
      refundButtonText = '주문정보에러(크티에문의주세요!)';
    }



    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data,
          state_string: _state_string,
          card_state_text: _card_state_text,
          refundButtonText: refundButtonText,
          isRefund: isRefund,
          refundPolicyText: refundPolicyText
        }
      }
    })
  })
});

router.post('/store/item/list', function(req, res){
  const user_id = req.body.data.user_id;
  
  const querySelect = mysql.format("SELECT id AS store_order_id FROM orders_items WHERE user_id=? ORDER BY id DESC", user_id);
  
  db.SELECT(querySelect, {}, (result) => {
    // if(result.length === 0){
    //   return res.json({
    //     state: res_state.error,
    //     message: '주문 정보 조회 오류',
    //     result:{}
    //   })
    // }

    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/store/cancel", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const user_id = req.body.data.user_id;
  const order_user_id = req.body.data.order_user_id;
  
  const querySelect = mysql.format("SELECT serializer_uid, merchant_uid, orders_item.user_id, orders_item.total_price, orders_item.state FROM orders_items AS orders_item WHERE orders_item.id=?", [store_order_id]);

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
    if(order_user_id){
      if(orderData.user_id !== order_user_id){
        return res.json({
          state: res_state.error,
          message: '주문자 정보가 일치하지 않습니다.',
          result:{}
        })
      }
    }else{
      if(orderData.user_id !== user_id){
        return res.json({
          state: res_state.error,
          message: '주문자 정보가 일치하지 않습니다.',
          result:{}
        })
      }
    }
    

    if(orderData.total_price > 0){
      if(orderData.serializer_uid && orderData.serializer_uid === 'scheduled'){
        // const customer_uid = Util.getPayNewCustom_uid(user_id);
        // iamport.subscribe.unschedule({
        //   merchant_uid: orderData.merchant_uid,
        //   customer_uid: customer_uid
        // }).then(function(result_iamport){
        //   db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL, order_id], 
        //   (result_order_update) => {
        //     return res.json({
        //       result:{
        //         state: res_state.success,
        //         order_state: types.order.ORDER_STATE_CANCEL
        //       }
        //     })
        //   }, (error) => {
        //     return res.json({
        //       state: res_state.error,
        //       message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다.',
        //       result:{}
        //     })
        //   })
        // }).catch(function(error){
        //   return res.json({
        //     state: res_state.error,
        //     message: error.message,
        //     result:{}
        //   })
        // })
      }else{
        iamport.payment.cancel({
          merchant_uid: orderData.merchant_uid,
          amount: orderData.total_price
        }).then(function(result_iamport){
          db.UPDATE("UPDATE orders_items AS orders_item SET orders_item.state=? WHERE orders_item.id=?", [types.order.ORDER_STATE_CANCEL, store_order_id], 
          (result_order_update) => {
            return res.json({
              result:{
                state: res_state.success,
                order_state: types.order.ORDER_STATE_CANCEL
              }
            })
          }, (error) => {
            return res.json({
              state: res_state.error,
              message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다.',
              result:{}
            })
          })
        }).catch(function(error){
          return res.json({
            state: res_state.error,
            message: error.message,
            result:{}
          })
        })
      }
    }else{
      db.UPDATE("UPDATE orders_items AS orders_item SET orders_item.state=? WHERE orders_item.id=?", [types.order.ORDER_STATE_CANCEL, store_order_id], 
      (result_order_update) => {
        return res.json({
          result:{
            state: res_state.success,
            order_state: types.order.ORDER_STATE_CANCEL
          }
        })
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: '취소 실패. 계속 실패할 경우 크티에 문의 바랍니다.',
          result:{}
        })
      })
    }
  })
  
})

sendStoreRefundEmail = (store_order_id, refund_reason) => {
  const querySelect = mysql.format("SELECT orders_item.user_id AS order_user_id, item.title AS item_title, orders_item.email, orders_item.name AS order_name, master_user.name, master_user.nick_name FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN users AS master_user ON store.user_id=master_user.id LEFT JOIN items AS item ON item.id=orders_item.item_id WHERE orders_item.id=?", store_order_id);
  db.SELECT(querySelect, {}, (result) => {
      const data = result[0];

      // console.log(data);
      
      let toEmail = data.email;
      // if(!data.store_user_email || data.store_user_email === ''){
      //     toEmail = data.user_email;
      // }

      let store_manager_name = data.nick_name;
      if(!data.nick_name || data.nick_name === ''){
          store_manager_name = data.name;
      }
      
      const mailMSG = {
          to: toEmail,
          from: '크티<contact@crowdticket.kr>',
          subject: Templite_email.email_store_order_rejected.subject,
          html: Templite_email.email_store_order_rejected.html(store_manager_name, data.order_name, data.item_title, refund_reason)
      }
      sgMail.send(mailMSG).then((result) => {
          // console.log(result);
      }).catch((error) => {
          // console.log(error);
      })
  })
}

sendStoreRefundSMSOrderUser = (store_order_id) => {
  const querySelect = mysql.format("SELECT contact FROM orders_items WHERE id=?", store_order_id);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return;
    }
    
    const data = result[0];
    if(!data.contact || data.contact === ''){
        return;
    }

    const content = '[크티] 크리에이터에게 요청하신 콘텐츠가 반려됐습니다. 상세내용은 웹사이트에서 확인하세요.'
    Global_Func.sendSMS(data.contact, content, (result) => {

    })
  })
}

router.post("/store/state/refund", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const refund_reason = req.body.data.refund_reason;

  db.UPDATE("UPDATE orders_items SET state=?, refund_reason=? WHERE id=?", [types.order.ORDER_STATE_CANCEL_STORE_RETURN, refund_reason, store_order_id], 
  (result) => {

    this.sendStoreRefundEmail(store_order_id, refund_reason);
    this.sendStoreRefundSMSOrderUser(store_order_id);
    return res.json({
      result: {
        state: res_state.success,
        data: {
          state: types.order.ORDER_STATE_CANCEL_STORE_RETURN
        }
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '주문 업데이트 실패',
      result: {}
    })
  });
});

sendStoreApproveEmail = (store_order_id) => {
  const querySelect = mysql.format("SELECT orders_item.user_id AS order_user_id, item.title AS item_title, orders_item.email, orders_item.name AS order_name, master_user.name, master_user.nick_name FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN users AS master_user ON store.user_id=master_user.id LEFT JOIN items AS item ON item.id=orders_item.item_id WHERE orders_item.id=?", store_order_id);
  db.SELECT(querySelect, {}, (result) => {
      const data = result[0];

      // console.log(data);
      
      let toEmail = data.email;
      // if(!data.store_user_email || data.store_user_email === ''){
      //     toEmail = data.user_email;
      // }

      let store_manager_name = data.nick_name;
      if(!data.nick_name || data.nick_name === ''){
          store_manager_name = data.name;
      }
      
      const mailMSG = {
          to: toEmail,
          from: '크티<contact@crowdticket.kr>',
          subject: Templite_email.email_store_order_approved.subject,
          html: Templite_email.email_store_order_approved.html(store_manager_name, data.order_name, data.item_title, data.order_user_id)
      }
      sgMail.send(mailMSG).then((result) => {
          // console.log(result);
      }).catch((error) => {
          // console.log(error);
      })
  })
}

sendStoreApproveSMSOrderUser = (store_order_id) => {
  const querySelect = mysql.format("SELECT contact FROM orders_items WHERE id=?", store_order_id);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return;
    }
    
    const data = result[0];
    if(!data.contact || data.contact === ''){
        return;
    }

    const content = '[크티] 크리에이터가 요청된 콘텐츠 준비를 시작했습니다! 상세내용은 웹사이트에서 확인하세요.';
    Global_Func.sendSMS(data.contact, content, (result) => {

    })
  })
}

router.post("/store/state/ok", function(req, res){
  const store_order_id = req.body.data.store_order_id;

  db.UPDATE("UPDATE orders_items SET state=? WHERE id=?", [types.order.ORDER_STATE_APP_STORE_READY, store_order_id], 
  (result) => {

    this.sendStoreApproveEmail(store_order_id);
    this.sendStoreApproveSMSOrderUser(store_order_id);

    return res.json({
      result: {
        state: res_state.success,
        data: {
          state: types.order.ORDER_STATE_APP_STORE_READY
        }
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '주문 업데이트 실패',
      result: {}
    })
  });
});

router.post("/store/state/relay/ct", function(req, res){
  const store_order_id = req.body.data.store_order_id;

  db.UPDATE("UPDATE orders_items SET state=? WHERE id=?", [types.order.ORDER_STATE_APP_STORE_SUCCESS, store_order_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
        data: {
          state: types.order.ORDER_STATE_APP_STORE_SUCCESS
        }
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '주문 업데이트 실패',
      result: {}
    })
  });

});


module.exports = router;