var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const moment = require('moment');

var mysql = require('mysql');
const Util = use('lib/util.js');

const global = use('lib/global_const.js');
const axios = require('axios');
const { Config } = require('aws-sdk');

router.post('/order', function(req, res){

});

router.post('/any/list', function(req, res){
  let querySelect = mysql.format("SELECT store.id AS id, store.id AS store_id, alias, thumb_img_url, title, profile_photo_url FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE state=?", Types.store.STATE_APPROVED);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/item/list', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip
  let querySelect = mysql.format("SELECT item.id, item.store_id, store.alias, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id ORDER BY item.id DESC LIMIT ? OFFSET ?", [limit, skip]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/detail/info', function(req, res){
  const store_id = req.body.data.store_id;
  const store_alias = req.body.data.store_alias;

  const querySelect = mysql.format("SELECT store.content AS store_content, user.nick_name, store.id, store.title, store.alias, store.thumb_img_url, store.user_id, profile_photo_url FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE store.id=? OR store.alias=?", [store_id, store_alias]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '상점 정보 조회 불가'
      })
    }

    return res.json({
      result:{
        state: res_state.success,
        data: {
          ...result[0]
        }
      }
    })
  })
});

router.post('/any/detail/item/list', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;
  let store_id = req.body.data.store_id;

  let querySelect = mysql.format("SELECT item.id, item.store_id, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.store_id=? AND item.order_number IS NOT NULL ORDER BY item.order_number LIMIT ? OFFSET ?", [store_id, limit, skip]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/info/alias', function(req, res){
  const store_id = req.body.data.store_id;
  const querySelect = mysql.format("SELECT alias FROM stores WHERE id=?", store_id);
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        ...result[0]
      }
    })
  })
})

router.post('/any/item/info', function(req, res){
  const store_item_id = req.body.data.store_item_id;
  const querySelect = mysql.format("SELECT item.ask, item.store_id, item.price, item.title, item.img_url, item.content, user.nick_name FROM items AS item LEFT JOIN stores AS store ON store.id=item.store_id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.id=?", store_item_id);
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        data: {
          ...result[0]
        }
      }
    })
  })
})

router.post('/info/userid', function(req, res){
  const user_id = req.body.data.user_id;
  const querySelect = mysql.format("SELECT store.id AS store_id, user.nick_name FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE user_id=?", user_id);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '상점 주인만 접근 가능합니다.',
        result:{}
      })
    }

    const data = result[0];

    return res.json({
      result:{
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  })
})

router.post('/orders/ask/list', function(req, res){
  const store_id = req.body.data.store_id;
  const user_id = req.body.data.user_id;

  const querySelect = mysql.format("SELECT id AS store_order_id FROM orders_items WHERE store_id=? ORDER BY id DESC", [store_id]);
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

module.exports = router;