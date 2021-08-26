var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');

router.post('/any/get', function(req, res){
  const type = req.body.data.type;

  const selectQuery = mysql.format('SELECT img_url, link_url, title, sub_title, point_title, bg_color, title_color, subtitle_color FROM banners WHERE type=?', [type]);

  db.SELECT(selectQuery, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: {
            img_url: null,
            link_url: null
          }
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
});

module.exports = router;