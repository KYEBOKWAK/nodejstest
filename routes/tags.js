var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');

router.post('/any/etc', function(req, res){
  const item_id = req.body.data.item_id;

  var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const querySelect = mysql.format("SELECT thumb_tag.title, thumb_tag.bg_color FROM items_thumb_tags AS items_thumb_tag LEFT JOIN thumb_tags AS thumb_tag ON items_thumb_tag.thumb_tag_id=thumb_tag.id WHERE items_thumb_tag.target_id=? AND items_thumb_tag.type <> ? AND items_thumb_tag.start_date <= ? AND items_thumb_tag.end_date > ? ORDER BY items_thumb_tag.thumb_tag_id DESC LIMIT 1", [item_id, Types.thumb_tags_type.EVENT, nowDate, nowDate]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          list: []
        }
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

router.post('/any/event', function(req, res){
  const item_id = req.body.data.item_id;

  var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const querySelect = mysql.format("SELECT thumb_tag.title, thumb_tag.bg_color FROM items_thumb_tags AS items_thumb_tag LEFT JOIN thumb_tags AS thumb_tag ON items_thumb_tag.thumb_tag_id=thumb_tag.id WHERE items_thumb_tag.target_id=? AND items_thumb_tag.type = ? AND items_thumb_tag.start_date <= ? AND items_thumb_tag.end_date > ? ORDER BY items_thumb_tag.thumb_tag_id DESC LIMIT 1", [item_id, Types.thumb_tags_type.EVENT, nowDate, nowDate]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          list: []
        }
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