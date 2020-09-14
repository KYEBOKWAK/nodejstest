var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');
var mysql = require('mysql');
const res_state = use('lib/res_state.js');
const Util = use('lib/util.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

router.post('/wait/order', function(req, res){
  const user_id = req.body.data.user_id;
  
  let orderQuery = mysql.format("SELECT ticket.category, categories_ticket.title AS categories_ticket_title, ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id LEFT JOIN categories_tickets AS categories_ticket ON categories_ticket.id=ticket.category WHERE _order.user_id=? AND _order.state=? ORDER BY id DESC", [user_id, types.order.ORDER_STATE_APP_PAY_WAIT]);
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
            state: res_state.none,
            result: {
            }
          });
        }, (error) => {
            
        });
        
        return;
      }
      // console.log(Util.getWaitTimeSec(orderData.created_at));

      return res.json({
        result: {
          state: res_state.success,
          toastType: types.toastMessage.TOAST_TYPE_CONNECT_TICKETING,
          toastMessage: '',
          toastMessageData: {
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
          },
        }
      })
    });
  })
});

router.post('/topthumbnail', function(req, res) {
  db.SELECT("SELECT type_rgb, title_rgb, url, title, type, target_id, target_id_name, page_key FROM maincarousel", [], function(result){
    res.json({
      result
    })
  });
});

router.post('/ticketing/list', function(req, res) {
  db.SELECT("SELECT mt.project_id AS project_id, title, poster_renew_url, project_id FROM main_thumbnails AS mt " +
            "JOIN projects AS pjt " +
            "WHERE mt.project_id = pjt.id", [],
            function(result){
              res.json({
                result
              })
            });

});

//SELECT title, poster_renew_url, id FROM projects WHERE event_type_sub != 2 ORDER BY id DESC
router.post('/all/project', function(req, res) {

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let querySelect = mysql.format("SELECT title, poster_renew_url, poster_url, id FROM projects WHERE state=? AND event_type_sub!=? ORDER BY funding_closing_at DESC", [types.project.STATE_APPROVED, types.project.EVENT_TYPE_SUB_SECRET_PROJECT]);

  // let querySelect = mysql.format("SELECT title, poster_renew_url, poster_url, id FROM projects WHERE state=? AND event_type_sub<>? AND funding_closing_at>? ORDER BY funding_closing_at DESC", [types.project.STATE_APPROVED, types.project.EVENT_TYPE_SUB_SECRET_PROJECT, date]);

  db.SELECT(querySelect, {}, function(result){
              res.json({
                result
              });

  // db.SELECT("SELECT title, poster_renew_url, poster_url, id FROM projects" +
  //           " WHERE state = ?"+
  //           " AND event_type_sub <> ?"+
  //           " ORDER BY id DESC LIMIT 13", [types.project.STATE_APPROVED, types.project.EVENT_TYPE_SUB_SECRET_PROJECT], function(result){
  //             res.json({
  //               result
  //             });
  });

  /*
  db.SELECT("SELECT title, poster_renew_url, id FROM projects" +
            " WHERE state = "+types.project.STATE_APPROVED +
            " AND event_type_sub != "+types.project.EVENT_TYPE_SUB_SECRET_PROJECT +
            " ORDER BY id DESC LIMIT 13", function(result){
    res.json({
      result
    });
  });
  */
});

router.post('/event/feed', function(req, res){
  return res.json({
    result:{
      event_image_bg_url: 'https://crowdticket0.s3-ap-northeast-1.amazonaws.com/banner/200806_banner_bg_color.png',
      event_image_url: 'https://crowdticket0.s3-ap-northeast-1.amazonaws.com/banner/200806_banner_m.png',
      event_link: 'https://docs.google.com/forms/u/1/d/e/1FAIpQLSdTjkJne_8uf0UtRgPPjq7jeGe7Hi09O2vgPWpIQM6w2xpmmA/viewform',
      info: {
        bg_height: 80,
        img_height: 62
      }
    }
  })
});

module.exports = router;