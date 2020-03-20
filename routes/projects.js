var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment = require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');

router.post('/detail', function(req, res) {
  const project_id = req.body.data.project_id;
  
  db.SELECT("SELECT project.id AS project_id, user.id AS user_id, user.name, user.profile_photo_url, user.introduce, project.title, project.poster_renew_url, project.poster_url, project.story, detailed_address, concert_hall, isDelivery FROM projects AS project" +
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

router.post('/comments', function(req, res) {
  let project_id = req.body.data.project_id;
  // let call_count = 3;

  db.SELECT("SELECT comment.id AS comment_id, nick_name, profile_photo_url, commentscomment.commentable_id, comment.contents, count(commentscomment.id) AS comments_comment_count FROM comments AS comment" + 
            " LEFT JOIN users AS user" +
            " ON comment.user_id=user.id" +
            " LEFT JOIN comments AS commentscomment" +
            " ON comment.id=commentscomment.commentable_id" +
            " WHERE comment.commentable_id=?" +
            " AND comment.commentable_type='App\\\\Models\\\\Project'" + 
            " GROUP BY comment.id" +
            " ORDER BY comment.id DESC", [project_id], function(result){
              res.json({
                result
              });
            });

  /*
  db.SELECT("SELECT comment.id AS comment_id, nick_name, profile_photo_url, commentable_id, contents FROM comments AS comment" + 
            " LEFT JOIN users AS user" +
            " ON comment.user_id=user.id" +
            " WHERE comment.commentable_id=?" +
            " AND comment.commentable_type='App\\\\Models\\\\Project'" + 
            " ORDER BY comment.id DESC", [project_id], function(result){
              res.json({
                result
              });
            });
            */
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

//대댓글
router.post('/comments/comment', function(req, res) {
  // let comment_id = req.params.id;
  let comment_id = req.body.data.comment_id;

  db.SELECT("SELECT comment.id AS comment_id, nick_name, profile_photo_url, commentable_id, contents FROM comments AS comment" + 
            " LEFT JOIN users AS user" +
            " ON comment.user_id=user.id" +
            " WHERE comment.commentable_id=?" +
            " AND comment.commentable_type='App\\\\Models\\\\Comment'" + 
            " ORDER BY comment.id DESC", [comment_id], function(result){
            // " ORDER BY comment.id DESC LIMIT "+call_count, [project_id], function(result){
              res.json({
                result
              });
            });
});

router.post('/comments/count', function(req, res) {
  let project_id = req.body.data.project_id;
  let call_count = req.body.data.call_comment_count;

  db.SELECT("SELECT comment.id AS comment_id, nick_name, profile_photo_url, commentscomment.commentable_id, comment.contents, count(commentscomment.id) AS comments_comment_count FROM comments AS comment" + 
            " LEFT JOIN users AS user" +
            " ON comment.user_id=user.id" +
            " LEFT JOIN comments AS commentscomment" +
            " ON comment.id=commentscomment.commentable_id" +
            " WHERE comment.commentable_id=?" +
            " AND comment.commentable_type='App\\\\Models\\\\Project'" + 
            " GROUP BY comment.id" +
            " ORDER BY comment.id DESC LIMIT "+call_count, [project_id], function(result){
              res.json({
                result
              });
            });
  // db.SELECT("SELECT comment.id AS comment_id, nick_name, profile_photo_url, commentable_id, contents FROM comments AS comment" + 
  //           " LEFT JOIN users AS user" +
  //           " ON comment.user_id=user.id" +
  //           " WHERE comment.commentable_id=?" +
  //           " AND comment.commentable_type='App\\\\Models\\\\Project'" + 
  //           " ORDER BY id DESC LIMIT "+call_count, [project_id], function(result){
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

function getStateTicketAmountCheck(ticketData, localData){
  const _data = ticketData;
  if(_data.sum_order_count === null){
    return res_state.success;
  }
  
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

//티켓 구매
router.post("/buy/temporary/ticket", function(req, res){
  //티켓 id, 수량 , 굿즈 id, 수량 
  //test//
  return res.json({
    result: {
      state: 'success',
      order_id: 2
      // ticket_id: _data.id,
      // show_date: _data.show_date
    }
  });
  ////////
  let state = res_state.init;
  let makeTicketIdArray = [];
  let queryWhereOr = "";
  const _project_id = req.body.data.project_id;
  const _user_id = req.body.data.user_id;

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
    ticketQuery = "SELECT ticket.id AS ticket_id, ticket.price AS ticket_price, audiences_limit, buy_limit, ticket.project_id, sum(_order.count) AS sum_order_count, show_date FROM tickets AS ticket LEFT JOIN orders AS _order ON _order.ticket_id=ticket.id WHERE "+queryWhereOr+" GROUP BY ticket.id;";
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
  }

  let query = ticketQuery+goodsQuery;

  //order의 count와, ticket의 limite
  db.SELECT_MULITPLEX(query, function(result){
    //없으면 undefined
    if(result === undefined || result.length === 0){
      return res.json({
        state: 'error',
        message: 'DB 조회 에러!',
        result: {
        }
      });
    }

    var date = moment().format('YYYY-MM-DD HH:mm:ss');
    
    let _total_ticket_price = 0;
    let _total_goods_price = 0;
    let _total_goods_discount_ticket = 0;

    let _goods_meta_array = [];
    let _goods_meta = '{}'

    let _ticketInfo = {
      id: null,
      price: 0,
      count: 0
    }
    // resBuyTicketGoods(result, req, res);
    //티켓 데이터 셋팅
    let ticketData = undefined;
    let goodsData = undefined;
    if(buyState === types.buyState.BUY_STATE_TICKET_AND_GOODS){
      ticketData = result[0];  //위에 query 순사가 바뀌면 data 순서도 바껴야 함.
      goodsData = result[1];
    }else if(buyState === types.buyState.BUY_STATE_ONLY_TICKET){
      ticketData = result;
    }else if(buyState === types.buyState.BUY_STATE_ONLY_GOODS){
      goodsData = result;
    }

    if(buyState === types.buyState.BUY_STATE_ONLY_TICKET || buyState === types.buyState.BUY_STATE_TICKET_AND_GOODS){
      if(ticketData === undefined){
        return;
      }

      for(let i = 0 ; i < ticketData.length ; i++){
        const _data = ticketData[i];//ticket, goods가 다 있으면 query요청 순서에 따라서 첫번째다
      
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

        state = getStateTicketAmountCheck(_data, localData);
        if(state !== res_state.success){
          return res.json({
            result: {
              state: state,
              ticket_id: _data.id,
              show_date: _data.show_date
            }
          });
        }

        //구매 가능한 상황임
        _ticketInfo.id = _data.ticket_id;
        _ticketInfo.price = _data.ticket_price;
        _ticketInfo.count = localData.count;

        _total_ticket_price += Number(_data.ticket_price) * Number(localData.count);
      }
    }

    //굿즈 데이터 셋팅
    if(buyState === types.buyState.BUY_STATE_ONLY_GOODS || buyState === types.buyState.BUY_STATE_TICKET_AND_GOODS){
      if(goodsData === undefined){
        return;
      }

      //굿즈는 여러개 일 수도 있다.
      // console.log(goodsData.length);
     
      for(let i = 0 ; i < goodsData.length ; i++ ){
        const _data = goodsData[i];
        const localData = req.body.data.select_goods.find((value) => {
          return value.id === _data.goods_id;
        });

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

    //총 티켓가격에서 할인가 적용한다.
    _total_ticket_price = _total_ticket_price - _total_goods_discount_ticket;
    if(_total_ticket_price < 0){
      _total_ticket_price = 0;
    }

    let _total_price = _total_ticket_price + _total_goods_price;

    let userInfoQuery = "SELECT email, name, contact FROM users WHERE id=?";
    userInfoQuery = mysql.format(userInfoQuery, req.body.data.user_id);

    db.SELECT(userInfoQuery, [], (result) => {
      if(result === undefined){
        return res.json({
          state: 'error',
          message: 'DB 조회 에러!',
          result: {
          }
        });
      }

      const _data = result[0];
      let orderObject = {
        project_id : _project_id,
        ticket_id : _ticketInfo.id,
        user_id: _user_id,
        state: types.order.ORDER_STATE_APP_PAY_WAIT,
        count: _ticketInfo.count,
        contact: _data.contact,
        price: _ticketInfo.price,
        total_price: _total_price,
        type_commision: types.order.ORDER_TYPE_COMMISION_WITHOUT_COMMISION,
        name: _data.name,
        email: _data.email,
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

      // console.log(orderObject);

      db.INSERT("INSERT INTO orders SET ?;", orderObject, function(result){
        console.log("success!!!!!!!");
        console.log(result);
        if(result === undefined){
          return res.json({
            state: 'error',
            message: 'order insert error!',
            result: {
              // state: 'error',
              // ticket_id: _data.id,
              // show_date: _data.show_date
            }
          });
        }else{
          let _orderId = result.insertId;

          //굿즈 아이템이 있으면 최종적으로 orders_goods 에도 셋팅한다.
          //orders_goods START
          if(_goods_meta_array.length > 0){
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

            db.INSERT_MULITPLEX(goodsInsertQueryArray, goodsInsertOptionArray, function(result){
              if(result === undefined){
                return res.json({
                  state: 'error',
                  message: 'goods_order insert error!',
                  result: {
                    // state: 'error',
                    // ticket_id: _data.id,
                    // show_date: _data.show_date
                  }
                });
              }else{
                return res.json({
                  result: {
                    state: 'success',
                    order_id: _orderId
                    // ticket_id: _data.id,
                    // show_date: _data.show_date
                  }
                });
              }
              console.log(result);
              
            });
            //orders_goods END
            // _goods_meta_array
          }else{
            //굿즈가 없을때
            return res.json({
              result: {
                state: 'success',
                order_id: _orderId
                // ticket_id: _data.id,
                // show_date: _data.show_date
              }
            });
          }
        }        
      });
    });
  });  
});

/*
router.post("/buy/temporary/ticket", function(req, res){
  //티켓 id, 수량 , 굿즈 id, 수량 
  
  let makeTicketIdArray = [];
  let queryWhereOr = "";
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
  if(makeTicketIdArray.length > 0){
    ticketQuery = "SELECT ticket.id AS ticket_id, audiences_limit, buy_limit, ticket.project_id, sum(_order.count) AS sum_order_count, show_date FROM tickets AS ticket LEFT JOIN orders AS _order ON _order.ticket_id=ticket.id WHERE "+queryWhereOr+" GROUP BY ticket.id;";
    ticketQuery = mysql.format(ticketQuery, makeTicketIdArray);
  }
  //쿼리문 만들기
  
  //goods의 개수를 가져와야함.
  let goodsQuery = "";
  if(makeGoodsIdArray.length > 0){
    // goodsQuery = "SELECT id, goods_meta, state FROM goods WHERE project_id=? AND state<=? AND goods_meta LIKE ?;";
    goodsQuery = "SELECT _goods.id AS goods_id, limit_count, sum(order_goods.count) AS order_goods_count FROM goods AS _goods LEFT JOIN orders_goods AS order_goods ON order_goods.goods_id=_goods.id WHERE " + queryGoodsTail + " GROUP BY _goods.id";
    //goodsQuery = mysql.format(goodsQuery, [project_id, types.order.ORDER_STATE_PAY_END, "%\"id\":"+goods_id+"%"]);
    goodsQuery = mysql.format(goodsQuery, makeGoodsIdArray);
  }
  console.log(req.body.data.select_goods);
  
  console.log(goodsQuery);
  let query = ticketQuery+goodsQuery;
  
  // let query = "SELECT id, goods_meta, state FROM orders WHERE project_id=? AND state<=? AND goods_meta LIKE ?";
  // query = mysql.format(query, [project_id, types.order.ORDER_STATE_PAY_END, "%\"id\":"+goods_id+"%"]);
  
  // return;
  //order의 count와, ticket의 limite
  db.SELECT_MULITPLEX(query, function(result){
    //없으면 undefined
    console.log(result);
    // return;
    let insertQueryArray = [];
    let insertOptionArray = [];
    var date = moment().format('YYYY-MM-DD HH:mm:ss');
    var total_price = 0;
    for(let i = 0 ; i < result.length ; i++){
      const _result = result[i];
      console.log("1!!?!?!??!!");
      console.log(_result.length);
      for(let j = 0 ; j < _result.length ; j++){
        const _data = _result[j];
        // console.log("1!!?!?!??!!");
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

          let ticketTotalPrice = _data.price * localData.count;

          console.log("ticketinfo!!");
          console.log(ticketTotalPrice);
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

      // let optionObject = {
      //   price: i,
      //   project_id : req.body.data.project_id,
      //   ticket_id : localData.id,
      //   user_id: req.body.data.user_id,
      //   state: types.order.ORDER_STATE_APP_PAY_WAIT,
      //   count: localData.count,
      //   contact: 0,
      //   total_price: 0,
      //   type_commision: 1,
      //   name: '이름',
      //   email: 'email',
      //   is_pick: '',
      //   account_name: '',
      //   order_story: '',
      //   answer: '',
      //   attended: '',
      //   fail_message: '',
      //   goods_meta: '{}',
      //   imp_meta: '{}',
      //   created_at : date,
      //   updated_at: date
      // };

      // // insertQuery += "INSERT INTO orders SET ?;"
      // let queryObject = {
      //   key: i,
      //   value: "INSERT INTO orders SET ?;"
      // }

      // let insertOptionObject = {
      //   key: i,
      //   value: optionObject
      // }

      // insertQueryArray.push(queryObject);
      // insertOptionArray.push(insertOptionObject);
    }

    return;
    //여기까지 오면 일단 티켓은 성공임.
    //INSERT ORDER 생성
    db.INSERT_MULITPLEX(insertQueryArray, insertOptionArray, function(result){
    console.log('OH!!!?!?');
      if(result === undefined){
        return res.json({
          state: 'error',
          message: 'order insert error!',
          result: {
            // state: 'error',
            // ticket_id: _data.id,
            // show_date: _data.show_date
          }
        });
      }else{
        return res.json({
          result: {
            state: 'success',
            // ticket_id: _data.id,
            // show_date: _data.show_date
          }
        });
      }
      console.log(result);
      
    })

  });  
});
*/
/*
router.post("/buy/temporary/ticket", function(req, res){
  //티켓 id, 수량 , 굿즈 id, 수량 
  
  console.log(req.body.data.select_tickets);
  //선구매
  //
  //쿼리문 만들기
  
  let makeTicketIdArray = [];
  let query = '';
  let queryWhereOr = "";
  for(let i = 0 ; i < req.body.data.select_tickets.length ; i++){
    const ticketObject = req.body.data.select_tickets[i];
    
    if(i === req.body.data.select_tickets.length - 1){
      queryWhereOr+="ticket.id=?";
    }else{
      queryWhereOr+="ticket.id=? OR ";
    }
    
    makeTicketIdArray.push(ticketObject.id);
  };
  query = "SELECT ticket.id AS id, audiences_limit, buy_limit, ticket.project_id, sum(_order.count) AS sum_order_count, show_date FROM tickets AS ticket LEFT JOIN orders AS _order ON _order.ticket_id=ticket.id WHERE "+queryWhereOr+" GROUP BY ticket.id";
  
  //order의 count와, ticket의 limite
  db.SELECT(query, makeTicketIdArray, function(result){
    
    console.log(result);
    let insertQueryArray = [];
    let insertOptionArray = [];
    var date = moment().format('YYYY-MM-DD HH:mm:ss');
    for(let i = 0 ; i < result.length ; i++){
      const _data = result[i];

      const localData = req.body.data.select_tickets.find((value) => {
        return value.id === _data.id;
      });

      if(localData === undefined){
        return res.json({
          state: 'error',
          message: '로컬 데이터 에러',
          result: {
          }
        });
      };

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

      let optionObject = {
        price: i,
        project_id : req.body.data.project_id,
        ticket_id : localData.id,
        user_id: req.body.data.user_id,
        state: types.order.ORDER_STATE_APP_PAY_WAIT,
        count: localData.count,
        contact: 0,
        total_price: 0,
        type_commision: 1,
        name: '이름',
        email: 'email',
        is_pick: '',
        account_name: '',
        order_story: '',
        answer: '',
        attended: '',
        fail_message: '',
        goods_meta: '{}',
        imp_meta: '{}',
        created_at : date,
        updated_at: date
      };

      // insertQuery += "INSERT INTO orders SET ?;"
      let queryObject = {
        key: i,
        value: "INSERT INTO orders SET ?;"
      }

      let insertOptionObject = {
        key: i,
        value: optionObject
      }

      insertQueryArray.push(queryObject);
      insertOptionArray.push(insertOptionObject);
    }

    //여기까지 오면 일단 티켓은 성공임.
    //INSERT ORDER 생성
    db.INSERT_MULITPLEX(insertQueryArray, insertOptionArray, function(result){
    console.log('OH!!!?!?');
      if(result === undefined){
        return res.json({
          state: 'error',
          message: 'order insert error!',
          result: {
            // state: 'error',
            // ticket_id: _data.id,
            // show_date: _data.show_date
          }
        });
      }else{
        return res.json({
          result: {
            state: 'success',
            // ticket_id: _data.id,
            // show_date: _data.show_date
          }
        });
      }
      console.log(result);
      
    })

  });  
});
*/

module.exports = router;