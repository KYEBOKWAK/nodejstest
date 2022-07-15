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

router.post("/ticketing/list", function(req, res){
  const user_id = req.body.data.user_id;
  
  let queryLikeTicketing = mysql.format("SELECT project.poster_url, _like.id, _like.target_id, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM likes AS _like LEFT JOIN projects AS project ON _like.target_id=project.id WHERE _like.user_id=? AND _like.like_type=? AND project.state=? GROUP BY _like.id", [user_id, types.like.LIKE_PROJECT, types.project.STATE_APPROVED]);

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
})

router.post("/project/list", function(req, res){
  const user_id = req.body.data.user_id;
  
  let queryLikeTicketing = mysql.format("SELECT project.poster_url, _like.id, _like.target_id, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM likes AS _like LEFT JOIN projects AS project ON _like.target_id=project.id WHERE _like.user_id=? AND _like.like_type=? AND project.state=? GROUP BY _like.id", [user_id, types.like.LIKE_PROJECT, types.project.STATE_APPROVED]);

  db.SELECT(queryLikeTicketing, {}, (result_select_ticketing) => {

    // for(let i = 0 ; i < result_select_ticketing.length ; i++){
    //   let resultTicketingData = result_select_ticketing[i];

    //   let isFinished = Util.isPrjectFinished(resultTicketingData.funding_closing_at);
    //   resultTicketingData.isFinished = isFinished;
    // }

    return res.json({
      result:{
        state: res_state.success,
        list: result_select_ticketing
      }
    })
  })
})

router.post("/mannayo/list", function(req, res){
  const user_id = req.body.data.user_id;
  
  let queryLikeTicketing = mysql.format("SELECT _like.id, meetup.id AS meetup_id FROM likes AS _like LEFT JOIN meetups AS meetup ON _like.target_id=meetup.id WHERE _like.user_id=? AND _like.like_type=? GROUP BY _like.id", [user_id, types.like.LIKE_MANNAYO]);

  db.SELECT(queryLikeTicketing, {}, (result_select_ticketing) => {

    // for(let i = 0 ; i < result_select_ticketing.length ; i++){
    //   let resultTicketingData = result_select_ticketing[i];

    //   let isFinished = Util.isPrjectFinished(resultTicketingData.funding_closing_at);
    //   resultTicketingData.isFinished = isFinished;
    // }

    return res.json({
      result:{
        state: res_state.success,
        list: result_select_ticketing
      }
    })
  })
})

router.post("/islike", function(req, res){
  const user_id = req.body.data.user_id;
  const like_type = req.body.data.like_type;
  const target_id = req.body.data.target_id;

  let queryLikes = mysql.format("SELECT id FROM likes WHERE user_id=? AND like_type=? AND target_id=?", [user_id, like_type, target_id]);
  db.SELECT(queryLikes, {}, (result_select_query) => {
    let isLike = false;
    if(result_select_query.length > 0){
      isLike = true;
    }

    return res.json({
      result:{
        state: res_state.success,
        isLike: isLike
      }
    })
    
  })
});

router.post("/count", function(req, res){
  // const user_id = req.body.data.user_id;
  const like_type = req.body.data.like_type;
  const target_id = req.body.data.target_id;

  let queryLikeCount = mysql.format("SELECT COUNT(id) AS like_count FROM likes WHERE like_type=? AND target_id=?", [like_type, target_id]);
  db.SELECT(queryLikeCount, {}, (result_select_query) => {
    if(result_select_query.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          count: 0
        }
      })
    }

    const likeData = result_select_query[0]
    return res.json({
      result:{
        state: res_state.success,
        count: likeData.like_count
      }
    })
    
  })
});

router.post("/create", function(req, res){
  const user_id = req.body.data.user_id;
  const like_type = req.body.data.like_type;
  const target_id = req.body.data.target_id;

  let queryLikes = mysql.format("SELECT id FROM likes WHERE user_id=? AND like_type=? AND target_id=?", [user_id, like_type, target_id]);
  db.SELECT(queryLikes, {}, (result_select_likes) => {
    if(result_select_likes.length > 0){
      return res.json({
        state: res_state.error,
        message: '이미 좋아요를 했습니다.',
        result: {
        }
      })
    }

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    let likesInsertData = {
      user_id: user_id,
      like_type: like_type,
      target_id: target_id,
      created_at: date
    }

    db.INSERT("INSERT INTO likes SET ?;", likesInsertData, function(result_insert_likes){
      if(result_insert_likes === undefined){
        return res.json({
          state: 'error',
          message: 'likes insert error!',
          result: {
          }
        });
      }

      return res.json({
        result:{
          state: res_state.success
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: error,
        result:{}
      })
    })
  })
});

router.post("/cancel", function(req, res){
  const user_id = req.body.data.user_id;
  const like_type = req.body.data.like_type;
  const target_id = req.body.data.target_id;

  db.DELETE("DELETE FROM likes WHERE user_id=? AND like_type=? AND target_id=?", [user_id, like_type, target_id], function(result_likes_delete){
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: error,
      result:{}
    })
  });

  /*
  const user_id = req.body.data.user_id;
  const like_type = req.body.data.like_type;
  const target_id = req.body.data.target_id;

  db.DELETE("DELETE FROM likes WHERE user_id=? AND like_type=? AND target_id=?", [user_id, like_type, target_id], function(result_likes_delete){
    console.log(result_likes_delete);
    return res.json({
      result: {
        state: res_state.success
      }
    });
  });

  */
});

router.post("/chatting", function(req, res){
  const user_id = req.body.data.user_id;
//chat_user_id
  let selectQuery = mysql.format("SELECT _like.user_id AS user_id, chat_user.id AS chat_user_id, room.id, room.id AS room_id, room.expire, room.target_id, room.room_name, project.title, project.poster_renew_url FROM likes AS _like LEFT JOIN rooms AS room ON _like.target_id=room.id LEFT JOIN projects AS project ON room.target_id=project.id LEFT JOIN chat_users AS chat_user ON chat_user.room_id=room.id AND chat_user.user_id=? WHERE _like.like_type=? AND _like.user_id=? AND room.target_type=?", [user_id, types.like.LIKE_CHAT, user_id, "project"]);

  // let selectQuery = mysql.format("SELECT chat_user.id AS chat_user_id, room.id, room.id AS room_id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN orders AS _order ON room.target_id=_order.project_id LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN chat_users AS chat_user ON chat_user.user_id=_order.user_id AND chat_user.room_id=room.id WHERE _order.user_id=? AND (_order.state=? OR _order.state=? OR _order.state=? OR _order.state=? OR _order.state=?) GROUP BY room.id", [user_id, types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_PAY_NO_PAYMENT, types.order.ORDER_STATE_PAY_SCHEDULE, types.order.ORDER_STATE_APP_PAY_COMPLITE, types.order.ORDER_STATE_APP_PAY_IAMPORT_WEBHOOK_VERIFY_COMPLITE]);

  db.SELECT(selectQuery, {}, (result) => {
    for(let i = 0 ; i < result.length ; i++){
      result[i].room_title = result[i].title + " 오픈 채팅방";

      // result[i].title = result[i].title + " 기간한정 채팅방";
    }

    // console.log(result);

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })

  })
});

router.post("/any/count", function(req, res){
  // const user_id = req.body.data.user_id;
  const like_type = req.body.data.like_type;
  const target_id = req.body.data.target_id;

  let queryLikeCount = mysql.format("SELECT COUNT(id) AS like_count FROM likes WHERE like_type=? AND target_id=?", [like_type, target_id]);
  db.SELECT(queryLikeCount, {}, (result_select_query) => {
    if(result_select_query.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          count: 0
        }
      })
    }

    const likeData = result_select_query[0]
    return res.json({
      result:{
        state: res_state.success,
        count: likeData.like_count
      }
    })
    
  })
});

module.exports = router;