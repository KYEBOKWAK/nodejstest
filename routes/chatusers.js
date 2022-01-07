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


router.post("/list", function(req, res){
  const user_id = req.body.data.user_id;
  const room_id = req.body.data.room_id;

  // let querySelect = mysql.format("SELECT room.id, target_id, room_name FROM rooms AS room LEFT JOIN chat_users AS chat_user ON room.id=chat_user.room_id WHERE chat_user.user_id=?", user_id);

  let querySelect = mysql.format("SELECT user.id ,name, nick_name, profile_photo_url FROM chat_users AS chat_user LEFT JOIN users AS user ON chat_user.user_id=user.id WHERE chat_user.room_id=?", [room_id]);

  db.SELECT(querySelect, {}, (result) => {
    console.log(result);
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '채팅 유저 리스트 에러',
        result:{}
      })
    }
    
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  });
});

router.post("/check", function(req, res){
  const user_id = req.body.data.user_id;
  const room_id = req.body.data.room_id;

  let querySelect = mysql.format("SELECT id FROM chat_users WHERE user_id=? AND room_id=?", [user_id, room_id]);
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/get/count", function(req, res){
  const room_id = req.body.data.room_id;
  let querySelect = mysql.format("SELECT COUNT(id) AS user_count FROM chat_users WHERE room_id=?", [room_id]);
  db.SELECT(querySelect, {}, (result) => {

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        ...data
      }
    })
  })

});

module.exports = router;