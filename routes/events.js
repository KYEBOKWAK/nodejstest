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

router.post('/any/banner/top/info', function(req, res){
  const querySelect = mysql.format("SELECT id, type, contents, contents_color, background_color, icon_img_url, link_url, icon_img_size FROM top_banners ORDER BY id desc LIMIT 1");

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }

    const data = result[0];

    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
})

router.post('/any/page/notice', function(req, res){
  const alias = req.body.data.alias;
  const querySelect = mysql.format("SELECT text FROM event_pages WHERE alias=? AND row_type=?", [alias, Types.event_row_type.notice]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          text: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        text: data.text
      }
    })
  })
})

router.post('/any/page/tag', function(req, res){
  const alias = req.body.data.alias;
  const querySelect = mysql.format("SELECT text FROM event_pages WHERE alias=? AND row_type=?", [alias, Types.event_row_type.tag]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          text: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        text: data.text
      }
    })
  })
})

router.post('/any/page/title', function(req, res){
  const alias = req.body.data.alias;
  const querySelect = mysql.format("SELECT text FROM event_pages WHERE alias=? AND row_type=?", [alias, Types.event_row_type.title]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          text: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        text: data.text
      }
    })
  })
})

router.post('/any/pages', function(req, res){
  const alias = req.body.data.alias;
  const querySelect = mysql.format("SELECT image_pc, image_mobile FROM event_pages WHERE alias=? AND row_type=?", [alias, Types.event_row_type.image]);

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
  const querySelect = mysql.format("SELECT target_id FROM event_items WHERE alias=? ORDER BY RAND()", [alias]);

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