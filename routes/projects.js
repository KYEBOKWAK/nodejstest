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

router.post("/ticketing/list", function(req, res){
  // const user_id = req.body.data.user_id;
  var nowDate = moment().format('YYYY-MM-DD HH:mm:ss');

  let queryLikeTicketing = mysql.format("SELECT project.poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project WHERE project.state=? AND project.funding_closing_at > ?", [types.project.STATE_APPROVED, nowDate]);

  db.SELECT(queryLikeTicketing, {}, (result_select_ticketing) => {

    for(let i = 0 ; i < result_select_ticketing.length ; i++){
      let resultTicketingData = result_select_ticketing[i];

      let isFinished = Util.isPrjectFinished(resultTicketingData.funding_closing_at);
      resultTicketingData.isFinished = isFinished;
    }

    return res.json({
      result:{
        state: res_state.success,
        list: result_select_ticketing
      }
    })
  })
});

router.post("/expire", function(req, res){
  const project_id = req.body.data.project_id

  let querySelectProject = mysql.format("SELECT funding_closing_at FROM projects WHERE id=?", project_id);
  db.SELECT(querySelectProject, {}, (result_select) => {
    if(result_select.length === 0){
      return res.json({
        state: res_state.error,
        message: '프로젝트 아이디 오류',
        result:{}
      })
    }

    const data = result_select[0];
    let isExpire = false;
    if(Util.isExpireTime(data.funding_closing_at)){
      isExpire = true;
    }

    return res.json({
      result: {
        state: res_state.success,
        isExpire: isExpire
      }
    })
  });
});

router.post("/get", function(req, res){
  const skip = req.body.data.skip;
  const TAKE = 6;

  const sortType = req.body.data.sortType;

  const listType = req.body.data.listType;
  const target_id = req.body.data.target_id;
  const localTitle = req.body.data.localTitle;

  const user_id = req.body.data.user_id;

  let mannayoQuery = "";

  if(listType === types.project_list_type.PROJECT_LIST_LIKE){
    mannayoQuery = mysql.format("SELECT project.poster_url, _like.id, project.id AS project_id, project.title, project.poster_renew_url FROM likes AS _like LEFT JOIN projects AS project ON _like.target_id=project.id WHERE _like.like_type=? AND _like.user_id=? GROUP BY _like.id DESC LIMIT ? OFFSET ?", [types.like.LIKE_PROJECT, user_id, TAKE, skip]);
  }else if(listType === types.project_list_type.PROJECT_LIST_TICKETING){

    //현재시간
    var nowDate = moment().format('YYYY-MM-DD HH:mm:ss');
    // console.log(nowDate.toString());

    mannayoQuery = mysql.format("SELECT project.poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project WHERE project.state=? AND funding_closing_at > ? ORDER BY project.id DESC LIMIT ? OFFSET ?", [types.project.STATE_APPROVED, nowDate, TAKE, skip]);
  }else if(listType === types.project_list_type.PROJECT_LIST_FIND){
    const findWord = "%"+req.body.data.findWord+"%";

    mannayoQuery = mysql.format("SELECT poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id WHERE project.state=? AND (project.title LIKE ? OR hash_tag1 LIKE ? OR hash_tag2 LIKE ? OR categorie.title LIKE ? OR detailed_address LIKE ?) ORDER BY project.id DESC LIMIT ? OFFSET ?", [types.project.STATE_APPROVED, findWord, findWord, findWord, findWord, findWord, TAKE, skip]);
  }

  db.SELECT(mannayoQuery, [], (result_mannayo) => {
    return res.json({
      result: {
        state: res_state.success,
        result_mannayo
      }
    })
  });
});

router.post('/survey', function(req, res){
  const project_id = req.body.data.project_id;

  const order_id = req.body.data.order_id;

  let querySelect = mysql.format("SELECT question, id FROM questions WHERE project_id=? ORDER BY order_number ASC", [project_id]);
  db.SELECT(querySelect, {}, (result_question) => {
    if(result_question.length === 0){
      return res.json({
        result:{
          state: res_state.success,
          survey: []
        }
      });
    }
  
    return res.json({
      result:{
        state: res_state.success,
        survey: [...result_question]
      }
    });
  });

  // db.SELECT("SELECT question, id FROM questions WHERE project_id=? ORDER BY order_number ASC", [project_id], (result_question) => {
  //   if(result_question.length === 0){
  //     return res.json({
  //       result:{
  //         state: res_state.success,
  //         survey: []
  //       }
  //     });
  //   }
  
  //   return res.json({
  //     result:{
  //       state: res_state.success,
  //       survey: [...result_question]
  //     }
  //   });
  // });
  
});

router.post('/wait/timer', function(req, res){
  const order_id = req.body.data.order_id;
  const user_id = req.body.data.user_id;
  console.log(order_id);

  let orderQuery = mysql.format("SELECT created_at FROM orders AS _order WHERE _order.id=? AND _order.user_id=?", 
  [order_id, user_id]);

  db.SELECT(orderQuery, [], (result) => {
    if(result === undefined){
      return res.json({
        state: res_state.error,
        message: 'order 정보 조회 실패',
        result: {
        }
      })
    }

    // console.log(result);
    let data = result[0];
    const waitTimeMin = Util.getWaitTimeMinWithText(data.created_at);
    res.json({
      result: {
        state: res_state.success,
        waitTimeMin: waitTimeMin
      }
    })
  });
});

router.post('/survey/save', function(req, res){
  const project_id = req.body.data.project_id;
  const order_id = req.body.data.order_id;
  let surveyDataArray = req.body.data.survey_data_array;
  surveyDataArray = JSON.stringify(surveyDataArray);
  
  db.SELECT("UPDATE orders AS _order SET answer=? WHERE _order.id=?;", [surveyDataArray, order_id], function(result_order){
    console.log(result_order);
    if(!result_order){
      return res.json({
        result:{
          state: res_state.success,
          message: '설문 정보 업데이트 오류'
        }  
      })
    }

    return res.json({
      result:{
        state: res_state.success
      }
    })
  });
});

router.post('/detail', function(req, res) {
  const project_id = req.body.data.project_id;
  
  db.SELECT("SELECT project.id AS project_id, user.id AS user_id, user.name, user.profile_photo_url, user.introduce, project.title, project.poster_renew_url, project.poster_url, project.story, detailed_address, concert_hall, isDelivery, project.type FROM projects AS project" +
            " INNER JOIN users AS user" +
            " ON project.user_id=user.id" +
            " WHERE project.id=?", [project_id], function(result){
              res.json({
                result
              });
            });

  /*
  db.SELECT("SELECT channel.url as channelLink, categories_channel_id, user.name, user.profile_photo_url, user.introduce, project.title, project.poster_renew_url, project.poster_url, project.story FROM projects AS project" +
            " INNER JOIN users AS user" +
            " ON project.user_id=user.id" +
            " INNER JOIN channels AS channel" +
            " ON project.user_id=channel.user_id" +
            " WHERE project.id="+req.params.id, function(result){
              res.json({
                result
              });
            });
            */
            //name, title, poster_renew_url, poster_url, story
  // db.SELECT("SELECT title, poster_renew_url, poster_url, story FROM projects" + 
  //           " WHERE id="+req.params.id, function(result){
  //             res.json({
  //               result
  //             });
  //           });
});

router.post('/tickets', function(req, res) {
  let project_id = req.body.data.project_id;

  //db.SELECT("SELECT ticket.id, audiences_limit, buy_limit, ticket.price, show_date, category, count(`order`.id) AS order_count FROM tickets AS ticket" + 
  db.SELECT("SELECT ticket.id, audiences_limit, buy_limit, ticket.price, show_date, category, sum(`order`.count) AS order_count FROM tickets AS ticket" + 
            " LEFT JOIN `orders` AS `order`" +
            " ON `order`.ticket_id=ticket.id" +
            " AND `order`.state<"+types.order.ORDER_STATE_PAY_END+
            " WHERE ticket.project_id=?" +
            " GROUP BY ticket.id" +
            " ORDER BY ticket.show_date DESC", [project_id], function(result){
              res.json({
                result
              });
            });
});

router.get('/:id/tickets/:ticket_id', function(req, res) {
  let project_id = req.params.id;
  let ticket_id = req.params.ticket_id;
  // let call_count = 3;

  db.SELECT("SELECT id, audiences_limit, buy_limit, price, show_date, category FROM tickets AS ticket" + 
            " WHERE ticket.project_id=?" +
            " ORDER BY ticket.show_date DESC", [project_id], function(result){
              res.json({
                result
              });
            });
});

//굿즈 확인 api
router.post('/goods/amount', function(req, res){
  let project_id = req.body.data.project_id;
  let goods_id = req.body.data.goods_id;

  let query = "SELECT id, goods_meta, state FROM orders WHERE project_id=? AND state<=? AND goods_meta LIKE ?";
  query = mysql.format(query, [project_id, types.order.ORDER_STATE_PAY_END, "%\"id\":"+goods_id+"%"]);
  
  // console.log(test);
  db.SELECT(query, [], function(result){
    return res.json({
      result
    });
  })


  // return;
  // db.SELECT_LIKE_PARAMETER(["SELECT id, goods_meta FROM orders", " WHERE project_id=?", " AND goods_meta LIKE "], 
  // ["\"id\":"+goods_id], 
  // [project_id], 
  // function(result){
  //   res.json({
  //     result
  //   });
  // });

  /*
  db.SELECT_LIKE_PARAMETER(["SELECT id, goods_meta FROM orders", " WHERE project_id=?", " AND goods_meta LIKE "], 
  ["\"id\":"+goods_id], 
  [project_id], 
  function(result){
    res.json({
      result
    });
  });
  */
});

router.post('/goods', function(req, res) {
  let project_id = req.body.data.project_id;
  // let call_count = 3;

  db.SELECT("SELECT id, project_id, limit_count, price, ticket_discount, title, content, img_url, buy_limit FROM goods" +
            " WHERE project_id=?" +
            " ORDER BY goods.id DESC", [project_id], function(result){
              res.json({
                result
              });
            });
  // db.SELECT("SELECT id, project_id, limit_count, price, ticket_discount, title, content, img_url FROM goods AS goods" + 
  //           " LEFT JOIN `orders` AS `order`" +
  //           " ON `order`.ticket_id=ticket.id" +
  //           " AND `order`.state<"+types.order.ORDER_STATE_PAY_END+
  //           " WHERE ticket.project_id=?" +
  //           " GROUP BY ticket.id" +
  //           " ORDER BY ticket.show_date DESC", [project_id], function(result){
  //             res.json({
  //               result
  //             });
  //           });
});

/*
function resBuyTicketGoods(_data, req, res){
  // console.log(_data.ticket_id);
  //price => 티켓 한장의 값
  //total_price => 총 토탈 값
  let _total_price = 0;
  let _total_ticket_price = 0;
  if(_data.ticket_id !== undefined){
    //티켓id가 있으면 티켓 결과
    const localData = req.body.data.select_tickets.find((value) => {
      return value.id === _data.ticket_id;
    });

    if(localData === undefined){
      return res.json({
        state: 'error',
        message: '로컬 데이터 에러',
        result: {
        }
      });
    };

    if(_data.sum_order_count !== null){
      if(_data.sum_order_count >= _data.audiences_limit){
        return res.json({
          result: {
            state: 'soldout',
            ticket_id: _data.id,
            show_date: _data.show_date
          }
        });
      }else if(_data.sum_order_count + localData.count > _data.audiences_limit){
        return res.json({
          result: {
            state: 'overcount',
            ticket_id: _data.id,
            show_date: _data.show_date
          }
        });
      }
    }

    if(_data.buy_limit !== 0 && _data.buy_limit > localData.count){
      console.log("buylimitover!!");
      return res.json({
        result: {
          state: 'buylimitover',
          ticket_id: _data.id,
          show_date: _data.show_date
        }
      });
    }

    let ticketTotalPrice = Number(_data.ticket_price) * Number(localData.count);

    _total_ticket_price+=ticketTotalPrice;

    // console.log("ticketinfo!!");
    // console.log(ticketTotalPrice);
    //구매 가능함.
  }else if(_data.goods_id !== undefined){
    //굿즈 id가 있으면 굿즈 결과
    const localData = req.body.data.select_goods.find((value) => {
      return value.id === _data.goods_id;
    });
    console.log("goodsinfo!!");
    // console.log(localData);
  }
}
*/
/*
function setStateOrderUpdate(state, order_id, res){
  db.UPDATE("UPDATE orders AS _order SET state=? WHERE id=?", [state, order_id], function(result_update_order){
    return res.json({
      result: {
        state: res_state.soldout_ticket,
        ticket_id: ticketData.ticket_id,
        show_date: ticketData.show_date
      }
    });
  });
}
*/

function getStateTicketAmountCheck(ticketData, localData){
  const _data = ticketData;
  if(_data.sum_order_count === null){
    return res_state.success;
  }
  console.log(_data);
  if(_data.sum_order_count >= _data.audiences_limit){
    return res_state.soldout_ticket;
  }else if(_data.sum_order_count + localData.count > _data.audiences_limit){
    return res_state.overcount_ticket;
  }else if(_data.buy_limit !== 0 && localData.count > _data.buy_limit){
    return res_state.buylimitover
  }

  return res_state.success;
}

function getStateGoodsAmountCheck(GoodsData, localData){
  const _data = GoodsData;
  // console.log(_data);
  // console.log(localData);
  console.log(_data.sum_order_count);
  if(_data.sum_order_count === null){
    //null이면 한명도 구매 하지 않음..
    return res_state.success;
  }
  
  if(_data.limit_count > 0 && _data.sum_order_count >= _data.limit_count){
    return res_state.soldout_goods;
  }else if(_data.limit_count > 0 && _data.sum_order_count + localData.count > _data.limit_count){
    return res_state.overcount_goods;
  }else if(_data.buy_limit !== 0 && localData.count > _data.buy_limit){
    return res_state.buylimitover_goods;
  }

  return res_state.success;
}

//supporter set api 
router.post("/order/support", function(req, res){
  let _data = req.body.data[0];

  //통신이 끊김으로 인해서 support를 insert 했을수도 있으니, select를 먼저 해본다.
  let query_selecct_support = "SELECT id, price FROM supporters WHERE supporters.order_id=?"
  query_selecct_support = mysql.format(query_selecct_support, _data.order_id);
  db.SELECT(query_selecct_support, [], function(result_select_support){
    if(result_select_support.length === 0){
      //0일경우 insert
      var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
      let ticket_id = null;
      for(let i = 0 ; i < _data.select_tickets.length ; i++){
        let ticketObject = _data.select_tickets[i];
        ticket_id = ticketObject.id;
      }

      let insertSupportObject = {
        project_id: _data.project_id,
        ticket_id: ticket_id,
        user_id: req.body.data.user_id,
        order_id: _data.order_id,
        price: _data.support_price,
        created_at: date,
        updated_at: date
      }
      db.INSERT("INSERT INTO supporters SET ?;", insertSupportObject, function(result_insert_support){
        console.log(result_insert_support);
        return res.json({
          result:{
            state: 'success'
          }
        });
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: error,
          result:{}
        })
      });
    }else{
      let _result_select_support = result_select_support[0];
      if(_result_select_support.price === _data.support_price){
        return res.json({
          result:{
            state: 'success'
          }
        });
      }else{
        return res.json({
          state: 'error',
          message: '후원 에러. 다시 구매해주시기 바랍니다.'
        })
      }
    }
  });

});

//실 결제전 주문정보 수정
router.post("/order/edit", function(req, res){
  let _data = req.body.data[0];

  let orderQuery = "";
  //할인정보가 있으면 orderQuery 에 같이 요청
  if(_data.discount_id !== null){
    // orderQuery = "SELECT _order.id AS _order_id, discount.id AS discount_id, _order.merchant_uid, _order.discount_id AS order_discount_id, _order.total_price, _order.user_id, _order.project_id, _order.ticket_id, percent_value, _order.count, _order.price, _order.goods_meta, supporter.id AS supporter_id, supporter.price AS supporter_price FROM orders AS _order LEFT JOIN discounts AS discount ON discount.id=? LEFT JOIN supporters AS supporter ON supporter.order_id=_order.id WHERE _order.id=?;";

    orderQuery = "SELECT _order.id AS _order_id, discount.id AS discount_id, _order.merchant_uid, _order.discount_id AS order_discount_id, _order.total_price, _order.user_id, _order.project_id, _order.ticket_id, percent_value, _order.count, _order.price, _order.goods_meta, supporter.id AS supporter_id, supporter.price AS supporter_price FROM orders AS _order LEFT JOIN discounts AS discount ON discount.id=? LEFT JOIN supporters AS supporter ON supporter.id=_order.supporter_id WHERE _order.id=?;";

    order_goods_query = "SELECT _goods.ticket_discount, count, price, order_goods.id AS order_goods_id FROM orders_goods AS order_goods LEFT JOIN goods AS _goods ON order_goods.goods_id=_goods.id WHERE order_goods.order_id=?;"
    
    orderQuery = mysql.format(orderQuery,[_data.discount_id, _data.order_id]);
    order_goods_query = mysql.format(order_goods_query, _data.order_id);

    orderQuery = orderQuery + order_goods_query;
  }else{
    // orderQuery = "SELECT _order.id AS _order_id, total_price, _order.user_id, _order.project_id, _order.merchant_uid, _order.ticket_id, supporter.id AS supporter_id, supporter.price AS supporter_price FROM orders AS _order LEFT JOIN supporters AS supporter ON supporter.order_id=_order.id WHERE _order.id=?";
    orderQuery = "SELECT _order.id AS _order_id, total_price, _order.user_id, _order.project_id, _order.merchant_uid, _order.ticket_id, supporter.id AS supporter_id, supporter.price AS supporter_price FROM orders AS _order LEFT JOIN supporters AS supporter ON supporter.id=_order.supporter_id WHERE _order.id=?";

    orderQuery = mysql.format(orderQuery, _data.order_id);
  }
  // let orderQuery = "SELECT id, total_price, user_id, project_id, ticket_id FROM orders WHERE id=?";
  // orderQuery = mysql.format(orderQuery, _data.order_id);

  db.SELECT_MULITPLEX(orderQuery, (result_order) => {
    
    if(result_order === undefined){
      return res.json({
        state: 'error',
        message: 'DB 조회 에러!',
        result: {
        }
      });
    }

    let _orderData = result_order[0];

    //support price+discount가 total_price와 맞는지 비교한다.
    if(_data.discount_id !== null){
      //굿즈에도 discount 정보가 있는지 확인한다.
      _orderData = result_order[0][0];
      let _order_goods_data = result_order[1];
      let _order_goods_ticket_discount = 0;
      let _order_goods_total_price = 0;
      for(let i = 0 ; i < _order_goods_data.length ; i++){
        //티켓당 굿즈에서 할인된 가격을 구한다.
        let _order_goods_object = _order_goods_data[i];
        // console.log(_order_goods_object.ticket_discount);
        let ticketDiscount = _order_goods_object.ticket_discount * _order_goods_object.count;
        let goodsPrice = _order_goods_object.price * _order_goods_object.count;

        _order_goods_ticket_discount += ticketDiscount;
        _order_goods_total_price += goodsPrice;
      }
      
      let ticketPrice = _orderData.price * _orderData.count;
      let add_discount_value = _orderData.percent_value * _orderData.count;

      let ticket_discounting_total_price = ticketPrice - _order_goods_ticket_discount - add_discount_value;
      if(ticket_discounting_total_price < 0){
        ticket_discounting_total_price = 0;
      }

      let _support_price = 0;
      let _supporter_id = _orderData.supporter_id
      if(_orderData.supporter_price !== null){
        _support_price = _orderData.supporter_price
      }

      let re_total_price = ticket_discounting_total_price + _order_goods_total_price + _support_price;
      if(_data.total_price === re_total_price){
        db.UPDATE("UPDATE orders AS _order SET total_price=?, discount_id=?, supporter_id=? WHERE _order.id=?;", 
        [re_total_price, _data.discount_id, _supporter_id, _orderData._order_id], 
        (result_update_orders) => {
          if(result_update_orders === undefined){
            return res.json({
              state: 'error',
              message: 'order update error!',
              result: {
              }
            });
          }

          return res.json({
            result: {
              state: 'success',
              total_price: re_total_price,
              user_id: req.body.data.user_id,
              order_id: _orderData._order_id,
              merchant_uid: _orderData.merchant_uid
            }
          });
        }, (error) => {
          return res.json({
            state: 'error',
            message: 'order update error!',
            result: {
            }
          });
        });
      }else{
        return res.json({
          state: 'error',
          message: '총 결제 금액이 일치하지 않습니다.',
          result: {
          }
        });
      }
    }else{
      //할인정보가 없을경우 후원만 체크한다.
      // let reTotalPrice = _orderData.total_price + _data.support_price;
      let _support_price = 0;
      let _supporter_id = _orderData.supporter_id
      if(_orderData.supporter_price !== null){
        _support_price = _orderData.supporter_price
      }

      let reTotalPrice = _orderData.total_price + _support_price;
      if(_data.total_price === reTotalPrice){
        //update해야함!!!!
        db.UPDATE("UPDATE orders AS _order SET total_price=?, supporter_id=? WHERE _order.id=?;", 
        [reTotalPrice, _supporter_id, _orderData._order_id], 
        (result_update_orders) => {
          if(result_update_orders === undefined){
            return res.json({
              state: 'error',
              message: 'order update error!',
              result: {
              }
            });
          }

          return res.json({
            result: {
              state: 'success',
              total_price: reTotalPrice,
              user_id: req.body.data.user_id,
              order_id: _orderData._order_id,
              merchant_uid: _orderData.merchant_uid
            }
          });
        });
      }else{
        return res.json({
          state: 'error',
          message: '총 결제 금액이 일치하지 않습니다.',
          result: {
          }
        });
      }

    }

    // db.UPDATE("UPDATE orders SET ;", orderObject, function(result){});
    // console.log(_data);

    // return res.json({
    //   result:{
    //     state: res_state.success,
    //     order_id: _orderData.id,
    //     total_price: _orderData.total_price
    //   }
    // })

  });
});

router.post("/buy/temporary/ticket", function(req, res){
  //티켓 id, 수량 , 굿즈 id, 수량 
  //test//
  ////////
  let state = res_state.init;
  let makeTicketIdArray = [];
  let queryWhereOr = "";
  const _project_id = req.body.data.project_id;
  const _user_id = req.body.data.user_id;
  const _merchant_uid = Util.getPayNewMerchant_uid(_project_id, _user_id);

  for(let i = 0 ; i < req.body.data.select_tickets.length ; i++){
    const ticketObject = req.body.data.select_tickets[i];
    
    if(i === req.body.data.select_tickets.length - 1){
      queryWhereOr+="ticket.id=?";
    }else{
      queryWhereOr+="ticket.id=? OR ";
    }
    
    makeTicketIdArray.push(ticketObject.id);
  };
  

  let makeGoodsIdArray = [];
  let queryGoodsTail = "";
  for(let i = 0 ; i < req.body.data.select_goods.length ; i++){
    const goodsObject = req.body.data.select_goods[i];

    if(i === req.body.data.select_goods.length - 1){
      queryGoodsTail += "_goods.id=?";
    }else{
      queryGoodsTail += "_goods.id=? OR "
    }

    makeGoodsIdArray.push(goodsObject.id);
  }

  let ticketQuery = "";
  let buyState = types.buyState.BUY_STATE_NONE;
  if(makeTicketIdArray.length > 0){
    // ticketQuery = "SELECT ticket.id AS ticket_id, ticket.price AS ticket_price, audiences_limit, buy_limit, ticket.project_id, sum(_order.count) AS sum_order_count, show_date FROM tickets AS ticket LEFT JOIN orders AS _order ON _order.ticket_id=ticket.id AND _order.state<"+types.order.ORDER_STATE_PAY_END+"  WHERE "+queryWhereOr+" GROUP BY ticket.id;";
    ticketQuery = "SELECT ticket.id AS ticket_id, ticket.price AS ticket_price, audiences_limit, buy_limit, ticket.project_id, sum(_order.count) AS sum_order_count, show_date FROM tickets AS ticket LEFT JOIN orders AS _order ON _order.ticket_id=ticket.id AND _order.state<"+types.order.ORDER_STATE_PAY_END+"  WHERE "+queryWhereOr+" GROUP BY ticket.id;";
    ticketQuery = mysql.format(ticketQuery, makeTicketIdArray);
    buyState = types.buyState.BUY_STATE_ONLY_TICKET;
  }
  //쿼리문 만들기
  
  //goods의 개수를 가져와야함.
  let goodsQuery = "";
  if(makeGoodsIdArray.length > 0){
    goodsQuery = "SELECT _goods.id AS goods_id, _goods.price AS goods_price, ticket_discount, buy_limit, title, limit_count, sum(order_goods.count) AS sum_order_count FROM goods AS _goods LEFT JOIN orders_goods AS order_goods ON order_goods.goods_id=_goods.id WHERE " + queryGoodsTail + " GROUP BY _goods.id";
    goodsQuery = mysql.format(goodsQuery, makeGoodsIdArray);
    buyState = types.buyState.BUY_STATE_ONLY_GOODS;
  }

  if(makeTicketIdArray.length > 0 && makeGoodsIdArray.length > 0){
    buyState = types.buyState.BUY_STATE_TICKET_AND_GOODS;
  }else if(makeTicketIdArray.length === 0 && makeGoodsIdArray.length === 0){
    buyState = types.buyState.BUY_STATE_ONLY_SUPPORT;
  }

  let query = ticketQuery+goodsQuery;

  //로그인정보 가져오기.
  //새로운 코드 start
  let userInfoQuery = "SELECT email, name, contact FROM users WHERE id=?";
  userInfoQuery = mysql.format(userInfoQuery, req.body.data.user_id);
  //새로운 코드 end
  db.SELECT(userInfoQuery, [], (result_user) => {
    if(result_user === undefined){
      return res.json({
        state: 'error',
        message: '유저 정보 조회 에러!',
        result: {
        }
      });
    }

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    const _user_data = result_user[0];

    if(buyState === types.buyState.BUY_STATE_ONLY_SUPPORT){
      let _onlySupportOrderObject = {
        project_id : _project_id,
        ticket_id : null,
        user_id: _user_id,
        state: types.order.ORDER_STATE_APP_PAY_WAIT,
        count: 0,
        contact: _user_data.contact,
        price: 0,
        total_price: 0,
        type_commision: types.order.ORDER_TYPE_COMMISION_WITHOUT_COMMISION,
        name: _user_data.name,
        email: _user_data.email,
        is_pick: '',
        account_name: '',
        order_story: '',
        answer: '',
        attended: '',
        fail_message: '',
        goods_meta: '{}',
        imp_meta: '{}',
        merchant_uid: _merchant_uid,
        created_at : date,
        updated_at: date
      };

      db.INSERT("INSERT INTO orders SET ?;", _onlySupportOrderObject, function(result_insert_order_only_support){
        console.log("success!!!!!!!");
        if(result_insert_order_only_support === undefined){
          return res.json({
            state: 'error',
            message: 'order insert error!',
            result: {
            }
          });
        }

        let _orderId = result_insert_order_only_support.insertId;

        return res.json({
          result: {
            state: 'success',
            order_id: _orderId,
            total_ticket_price: 0,
            total_discount_price: 0,
            total_goods_price: 0,
            total_price: 0,
            merchant_uid: _merchant_uid,
            discount_info: []
          }
        });
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: error,
          result:{}
        })
      })

      //only support 
      return;
    }

    db.SELECT_MULITPLEX(query, function(result_ticket_goods_info){
      //없으면 undefined
      if(result_ticket_goods_info === undefined || result_ticket_goods_info.length === 0){
        return res.json({
          state: 'error',
          message: 'DB 조회 에러!',
          result: {
          }
        });
      }

      let _total_ticket_price = 0;
      let _total_goods_price = 0;
      let _total_goods_discount_ticket = 0;

      let _goods_meta_array = [];
      let _goods_meta = '{}'

      //티켓 데이터 셋팅
      let ticketData = undefined;
      let goodsData = undefined;
      if(buyState === types.buyState.BUY_STATE_TICKET_AND_GOODS){
        ticketData = result_ticket_goods_info[0][0];  //위에 query 순사가 바뀌면 data 순서도 바껴야 함.
        goodsData = result_ticket_goods_info[1];
      }else if(buyState === types.buyState.BUY_STATE_ONLY_TICKET){
        ticketData = result_ticket_goods_info[0];
      }else if(buyState === types.buyState.BUY_STATE_ONLY_GOODS){
        goodsData = result_ticket_goods_info;
      }

      //굿즈에서 가격정보 가져옴.
      if(goodsData){
        for(let i = 0 ; i < goodsData.length ; i++){
          const _data = goodsData[i];
          const localData = req.body.data.select_goods.find((value) => {
            return value.id === _data.goods_id;
          });

          //test//
          // state = res_state.success;
          ///////
          state = getStateGoodsAmountCheck(_data, localData);
          if(state !== res_state.success){
            return res.json({
              result: {
                state: state,
                goods_id: _data.id,
                title: _data.title
              }
            });
          }

          let _goodsObject = {
            id: _data.goods_id,
            count: localData.count
          }

          _goods_meta_array.push(_goodsObject);//meta data

          _total_goods_price += Number(_data.goods_price) * Number(localData.count);
          _total_goods_discount_ticket += Number(_data.ticket_discount) * Number(localData.count);
        }

        if(_goods_meta_array.length > 0){
          _goods_meta = JSON.stringify(_goods_meta_array);
        }
      }

      //로컬에서 가져온 수량만 체크하면됨.
      if(buyState === types.buyState.BUY_STATE_ONLY_TICKET || buyState === types.buyState.BUY_STATE_TICKET_AND_GOODS){
        if(ticketData === undefined || ticketData.length === 0){
          return;
        }

        //ticket은 하나만 선택할 수 있다.
        const local_ticket_Data = req.body.data.select_tickets.find((value) => {
          return value.id === ticketData.ticket_id;
        });

        if(local_ticket_Data === undefined){
          return res.json({
            state: 'error',
            message: '로컬 데이터 에러',
            result: {
            }
          });
        };

        let _ticketInfo = {
          id: ticketData.ticket_id,
          price: ticketData.ticket_price,
          count: local_ticket_Data.count
        }

        _total_ticket_price += Number(ticketData.ticket_price) * Number(local_ticket_Data.count);

        if(_total_ticket_price === 0){
          //티켓 값이 0원이면 할인도 안된다.
          _total_goods_discount_ticket = 0;
        }

        //총 티켓가격에서 할인가 적용한다.
        _total_ticket_price = _total_ticket_price - _total_goods_discount_ticket;
        if(_total_ticket_price < 0){
          _total_ticket_price = 0;
        }

        let _total_price = _total_ticket_price + _total_goods_price;

        let orderObject = {
          project_id : _project_id,
          ticket_id : _ticketInfo.id,
          user_id: _user_id,
          state: types.order.ORDER_STATE_APP_PAY_WAIT,
          count: _ticketInfo.count,
          contact: _user_data.contact,
          price: _ticketInfo.price,
          total_price: _total_price,
          type_commision: types.order.ORDER_TYPE_COMMISION_WITHOUT_COMMISION,
          name: _user_data.name,
          email: _user_data.email,
          is_pick: '',
          account_name: '',
          order_story: '',
          answer: '',
          attended: '',
          fail_message: '',
          pay_method: '',
          goods_meta: _goods_meta,
          imp_meta: '{}',
          merchant_uid: _merchant_uid,
          created_at : date,
          updated_at: date
        };
        
        if(ticketData.sum_order_count >= ticketData.audiences_limit){
          return res.json({
            result: {
              state: res_state.soldout_ticket,
              ticket_id: ticketData.ticket_id,
              show_date: ticketData.show_date
            }
          });
        }
        else if(ticketData.sum_order_count + orderObject.count > ticketData.audiences_limit ){
          //overcount
          return res.json({
            result: {
              state: res_state.overcount_ticket,
              ticket_id: ticketData.ticket_id,
              show_date: ticketData.show_date
            }
          });
        }

        db.INSERT("INSERT INTO orders SET ?", orderObject, function(result_insert_order){
          let _orderId = result_insert_order.insertId;
          let _selectOrderQuery = "SELECT SUM(_order.count) AS order_count FROM orders AS _order WHERE _order.state < ? AND _order.ticket_id = ?;"
          _selectOrderQuery = mysql.format(_selectOrderQuery, [types.order.ORDER_STATE_PAY_END ,_ticketInfo.id]);

          // let _selectGoodsOrderQuery = "SELECT "

          db.SELECT(_selectOrderQuery, [], function(result_select_order){
            const _orderData = result_select_order[0];
            if(_orderData.order_count > ticketData.audiences_limit){
              //매진
              //이미 매진 되어있으면 취소한다.
              db.UPDATE("UPDATE orders AS _order SET state=? WHERE id=?", [types.order.ORDER_STATE_ERROR_TICKET_OVER_COUNT, _orderId], function(result_update_order){
                return res.json({
                  result: {
                    state: res_state.soldout_ticket,
                    ticket_id: ticketData.ticket_id,
                    show_date: ticketData.show_date
                  }
                });
              }, (error) => {
                return res.json({
                  state: res_state.error,
                  message: 'error',
                  result: {

                  }
                })
              });
            }else{

              //할인 정보가 있는지 조회
              let discountsQuery = "SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE project_id=?";
              discountsQuery = mysql.format(discountsQuery, _project_id);
              db.SELECT(discountsQuery, [], (discount_result) => {
                //매진이 안되어 있으면 굿즈를 샀는지 체크한다.
                if(buyState === types.buyState.BUY_STATE_TICKET_AND_GOODS){
                  //굿즈 insert 후 수량 체크
                  let goodsInsertQueryArray = [];
                  let goodsInsertOptionArray = [];
                  for(let i = 0 ; i < _goods_meta_array.length ; i++){
                    const goodsObject = _goods_meta_array[i];
      
                    let orders_goods_object = {
                      project_id: _project_id,
                      order_id: _orderId,
                      user_id: _user_id,
                      goods_id: goodsObject.id,
                      count: goodsObject.count,
                      created_at: date
                    };
      
                    let queryObject = {
                      key: i,
                      value: "INSERT INTO orders_goods SET ?;"
                    }
      
                    let insertOptionObject = {
                      key: i,
                      value: orders_goods_object
                    }
      
                    goodsInsertQueryArray.push(queryObject);
                    goodsInsertOptionArray.push(insertOptionObject);
                  }

                  db.INSERT_MULITPLEX(goodsInsertQueryArray, goodsInsertOptionArray, function(result_goods_insert){
                    if(result_goods_insert === undefined){
                      return res.json({
                        state: 'error',
                        message: 'goods_order insert error!',
                        result: {
                          // state: 'error',
                          // ticket_id: _data.id,
                          // show_date: _data.show_date
                        }
                      });
                    }

                    //굿즈도 수량이 되는지 체크한다.
                    let goodsCheckQueryTail = "";
                    let goodsCheckQueryID = [];
                    for(let i = 0 ; i < goodsInsertOptionArray.length ; i++){
                      let goodsOptionObject = goodsInsertOptionArray[i].value;
                      console.log(goodsOptionObject);
                      
                      if(i === 0){
                        goodsCheckQueryTail += "goods_id=? ";
                      }else{
                        goodsCheckQueryTail += "OR goods_id=?";
                      }

                      goodsCheckQueryID.push(goodsOptionObject.goods_id);
                    }

                    // let goods_count_check_query = "SELECT SUM(count) AS order_goods_count, goods_id FROM orders_goods WHERE " + goodsCheckQueryTail + " GROUP BY goods_id";
                    let goods_count_check_query = "SELECT SUM(count) AS order_goods_count, goods_id, limit_count, goods.title FROM orders_goods LEFT JOIN goods ON goods.id=orders_goods.goods_id WHERE " + goodsCheckQueryTail + " GROUP BY goods_id";
                    goods_count_check_query = mysql.format(goods_count_check_query, goodsCheckQueryID);

                    db.SELECT(goods_count_check_query, [], function(result_goods_count_check_select){
                      let isGoodsOverCounter = false;
                      let goodsOverCountObject = undefined;
                      for(let i = 0 ; i < result_goods_count_check_select.length ; i++){
                        const _result_goods_count_object = result_goods_count_check_select[i];
                        if(_result_goods_count_object.limit_count === 0){
                          //한도 개수가 0개면 무한 구매 가능 걍 continue
                          continue;
                        }else{
                          if(_result_goods_count_object.order_goods_count > _result_goods_count_object.limit_count){
                            //수량 초과
                            //초과했으면 추가 했던 goods는 삭제 해준다.
                            isGoodsOverCounter = true;
                            goodsOverCountObject = _result_goods_count_object;
                            break;
                          }
                        }
                        // if(limit_count _result_goods_count_object.order_goods_count)
                      }

                      if(isGoodsOverCounter){
                        //굿즈 수량 초과
                        db.UPDATE("UPDATE orders AS _order SET state=? WHERE id=?", [types.order.ORDER_STATE_ERROR_GOODS_OVER_COUNT, _orderId], function(result_update_order){
                          db.DELETE("DELETE FROM orders_goods WHERE order_id=?", _orderId, function(result_order_goods_delete){
                            return res.json({
                              result: {
                                state: res_state.overcount_goods,
                                goods_id: goodsOverCountObject.goods_id,
                                title: goodsOverCountObject.title
                              }
                            });
                          }, (error) => {
                            return res.json({
                              state: res_state.error,
                              message: error,
                              result:{}
                            })
                          });
                        }, (error) => {
                          return res.json({
                            state: res_state.error,
                            message: error,
                            result: {}
                          })
                        });
                        
                        return;
                      }

                      return res.json({
                        result: {
                          state: res_state.success,
                          order_id: _orderId,
                          total_ticket_price: _total_ticket_price,
                          total_discount_price: _total_goods_discount_ticket,
                          total_goods_price: _total_goods_price,
                          total_price: _total_price,
                          merchant_uid: _merchant_uid,
                          discount_info: [
                            ...discount_result
                          ]
                        }
                      });
                    });
                  }, (error) => {
                    return res.json({
                      state: res_state.error,
                      message: error,
                      result: {}
                    })
                  });
                  
                }else{
                  //최종 result
                  return res.json({
                    result: {
                      state: res_state.success,
                      order_id: _orderId,
                      total_ticket_price: _total_ticket_price,
                      total_discount_price: _total_goods_discount_ticket,
                      total_goods_price: _total_goods_price,
                      total_price: _total_price,
                      merchant_uid: _merchant_uid,
                      discount_info: [
                        ...discount_result
                      ]
                    }
                  });
                }
              })
            }
          });

          // console.log(result_insert_order);
        }, (error) => {
          return res.json({
            state: res_state.error,
            message: error,
            result:{}
          })
        });        
        
        //여기는 티켓, 티켓 & 굿즈 구매 프로세스
      }else if(buyState === types.buyState.BUY_STATE_ONLY_GOODS){
        //온니 굿즈
        let _total_price = _total_goods_price;
        let orderObject = {
          project_id : _project_id,
          ticket_id : null,
          user_id: _user_id,
          state: types.order.ORDER_STATE_APP_PAY_WAIT,
          count: 0,
          contact: _user_data.contact,
          price: 0,
          total_price: _total_price,
          type_commision: types.order.ORDER_TYPE_COMMISION_WITHOUT_COMMISION,
          name: _user_data.name,
          email: _user_data.email,
          is_pick: '',
          account_name: '',
          order_story: '',
          answer: '',
          attended: '',
          fail_message: '',
          goods_meta: _goods_meta,
          imp_meta: '{}',
          created_at : date,
          updated_at: date
        };

        db.INSERT("INSERT INTO orders SET ?", orderObject, function(result_insert_order){
          let _orderId = result_insert_order.insertId;
          let goodsInsertQueryArray = [];
          let goodsInsertOptionArray = [];
          for(let i = 0 ; i < _goods_meta_array.length ; i++){
            const goodsObject = _goods_meta_array[i];

            let orders_goods_object = {
              project_id: _project_id,
              order_id: _orderId,
              user_id: _user_id,
              goods_id: goodsObject.id,
              count: goodsObject.count,
              created_at: date
            };

            let queryObject = {
              key: i,
              value: "INSERT INTO orders_goods SET ?;"
            }

            let insertOptionObject = {
              key: i,
              value: orders_goods_object
            }

            goodsInsertQueryArray.push(queryObject);
            goodsInsertOptionArray.push(insertOptionObject);
          }

          db.INSERT_MULITPLEX(goodsInsertQueryArray, goodsInsertOptionArray, function(result_goods_insert){
            if(result_goods_insert === undefined){
              return res.json({
                state: 'error',
                message: 'goods_order insert error!',
                result: {
                  // state: 'error',
                  // ticket_id: _data.id,
                  // show_date: _data.show_date
                }
              });
            }

            //굿즈도 수량이 되는지 체크한다.
            let goodsCheckQueryTail = "";
            let goodsCheckQueryID = [];
            for(let i = 0 ; i < goodsInsertOptionArray.length ; i++){
              let goodsOptionObject = goodsInsertOptionArray[i].value;
              console.log(goodsOptionObject);
              
              if(i === 0){
                goodsCheckQueryTail += "goods_id=? ";
              }else{
                goodsCheckQueryTail += "OR goods_id=?";
              }

              goodsCheckQueryID.push(goodsOptionObject.goods_id);
            }

            // let goods_count_check_query = "SELECT SUM(count) AS order_goods_count, goods_id FROM orders_goods WHERE " + goodsCheckQueryTail + " GROUP BY goods_id";
            let goods_count_check_query = "SELECT SUM(count) AS order_goods_count, goods_id, limit_count, goods.title FROM orders_goods LEFT JOIN goods ON goods.id=orders_goods.goods_id WHERE " + goodsCheckQueryTail + " GROUP BY goods_id";
            goods_count_check_query = mysql.format(goods_count_check_query, goodsCheckQueryID);
            // console.log(goods_count_check_query);
            db.SELECT(goods_count_check_query, [], function(result_goods_count_check_select){
              console.log(result_goods_count_check_select);
              let isGoodsOverCounter = false;
              let goodsOverCountObject = undefined;
              for(let i = 0 ; i < result_goods_count_check_select.length ; i++){
                const _result_goods_count_object = result_goods_count_check_select[i];
                if(_result_goods_count_object.limit_count === 0){
                  //한도 개수가 0개면 무한 구매 가능 걍 continue
                  continue;
                }else{
                  if(_result_goods_count_object.order_goods_count > _result_goods_count_object.limit_count){
                    //수량 초과
                    //초과했으면 추가 했던 goods는 삭제 해준다.
                    isGoodsOverCounter = true;
                    goodsOverCountObject = _result_goods_count_object;
                    break;
                  }
                }
                // if(limit_count _result_goods_count_object.order_goods_count)
              }

              if(isGoodsOverCounter){
                //굿즈 수량 초과
                db.UPDATE("UPDATE orders AS _order SET state=? WHERE id=?", [types.order.ORDER_STATE_ERROR_GOODS_OVER_COUNT, _orderId], function(result_update_order){
                  db.DELETE("DELETE FROM orders_goods WHERE order_id=?", _orderId, function(result_order_goods_delete){
                    return res.json({
                      result: {
                        state: res_state.overcount_goods,
                        goods_id: goodsOverCountObject.goods_id,
                        title: goodsOverCountObject.title
                      }
                    });
                  }, (error) => {
                    return res.json({
                      state: res_state.error,
                      message: error,
                      result:{}
                    })
                  });
                }, (error) => {
                  return res.json({
                    state: res_state.error,
                    message: error,
                    result:{}
                  })
                });
                
                return;
              }

              return res.json({
                result: {
                  state: res_state.success,
                  order_id: _orderId,
                  total_ticket_price: 0,
                  total_discount_price: 0,
                  total_goods_price: _total_goods_price,
                  total_price: _total_price,
                  discount_info: []
                }
              });
            });
          }, (error) => {
            return res.json({
              state: res_state.error,
              message: error,
              result:{}
            })
          })
        }, (error) => {
          return res.json({
            state: res_state.error,
            message: error,
            result:{}
          })
        });
      }

    });

  });
});

module.exports = router;