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
// const util = require('./lib/util.js');

const TAKE_NOTICE = 20; //공지 한번에 불러오는 양

router.post("/get", function(req, res){
  //target_id_data
  const lastNoticeID = req.body.data.lastNoticeID;
//: string, : string, : string, target_id: number, target_id_data
  let queryNotice = "";
  if(lastNoticeID === 0){
    queryNotice = mysql.format("SELECT id, title, body, target_id_data, target_id, created_at, type_main, type_bottom, type_page FROM notices ORDER BY id DESC LIMIT ?", [TAKE_NOTICE]);
  }else{
    queryNotice = mysql.format("SELECT id, title, body, target_id_data, target_id, created_at, type_main, type_bottom, type_page FROM notices WHERE id<? ORDER BY id DESC LIMIT ?", [lastNoticeID, TAKE_NOTICE]);
  }
  
  // let queryNotice = mysql.format("SELECT id FROM notices ORDER BY id DESC LIMIT ?", [TAKE_NOTICE]);

  db.SELECT(queryNotice, {}, (result) => {
    console.log(result);
    return res.json({
      result
    })
  });
});

router.post("/get/image", function(req, res){
  const target_id = req.body.data.target_id;
  const target_id_data = req.body.data.target_id_data;

  let queryImage = '';
  if(target_id_data === 'project_id'){
    queryImage = mysql.format("SELECT poster_renew_url FROM projects WHERE id=?", target_id);
  }else if(target_id_data === 'mannayo_id'){
    queryImage = mysql.format("SELECT thumbnail_url FROM meetups AS meetup LEFT JOIN creators AS creator ON creator.id=meetup.creator_id WHERE meetup.id=?", target_id);
  }

  db.SELECT(queryImage, {}, 
    (result) => {
      if(result.length === 0){
        //혹시 이미지가 검색 안되더라도 alert나오지 않게 그냥 success로 통과
        return res.json({
          result:{
            state: res_state.success,
            thumbnail_url : ''
          }
        })
      }

      const data = result[0];
      let _thumbnail_url = "";
      if(target_id_data === 'project_id'){
        _thumbnail_url = data.poster_renew_url;
      }else{
        _thumbnail_url = data.thumbnail_url;
      }
      
      return res.json({
        result:{
          state: res_state.success,
          thumbnail_url: _thumbnail_url
        }
      })
    })
});

module.exports = router;