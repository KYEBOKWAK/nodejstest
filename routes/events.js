var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const Util = use('lib/util.js');

const global = use('lib/global_const.js');
var mysql = require('mysql');

router.post('/any/pages', function(req, res){
  const alias = req.body.data.alias;
  const querySelect = mysql.format("SELECT layer_1, layer_2, background_url FROM event_pages WHERE alias=?", [alias]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '이벤트 페이지 정보 조회 에러'
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/items', function(req, res){
  const alias = req.body.data.alias;
  const querySelect = mysql.format("SELECT target_id, target_type, thumb_img_url, first_text, second_text, third_text FROM event_items WHERE alias=?", [alias]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '이벤트 아이템 정보 조회 에러'
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

module.exports = router;