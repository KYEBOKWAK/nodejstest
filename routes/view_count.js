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

router.post('/any/event/add', function(req, res){
  const alias = req.body.data.alias;
  const nowTime = moment_timezone().format('YYYY-MM-DD 00:00:00');

  let querySelect = mysql.format("SELECT id FROM view_counts WHERE target_alias=? AND time_at=? AND type=?", [alias, nowTime, Types.view_counts.EVENT])
  db.SELECT(querySelect, {}, (result_select) => {
    if(result_select.length === 0){
      var view_count = {
        target_id: null,
        target_alias: alias,
        type: Types.view_counts.EVENT,
        time_at: nowTime
      };

      db.INSERT("INSERT INTO view_counts SET ? ", view_count, function(result){
        // console.log(result);
        return res.json({
          result: {
            state: res_state.success
          }
        })
      });
    }else{

      const data = result_select[0];
      db.UPDATE("UPDATE view_counts SET count=count+1 WHERE id=?", [data.id], 
      (result) => {
        return res.json({
          result: {
            state: res_state.success
          }
        })
      }, (error) => {
        return res.json({
          result: {
            state: res_state.success
          }
        })
      })
    }
  });

  

  // const querySelect = mysql.format("SELECT id, type, contents, contents_color, background_color, icon_img_url, link_url, icon_img_size FROM top_banners ORDER BY id desc LIMIT 1");

  // db.SELECT(querySelect, {}, (result) => {
  //   if(result.length === 0){
  //     return res.json({
  //       result: {
  //         state: res_state.success,
  //         data: null
  //       }
  //     })
  //   }

  //   const data = result[0];

  //   return res.json({
  //     result: {
  //       state: res_state.success,
  //       data: {
  //         ...data
  //       }
  //     }
  //   })
  // })
})

module.exports = router;