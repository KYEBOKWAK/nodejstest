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

var redis = require('redis');
var client = redis.createClient(process.env.REDIS_CHATTING_PORT, process.env.REDIS_CHATTING_URL);


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

router.post("/chat/sync", function(req, res){
// router.post("/chat/sync", function(req, res){
  const room_name = req.body.data.room_name;
  let lastMessageID = req.body.data.lastMessageID

  let redisPromise = new Promise((resolve, reject) => {
      client.LLEN(room_name, (error, messageLength) => {
          if(lastMessageID === -1){
            //lastmessageID가 -1이면 애초에 저장된 데이터가 없음.
              lastMessageID = messageLength - 1;
          }

          let messageObject = {
              room_name: room_name,
              // state: types.chatSynchronize.synchronizing_success,
              state: 'success',
              lastMessageID: lastMessageID,
              lastMessageDate: '',
              list: []
          }

          if(lastMessageID === messageLength - 1){
              
              // console.log("싱크완료됨");
              // syncMessages.push(messageObject);
              resolve(messageObject);
          }else if(messageLength === 0){
              messageObject = {
                  ...messageObject,
                  // state: types.chatSynchronize.no_message
                  // state: 'success',
              }
              
              // console.log("메시지 없음");
              // syncMessages.push(messageObject);
              resolve(messageObject);
          }else{
              // console.log("싱크안되서 시도함.");
              
              if(lastMessageID !== 0){
                  lastMessageID = lastMessageID + 1;
              }
              client.lrange(room_name, lastMessageID, -1, (error, result) => {
                  
                  const _messages = result.concat();
                  let _findLastMessageID = lastMessageID;
                  let _findLastMessageDate = '';
                  if(_messages.length > 0){
                    let lastMessage = _messages[_messages.length - 1];
                    lastMessage = JSON.parse(lastMessage);
                    _findLastMessageID = lastMessage.id;
                    _findLastMessageDate = lastMessage.date;
                  }

                  let _messageObject = {
                      room_name: room_name,
                      // state: types.chatSynchronize.synchronizing,
                      // state: 'success',
                      lastMessageID: _findLastMessageID,
                      lastMessageDate: _findLastMessageDate,
                      list: result.concat()
                  }
      
                  // syncMessages.push(_messageObject);
                  resolve(_messageObject);
              })      
          }
      })
  })

  redisPromise.then((value) => {
      // console.log(value);
      return res.json({
          result:{
              ...value   
          }
      })
  }).catch((error) => {

  })
});

////임시

router.post("/any/chat/sync", function(req, res){
  // router.post("/chat/sync", function(req, res){
    const room_name = req.body.data.room_name;
    let lastMessageID = req.body.data.lastMessageID
  
    let redisPromise = new Promise((resolve, reject) => {
        client.LLEN(room_name, (error, messageLength) => {
            if(lastMessageID === -1){
              //lastmessageID가 -1이면 애초에 저장된 데이터가 없음.
                lastMessageID = messageLength - 1;
            }
  
            let messageObject = {
                room_name: room_name,
                // state: types.chatSynchronize.synchronizing_success,
                state: 'success',
                lastMessageID: lastMessageID,
                lastMessageDate: '',
                list: []
            }
  
            if(lastMessageID === messageLength - 1){
                
                // console.log("싱크완료됨");
                // syncMessages.push(messageObject);
                resolve(messageObject);
            }else if(messageLength === 0){
                messageObject = {
                    ...messageObject,
                    // state: types.chatSynchronize.no_message
                    // state: 'success',
                }
                
                // console.log("메시지 없음");
                // syncMessages.push(messageObject);
                resolve(messageObject);
            }else{
                // console.log("싱크안되서 시도함.");
                
                if(lastMessageID !== 0){
                    lastMessageID = lastMessageID + 1;
                }
                client.lrange(room_name, lastMessageID, -1, (error, result) => {
                    
                    const _messages = result.concat();
                    let _findLastMessageID = lastMessageID;
                    let _findLastMessageDate = '';
                    if(_messages.length > 0){
                      let lastMessage = _messages[_messages.length - 1];
                      lastMessage = JSON.parse(lastMessage);
                      _findLastMessageID = lastMessage.id;
                      _findLastMessageDate = lastMessage.date;
                    }
  
                    let _messageObject = {
                        room_name: room_name,
                        // state: types.chatSynchronize.synchronizing,
                        // state: 'success',
                        lastMessageID: _findLastMessageID,
                        lastMessageDate: _findLastMessageDate,
                        list: result.concat()
                    }
        
                    // syncMessages.push(_messageObject);
                    resolve(_messageObject);
                })      
            }
        })
    })
  
    redisPromise.then((value) => {
        // console.log(value);
        return res.json({
            result:{
                ...value   
            }
        })
    }).catch((error) => {
  
    })
  });

///////
router.post("/list", function(req, res){
  const user_id = req.body.data.user_id;

  // let querySelect = mysql.format("SELECT room.id, target_id, room_name FROM rooms AS room LEFT JOIN chat_users AS chat_user ON room.id=chat_user.room_id WHERE chat_user.user_id=?", user_id);

  // const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let querySelect = mysql.format("SELECT room.id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN chat_users AS chat_user ON room.id=chat_user.room_id LEFT JOIN projects AS project ON project.id=room.target_id WHERE chat_user.user_id=?", user_id);

  console.log(querySelect);

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

router.post("/expire", function(req, res){
  const room_id = req.body.data.room_id;

  const querySelectRooms = mysql.format("SELECT expire FROM rooms AS room WHERE room.id=?", [room_id]);
  db.SELECT(querySelectRooms, {}, (result_select_rooms) => {
    if(result_select_rooms.length === 0){
      return res.json({
        state: res_state.error,
        message: '방 정보를 찾을 수 없습니다.'
      })
    }

    let data = result_select_rooms[0];
    let isExpire = false;
    if(Util.isExpireTime(data.expire)){
      //expire됐으면 
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

router.post("/join", function(req, res){
  const user_id = req.body.data.user_id;
  const target_id = req.body.data.target_id;
  const room_id = req.body.data.room_id;
  const target_type = req.body.data.target_type;
  const name = req.body.data.name;

  const querySelectRooms = mysql.format("SELECT expire, room.id AS room_id, room_name, project.title FROM rooms AS room LEFT JOIN projects AS project ON project.id=room.target_id WHERE room.id=? AND target_id=? AND target_type=?", [room_id, target_id, target_type]);

  db.SELECT(querySelectRooms, {}, (result_select_rooms) => {
    if(result_select_rooms.length === 0){
      return res.json({
        state: res_state.error,
        message: '방 정보를 찾을 수 없습니다.'
      })
    }

    let data = result_select_rooms[0];

    if(Util.isExpireTime(data.expire)){
      //expire됐으면 
      return res.json({
        state: res_state.error,
        message: '이미 종료된 채팅방입니다.',
        result:{}
      })
    }

    data.room_title = data.title + " 오픈 채팅방";

    const querySelectChatUser = mysql.format("SELECT id AS chat_user_id FROM chat_users WHERE user_id=? AND room_id=?", [user_id, data.room_id]);
    db.SELECT(querySelectChatUser, {}, (result_select_chat_user) => {
      if(result_select_chat_user.length === 0){
        const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

        const insertChatUser = {
          user_id: user_id,
          room_id: data.room_id,
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
              room_name: data.room_name,
              room_title: data.room_title,
              expire: data.expire,
              room_id: data.room_id,
              chat_user_id: result_insert_chat_users.insertId
            }
          })
        })
      }else{
        //이미 채팅방에 들어가있음.
        
        return res.json({
          result:{
            state: res_state.success,
            room_name: data.room_name,
            room_title: data.room_title,
            expire: data.expire,
            room_id: data.room_id,
            chat_user_id: result_select_chat_user[0].chat_user_id
          }
        })
      }
    })

  });

  /*
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
  */
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

router.post("/set/now_room_name", function(req, res){
  const refresh_token = req.body.data._refresh_token;
  const user_id = req.body.data.user_id;
  const room_name = req.body.data.room_name;

  db.UPDATE("UPDATE devices SET now_room_name=? WHERE refresh_token=? AND user_id=?", 
          [room_name, refresh_token, user_id],
          function(result){
            return res.json({
              result: {
                state: res_state.success
              }
            });
          }, function(error){
            return res.json({
              state: res_state.error,
              message: "현재 접속된 룸 정보 셋팅 오류",
              result: {}
            })
          });
})

router.post("/unset/now_room_name", function(req, res){
  const refresh_token = req.body.data._refresh_token;
  const user_id = req.body.data.user_id;

  db.UPDATE("UPDATE devices SET now_room_name=? WHERE refresh_token=? AND user_id=?", 
          [null, refresh_token, user_id],
          function(result){
            return res.json({
              result: {
                state: res_state.success
              }
            });
          }, function(error){
            return res.json({
              state: res_state.error,
              message: "현재 접속된 룸 정보 초기화 오류",
              result: {}
            })
          });
})

module.exports = router;