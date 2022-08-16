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

//slack
const slack = use('lib/slack');
////////////
// const util = require('./lib/util.js');

router.post("/mainthumb/list", function(req, res){
  let queryTicketing = mysql.format("SELECT project.poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM main_thumbnails AS main_thumbnail LEFT JOIN projects AS project ON project.id=main_thumbnail.project_id WHERE main_thumbnail.magazine_id IS NULL AND main_thumbnail.target_id IS NULL ORDER BY RAND()", []);

  db.SELECT(queryTicketing, {}, (result_select_ticketing) => {

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
})

router.post("/ticketing/list", function(req, res){
  // const user_id = req.body.data.user_id;
  var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let queryLikeTicketing = mysql.format("SELECT project.poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project WHERE project.state=? AND project.funding_closing_at > ? AND project.event_type_sub<? AND project.is_secret=?", [types.project.STATE_APPROVED, nowDate, types.project.EVENT_TYPE_SUB_SECRET_PROJECT, false]);

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
    var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    // console.log(nowDate.toString());

    mannayoQuery = mysql.format("SELECT project.poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project WHERE project.state=? AND funding_closing_at > ? AND project.event_type_sub < ? AND project.is_secret=? ORDER BY project.id DESC LIMIT ? OFFSET ?", [types.project.STATE_APPROVED, nowDate, types.project.EVENT_TYPE_SUB_SECRET_PROJECT, false, TAKE, skip]);

  }else if(listType === types.project_list_type.PROJECT_LIST_FIND){
    const findWord = "%"+req.body.data.findWord+"%";

    mannayoQuery = mysql.format("SELECT poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id WHERE project.state=? AND (project.title LIKE ? OR hash_tag1 LIKE ? OR hash_tag2 LIKE ? OR categorie.title LIKE ? OR detailed_address LIKE ?) ORDER BY project.id DESC LIMIT ? OFFSET ?", [types.project.STATE_APPROVED, findWord, findWord, findWord, findWord, findWord, TAKE, skip]);
  }else if(listType === types.project_list_type.PROJECT_LIST_ALL){
    var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    // console.log(nowDate.toString());

    mannayoQuery = mysql.format("SELECT project.poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project WHERE project.state=? AND event_type_sub<>? AND project.is_secret=? ORDER BY project.funding_closing_at DESC LIMIT ? OFFSET ?", [types.project.STATE_APPROVED, types.project.EVENT_TYPE_SUB_SECRET_PROJECT, false,TAKE, skip]);
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
  
  db.UPDATE("UPDATE orders AS _order SET answer=? WHERE _order.id=?;", [surveyDataArray, order_id], function(result_order){
    // console.log(result_order);
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

// function getTotalTicketLimitCount()
// {
//   $tickets = $this->tickets;
//   $limitTicketCount = 0;
//   foreach($tickets as $ticket){
//     $limitTicketCount += $ticket->audiences_limit;
//   }

//   return $limitTicketCount;
// }

getMainExplain = (project_target, pledged_amount, type, ticket_limit_count, funding_closing_at, picking_closing_at, event_type) => {

  //클라에서 조합해서 쓰기때문에 해당 문구는 이슈 있을때만 수정한다. 공구 이벤트에 문구 이슈가 있어서 공구 이벤트 강제 셋팅
  if(event_type !== types.project.EVENT_TYPE_GROUP_BUY){
    return '';
  }

  let pledgedTarget = "원";
  //인원, 금액 결정
  if(project_target == "people")
  {
    pledgedTarget = "명";
  }

  // pledgedTarget = pledged_amount + pledgedTarget;
  pledgedTarget = Util.getNumberWithCommas(pledged_amount) + pledgedTarget;
  if(type == "sale")
  {
    //즉시 결제면 무조건 명수로 나온다.
    pledgedTarget = Util.getNumberWithCommas(ticket_limit_count)+"명";
  }

  let maxText = '';
  let textEnd = '이 참여할 수 있는 이벤트 입니다.';
  if(type == "funding")
  {
    maxText = '최소 ';
    textEnd = '이 모여야 진행되는 이벤트입니다.';
  }

  let fundingEndTime = moment_timezone(funding_closing_at).format('YYYY년 MM월 DD일');

  //if($this->type == "pick")
  if(event_type === types.project.EVENT_TYPE_PICK_EVENT){

    let pickingEndTime = moment_timezone(picking_closing_at).format('YYYY년 MM월 DD일');
    let mainExplain = '';
    const isPickingFinish = Util.isExpireTime(picking_closing_at);
    const isClosing = Util.isExpireTime(funding_closing_at);

    if(isPickingFinish)
    {
      mainExplain = "추첨이 완료되어 이벤트가 종료되었습니다.";
    }
    else if(isClosing)
    {
      mainExplain = pickingEndTime + "까지 추첨이 진행됩니다.";
    }
    else
    {
      mainExplain = fundingEndTime + '까지 신청 가능합니다.';
    }

    return mainExplain;
  }

  if(event_type === types.project.EVENT_TYPE_GROUP_BUY)
  {
    return fundingEndTime + '까지 구매 가능합니다.';
  }

  //2018년 8월 31일 까지 최소 100명이 모여야 진행되는 이벤트입니다.(최대 200명) //참여할 수 있는 이벤트 입니다.

  return fundingEndTime + '까지 ' + maxText + pledgedTarget + textEnd;
}

function isOldProject(poster_url){
  if(poster_url)
  {
    return true;
  }

  return false;
}

function getTotalFundingAmount(orders, project_target){
  let totalFundingAmount = 0;

  if(project_target == "people")
  {
    // 이건 사람수 오더의 count로 체크
    // totalFundingAmount = $this->getTotalTicketOrderCount();
    // $totalBuyCount = 0;
    for(let i = 0 ; i < orders.length ; i++){
      const orderData = orders[i];
      totalFundingAmount += orderData.count;
    }
  }
  else
  {
    for(let i = 0 ; i < orders.length ; i++){
      const orderData = orders[i];
      const totalPrice = orderData.total_price;

      let commission = 0;

      if(orderData.ticket_price)
      {
        if(orderData.ticket_price > 0)
        {
          if(orderData.type_commision === types.order.ORDER_TYPE_COMMISION_WITHOUT_COMMISION){
            commission = 0;
          }else{
            commission = orderData.count * 500;
          }
        }
      }

      totalFundingAmount += totalPrice - commission;
    }
  }

  return totalFundingAmount;
}

function isEventTypeGroupBuy(event_type){
  return event_type === types.project.EVENT_TYPE_GROUP_BUY;
}

getNowAmount = (type, funded_amount, funding_closing_at, event_type, project_target, poster_url, sale_start_at, orders, picking_closing_at) => {
  //구매 인원 수
  //현재 91명 신청 완료
  let nowAmount = "";

  if(isOldProject(poster_url))
  {
    //예전 프로젝트
    if(type == 'sale')
    {
      nowAmount = "현재 " + Util.getNumberWithCommas(funded_amount) + "명 참여 가능";
    }
    else
    {
      nowAmount = "현재 " + Util.getNumberWithCommas(funded_amount) + "원 모임";
    }
  }
  else
  {
    if(!Util.isSaling(sale_start_at))
    {
      nowAmount = "오픈 예정입니다.";//오픈예정 임시코드
    }
    else
    {
      if(type == 'sale')
      {
        if(isEventTypeGroupBuy(event_type))
        {
          nowAmount = "현재 구매 가능";
          if(Util.isExpireTime(funding_closing_at))
          {
            nowAmount = "판매가 종료되었습니다.";
          }
        }else{
          nowAmount = "현재 참여 가능";
          if(Util.isExpireTime(funding_closing_at))
          {
            nowAmount = "티켓팅이 마감되었습니다.";
          }
        }

        // nowAmount = "현재 참여 가능";
        // if(Util.isExpireTime(funding_closing_at))
        // {
        //   nowAmount = "티켓팅이 마감되었습니다.";
        // }
      }
      else if(event_type === types.project.EVENT_TYPE_PICK_EVENT)
      {
        nowAmount = "현재 신청 가능";

        // if($this->isFinishedAndPickingFinished())
        const isPickingFinish = Util.isFinishedAndPickingFinished(picking_closing_at, funding_closing_at);
        if(isPickingFinish)
        {
          nowAmount = "추첨이 끝났습니다.";
        }
        else if(Util.isExpireTime(funding_closing_at))
        {
          nowAmount = "추첨중 입니다.";
        }
      }
      else
      {
        // let totalFundingAmount = this.getTotalFundingAmount();
        let totalFundingAmount = getTotalFundingAmount(orders, project_target);
        nowAmount = "현재 " + Util.getNumberWithCommas(totalFundingAmount) + "원 모임";

        if(project_target == "people")
        {
          nowAmount = "신청자 " + Util.getNumberWithCommas(totalFundingAmount) + "명";
        }
      }
    }
  }

  return nowAmount;
}

function getProgress(type, pledged_amount, funded_amount, poster_url, project_target, orders){
  //티켓팅과 펀딩으로 구분.
  if(type == 'sale')
  {
    return 0;
  }


  //펀딩일때
  if (pledged_amount > 0)
  {
    if(isOldProject(poster_url))
    {
      return ((funded_amount / pledged_amount) * 100);
    }

    return ((getTotalFundingAmount(orders, project_target) / pledged_amount) * 100);
  }

  return 0;
}

router.post('/detail', function(req, res) {
  const project_id = req.body.data.project_id;
  const querySelect = mysql.format("SELECT project_type, project.id AS project_id, user.id AS user_id, user.name, user.profile_photo_url, user.introduce, project.title, project.poster_renew_url, project.poster_url, project.story, detailed_address, concert_hall, isDelivery, project.type, city.name AS city, temporary_date FROM projects AS project LEFT JOIN cities AS city ON city.id=project.city_id LEFT JOIN users AS user ON project.user_id=user.id WHERE project.id=?", project_id);
  
  //project_type
  db.SELECT(querySelect, {}, function(result){
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '없는 프로젝트 입니다.',
        result:{}
      })
    }

    let data = result[0];

    if(data.project_type === 'artist'){
      data.project_type = "아티스트";
    }else{
      data.project_type = "크리에이터";
    }

    res.json({
      result:{
        state: res_state.success,
        data: {
          ...data
        }
      }
    });
  });
});

router.post('/tickets', function(req, res) {
  let project_id = req.body.data.project_id;

  let querySelect = mysql.format("SELECT is_quantity_show, categories_ticket.title AS categories_ticket_title, ticket.id, audiences_limit, buy_limit, ticket.price, show_date, category, sum(`order`.count) AS order_count FROM tickets AS ticket LEFT JOIN `orders` AS `order` ON `order`.ticket_id=ticket.id AND `order`.state<? LEFT JOIN categories_tickets AS categories_ticket ON categories_ticket.id=ticket.category WHERE ticket.project_id=? GROUP BY ticket.id ORDER BY ticket.show_date DESC", [types.order.ORDER_STATE_PAY_END, project_id]);

  db.SELECT(querySelect, {}, function(result){
              res.json({
                result
              });
            });
  
  // db.SELECT("SELECT category, ticket.id, audiences_limit, buy_limit, ticket.price, show_date, category, sum(`order`.count) AS order_count FROM tickets AS ticket" + 
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
        // console.log(result_insert_support);
        return res.json({
          result:{
            state: 'success'
          }
        });
        /*
        db.UPDATE("UPDATE orders AS _order SET supporter_id=? WHERE id=?", [result_insert_support.insertId, _data.order_id], (result) => {
          return res.json({
            result:{
              state: 'success'
            }
          });
        });
        */
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

router.post("/get/eventtypesub", function(req, res){
  const project_id = req.body.data.project_id;

  let querySelect = mysql.format("SELECT event_type_sub FROM projects WHERE id=?", [project_id]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        event_type_sub: result[0].event_type_sub
      }
    })
  })
});

router.post("/ticket/showdate", function(req, res){
  //showdate가 0000이면 카테고리로 셋팅
  const ticket_id = req.body.data.ticket_id;
  const querySelect = mysql.format("SELECT category, show_date, categories_ticket.title AS categories_ticket_title FROM tickets AS ticket LEFT JOIN categories_tickets AS categories_ticket ON categories_ticket.id=ticket.category WHERE ticket.id=?", [ticket_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '티켓 정보가 없습니다.',
        result: {}
      })
    }

    const data = result[0];
    return res.json({
      result:{
        state: res_state.success,
        category: data.category,
        show_date: data.show_date,
        categories_ticket_title: data.categories_ticket_title
      }
    })
  });
});

router.post("/any/info", function(req, res){
  const project_id = req.body.data.project_id;

  const querySelect = mysql.format("SELECT project.state, store.id AS store_id, store.title AS store_title, project.concert_hall, project.id AS project_id, project.user_id, project.title, project.project_type, project.temporary_date, city.name AS city_name, project.poster_renew_url, project.poster_url, project.description, project.alias, project.funding_closing_at FROM projects AS project LEFT JOIN stores AS store ON project.user_id=store.user_id LEFT JOIN cities AS city ON city.id=project.city_id WHERE project.id=? GROUP BY project.id", [project_id]);

  // const querySelect = mysql.format("SELECT project.concert_hall, project.id AS project_id, project.user_id, title, project_type, temporary_date, city.name AS city_name, poster_renew_url, poster_url, description, alias, funding_closing_at FROM projects AS project LEFT JOIN cities AS city ON city.id=project.city_id WHERE project.id=? GROUP BY project.id", [project_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '프로젝트 검색 조회 에러',
        result: {}
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        data: result[0]
      }
    })
  })
});

router.post("/any/ticket/showdate", function(req, res){
  const project_id = req.body.data.project_id;

  const querySelect = mysql.format("SELECT show_date FROM tickets AS ticket WHERE project_id=? ORDER BY show_date", [project_id])

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/any/ticket/price", function(req, res){
  const project_id = req.body.data.project_id;
  const language_code = req.body.data.language_code;

  const querySelect = mysql.format("SELECT price FROM tickets WHERE project_id=? ORDER BY price", [project_id])

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result,
        language_code: language_code
      }
    })
  })
})

router.post("/register", function(req, res){
  
  const name = req.body.data.name;
  const email = req.body.data.email;
  const contact = req.body.data.contact;
  const category = req.body.data.select_value;
  const user_id = req.body.data.user_id;
  var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let event_applys = {
    user_id: user_id,
    name: name,
    email: email,
    contact: contact,
    category: category,
    created_at: date
  }

  db.INSERT("INSERT INTO event_applys SET ?;", event_applys, function(result){

    const list= [
      {
        value: 'meeting',
        show_value: '팬미팅'
      },
      {
        value: 'festival',
        show_value: '팬페스티벌'
      },
      {
        value: 'autograph',
        show_value: '팬사인회'
      },
      {
        value: 'lecture',
        show_value: '강의/강연'
      },
      {
        value: 'show',
        show_value: '공연'
      },
      {
        value: 'screening',
        show_value: '상영회'
      },
      {
        value: 'Raffle',
        show_value: '선물 나눔/추첨 이벤트'
      },
      {
        value: 'online',
        show_value: '온라인 이벤트 (비대면)'
      },
      {
        value: 'etc',
        show_value: '기타'
      }
    ];

    const data = list.find((value) => {
      return value.value === category;
    })

    let _category = ''

    if(data === undefined || data === null){
      _category = category;
    }else{
      _category = data.show_value;
    }

    slack.webhook({
      channel: "#bot-팬이벤트신청",
      username: "신청bot",
      text: `[팬이벤트]\n이름: ${name}\nemail: ${email}\n연락처: ${contact}\n종류: ${_category}`
    }, function(err, response) {
      console.log(err);
    });

    return res.json({
      result: {
        state: res_state.success,
      }
    });
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: error,
      result:{}
    })
  })

})

router.post('/manager/myprojects', function(req, res){
  // let limit = req.body.data.limit;
  // let skip = req.body.data.skip;
  const user_id = req.body.data._user_id;
  const sort_state = req.body.data.sort_state;

  var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');


  let querySelect = '';
  if(sort_state === null){
    querySelect = mysql.format("SELECT project.id AS project_id FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.user_id=? GROUP BY project.id ORDER BY project.funding_closing_at DESC", [user_id]);
  }
  else if(sort_state === 'sale_end'){
    querySelect = mysql.format("SELECT project.id AS project_id FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.user_id=? AND project.state=? AND project.funding_closing_at <= ? GROUP BY project.id ORDER BY project.funding_closing_at DESC", [user_id, types.project.STATE_APPROVED, nowDate]);
  }
  else if(Number(sort_state) === types.project.STATE_APPROVED){
    querySelect = mysql.format("SELECT project.id AS project_id FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.user_id=? AND project.state=? AND project.funding_closing_at > ? GROUP BY project.id ORDER BY project.funding_closing_at DESC", [user_id, sort_state, nowDate]);
  }
  else{
    querySelect = mysql.format("SELECT project.id AS project_id FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.user_id=? AND project.state=? GROUP BY project.id ORDER BY project.funding_closing_at DESC", [user_id, sort_state]);
  }

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/manager/proceeding/count', function(req, res){
  const place_user_id = req.body.data.place_user_id;
  const user_id = place_user_id;

  var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let querySelect = mysql.format("SELECT COUNT(id) AS count FROM projects AS project WHERE project.user_id=? AND project.state=? AND project.funding_closing_at > ?", [user_id, types.project.STATE_APPROVED, nowDate]);

  db.SELECT(querySelect, {}, (result) => {
    
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          count: 0
        }
      })
    }
    
    const data = result[0]
    return res.json({
      result: {
        state: res_state.success,
        count: data.count
      }
    })

  })
})

router.post('/manager/end/count', function(req, res){
  const place_user_id = req.body.data.place_user_id;
  const user_id = place_user_id;

  var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let querySelect = mysql.format("SELECT COUNT(id) AS count FROM projects AS project WHERE project.user_id=? AND project.state=? AND project.funding_closing_at <= ?", [user_id, types.project.STATE_APPROVED, nowDate]);

  db.SELECT(querySelect, {}, (result) => {
    
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          count: 0
        }
      })
    }
    
    const data = result[0]
    return res.json({
      result: {
        state: res_state.success,
        count: data.count
      }
    })

  })
})

module.exports = router;