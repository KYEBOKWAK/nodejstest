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
const axios = require('axios');
const { Config } = require('aws-sdk');


const ROOM_INFO_TEMP = [
  {
      id: 1,
      target_id: 237,
      target_type: 'project',
      expire: '2020-07-20 00:00:00',
      room_name: 'room_project_237'
  },
  {
    id: 2,
    target_id: 238,
    target_type: 'project',
    expire: '2020-07-21 00:00:00',
    room_name: 'room_project_238'
  }
]

router.post("/list", function(req, res){
  const user_id = req.body.data.user_id;

  // let querySelect = mysql.format("SELECT room.id, target_id, room_name FROM rooms AS room LEFT JOIN chat_users AS chat_user ON room.id=chat_user.room_id WHERE chat_user.user_id=?", user_id);

  let querySelect = mysql.format("SELECT room.id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN chat_users AS chat_user ON room.id=chat_user.room_id LEFT JOIN projects AS project ON project.id=room.target_id WHERE chat_user.user_id=?", user_id);

  db.SELECT(querySelect, {}, (result) => {
    // console.log(result);
    // if(result.length === 0){
    //   return res.json({
    //     state: res_state.error,
    //     message: '채팅 리스트 에러',
    //     result:{}
    //   })
    // }

    for(let i = 0 ; i < result.length ; i++){
      result[i].room_title = result[i].title + " 오픈 채팅방";

      result[i].title = result[i].title + " 기간한정 채팅방";
    }
    
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  });
});

router.post("/leave", function(req, res){
  
  const user_id = req.body.data.user_id;
  const room_id = req.body.data.room_id;
  const name = req.body.data.name;
  const room_name = req.body.data.room_name;

  db.DELETE("DELETE FROM chat_users WHERE user_id=? AND room_id=?", [user_id, room_id], (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  })

  /*
  axios.post(process.env.CROWDTICKET_CHATTING_SERVER_URL+"/message/leave", {
    room_name: room_name,
    name: name,
    user_id: user_id,
    room_name: room_name
  }).then((result) => {
    // console.log("conmciom");
    // console.log(result.data);

    db.DELETE("DELETE FROM chat_users WHERE user_id=? AND room_id=?", [user_id, room_id], (result) => {
      return res.json({
        result:{
          state: res_state.success
        }
      })
    })
  }).catch((error) => {

  })
  */
})

router.post("/join", function(req, res){
  const user_id = req.body.data.user_id;
  const target_id = req.body.data.target_id;
  const target_type = req.body.data.target_type;
  const name = req.body.data.name;

  const querySelectRooms = mysql.format("SELECT id, room_name FROM rooms WHERE target_id=? AND target_type=?", [target_id, target_type]);

  db.SELECT(querySelectRooms, {}, (result_select_rooms) => {
    if(result_select_rooms.length === 0){
      return res.json({
        state: res_state.error,
        message: '방 정보를 찾을 수 없습니다.'
      })
    }

    const data = result_select_rooms[0];

    const querySelectChatUser = mysql.format("SELECT id FROM chat_users WHERE user_id=? AND room_id=?", [user_id, data.id]);
    db.SELECT(querySelectChatUser, {}, (result_select_chat_user) => {
      if(result_select_chat_user.length === 0){
        const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

        const insertChatUser = {
          user_id: user_id,
          room_id: data.id,
          created_at: date,
          updated_at: date
        }

        db.INSERT("INSERT INTO chat_users SET ?;", insertChatUser, (result_insert_chat_users) => {
          if(!result_insert_chat_users){
            return res.json({
              state: res_state.error,
              message: "채팅 유저 셋팅 에러",
              result: {
              }
            });
          }


          return res.json({
            result:{
              state: res_state.success,
              room_name: data.room_name
            }
          })
          /*
          axios.post(process.env.CROWDTICKET_CHATTING_SERVER_URL+"/message/join", {
            room_name: data.room_name,
            name: name,
            user_id: user_id
          }).then((result) => {
            // console.log("conmciom");
            // console.log(result.data);
            return res.json({
              result:{
                state: res_state.success,
                room_name: data.room_name
              }
            })
          }).catch((error) => {

          })
          */
        })
      }else{
        //이미 채팅방에 들어가있음.
        return res.json({
          result:{
            state: res_state.success,
            room_name: data.room_name
          }
        })
      }
    })

  });
});

router.post("/chat/info", function(req, res){
  const user_id = req.body.data.user_id;
  const project_id = req.body.data.project_id;

  // let selectQuery = mysql.format("SELECT chat_user.id AS chat_user_id, room.id, room.id AS room_id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN orders AS _order ON room.target_id=_order.project_id LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN chat_users AS chat_user ON chat_user.user_id=_order.user_id AND chat_user.room_id=room.id WHERE _order.user_id=? AND (_order.state=? OR _order.state=? OR _order.state=? OR _order.state=? OR _order.state=?) GROUP BY room.id", [user_id, types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_PAY_NO_PAYMENT, types.order.ORDER_STATE_PAY_SCHEDULE, types.order.ORDER_STATE_APP_PAY_COMPLITE, types.order.ORDER_STATE_APP_PAY_IAMPORT_WEBHOOK_VERIFY_COMPLITE]);

  let selectQuery = mysql.format("SELECT chat_user.id AS chat_user_id, room.id, room.id AS room_id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN orders AS _order ON room.target_id=_order.project_id LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN chat_users AS chat_user ON chat_user.user_id=_order.user_id AND chat_user.room_id=room.id WHERE _order.user_id=? AND room.target_id=? AND (_order.state=? OR _order.state=? OR _order.state=? OR _order.state=? OR _order.state=?) GROUP BY room.id", [user_id, project_id, types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_PAY_NO_PAYMENT, types.order.ORDER_STATE_PAY_SCHEDULE, types.order.ORDER_STATE_APP_PAY_COMPLITE, types.order.ORDER_STATE_APP_PAY_IAMPORT_WEBHOOK_VERIFY_COMPLITE]);


  db.SELECT(selectQuery, {}, (result) => {

    for(let i = 0 ; i < result.length ; i++){
      result[i].room_title = result[i].title + " 오픈 채팅방";

      result[i].room_item_title = result[i].title + " 기간한정 채팅방";
    }
    
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

module.exports = router;