var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const moment = require('moment');

var mysql = require('mysql');
const Util = use('lib/util.js');

const global = use('lib/global_const.js');
// const util = require('./lib/util.js');

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
    console.log(order);
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
  
  let queryOrder = mysql.format("SELECT state, deleted_at, created_at FROM orders AS _order WHERE _order.id=?", order_id);
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

    let payState = "참여";
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
  
  let orderQuery = mysql.format("SELECT ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id, discount_id, goods_meta, _order.supporter_id, supporter.price AS supporter_price, type_commision, pay_method, _order.name, _order.email, _order.contact FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id LEFT JOIN supporters AS supporter ON supporter.id=_order.supporter_id WHERE _order.id=?", order_id);
  db.SELECT(orderQuery, [], (result_order) => {
    // console.log(result_order);
    if(result_order === undefined || result_order.length === 0){
      return res.json({
        state: res_state.none,
        result: {
        }
      })
    }

    //test//
    // const test = result_order[0];
    // res.json({
    //   ...test
    // })
    // return;
    ////////

    const orderData = result_order[0];

    //goods 구매 정보도 가져온다.
    let goodsQuery = mysql.format("SELECT ticket_discount, count, _goods.price, goods_id, _goods.title FROM orders_goods AS _orders_goods LEFT JOIN goods AS _goods ON _orders_goods.goods_id=_goods.id WHERE _orders_goods.order_id=?;", orderData.id);
    // let discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE project_id=?;", orderData.project_id);
    let discountsQuery = "";
    if(orderData.discount_id !== null){
      discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE discount_id=?;", orderData.discount_id);
    }
    // let discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE project_id=?;", orderData.discount_id);

    let goods_discounts_query = goodsQuery+discountsQuery;
    db.SELECT_MULITPLEX(goods_discounts_query, (result_goods_discounts) => {
      
      const GOODS_INDEX = 0;
      const DISCOUNT_INDEX = 1;
      let goodsDatas = [];
      let discountsDatas = [];
      console.log(result_goods_discounts);

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

/*
router.post("/any/receipt/detail", function(req, res){
  // const user_id = req.body.data.user_id;
  const order_id = req.body.data.order_id;
  
  let orderQuery = mysql.format("SELECT ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.id=?", order_id);
  db.SELECT(orderQuery, [], (result_order) => {
    // console.log(result_order);
    if(result_order === undefined || result_order.length === 0){
      return res.json({
        state: res_state.none,
        result: {
        }
      })
    }

    //test//
    // const test = result_order[0];
    // res.json({
    //   ...test
    // })
    // return;
    ////////

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

          discount_info: [
            ...discountsDatas
          ]
          
        }
      })
    });
  })
});
*/

router.post("/get/wait/orderdata", function(req, res){
  // const user_id = req.body.data.user_id;
  const order_id = req.body.data.order_id;
  
  let orderQuery = mysql.format("SELECT ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.id=?", order_id);
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

module.exports = router;