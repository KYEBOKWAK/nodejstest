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

// const global = use('lib/global_const.js');
// const axios = require('axios');
// const { Config } = require('aws-sdk');

const TAKE_NOTICE = 5; //공지 한번에 불러오는 양

router.post("/feed/list", function(req, res){
  let queryMainThumbnails = mysql.format("SELECT magazine.id, magazine.title, magazine.subtitle, magazine.thumb_img_url FROM main_thumbnails AS main_thumbnail LEFT JOIN magazines AS magazine ON main_thumbnail.magazine_id=magazine.id WHERE main_thumbnail.type=? ORDER BY main_thumbnail.order_number DESC", [types.main_thumb.THUMBNAIL_TYPE_MAGAZINE])
  db.SELECT(queryMainThumbnails, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/detail", function(req, res){
  const magazine_id = req.body.data.magazine_id;

  let queryMagazine = mysql.format("SELECT story FROM magazines WHERE id=?", magazine_id);
  db.SELECT(queryMagazine, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '매거진 조회 오류',
        result:{}
      })
    }

    const data = result[0];

    return res.json({
      result:{
        state: res_state.success,
        story: data.story
      }
    })
  })
});

router.post("/list/all", function(req, res){
  const lastNoticeID = req.body.data.lastNoticeID;
//: string, : string, : string, target_id: number, target_id_data
  let querySelect = "";
  if(lastNoticeID === 0){
    querySelect = mysql.format("SELECT id, title, subtitle, thumb_img_url FROM magazines ORDER BY id DESC LIMIT ?", [TAKE_NOTICE]);

  }else{
    querySelect = mysql.format("SELECT id, title, subtitle, thumb_img_url FROM magazines WHERE id<? ORDER BY id DESC LIMIT ?", [lastNoticeID, TAKE_NOTICE]);
  }

  console.log("#################");
  console.log(lastNoticeID);
  console.log(querySelect);

  db.SELECT(querySelect, {}, (result) => {
    console.log("######");
    console.log(result);
    return res.json({
      result
    })
  });
});


module.exports = router;