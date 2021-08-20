var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');

router.post('/any/top/list', function(req, res){
  const querySelect = mysql.format("SELECT id, title, contents_type FROM category_top_items ORDER BY order_number");
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/sub/list', function(req, res){
  const category_top_id = req.body.data.category_top_id;

  let querySelect = '';
  if(category_top_id === 0){
    querySelect = mysql.format("SELECT id, title FROM category_sub_items WHERE title<>'기타'");
  }else{
    querySelect = mysql.format("SELECT id, title FROM category_sub_items WHERE category_top_id=? ORDER BY order_number", [category_top_id]);
  }
   
  
  db.SELECT(querySelect, {}, (result) => {

    if(category_top_id === 0){
      //기타 data
      const data = {
        id: Types.category_total_etc_id, //전체 카테고리의 기타는 하나만 묶여서 보여야 함.. 9999로 별도 처리
        title: '기타'
      }
      result.push(data);
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/get/info', function(req, res){
  const category_sub_item_id = req.body.data.category_sub_item_id;

  const querySelect = mysql.format("SELECT category_top_id, id AS category_sub_id FROM category_sub_items AS category_sub_item WHERE category_sub_item.id=?", [category_sub_item_id])
  db.SELECT(querySelect, {}, (result) => {

    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '카테고리 정보 조회 에러',
        result: {}
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          category_top_id: data.category_top_id,
          category_sub_id: data.category_sub_id
        }
      }
    })
  })
})

router.post('/any/items/list', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const category_top_item_id = req.body.data.category_top_item_id;
  const category_sub_item_ids = req.body.data.category_sub_item_ids;

  const contents_filter_selects = req.body.data.contents_filter_selects;
  const contents_sort_select_type = req.body.data.contents_sort_select_type;

  // let queryString = ""
  let query_category_top_item_id = ''
  let query_category_sub_item_ids = '';

  let query_category_filter_selects = '';

  let datas = [Types.store.STATE_APPROVED, Types.item_state.SALE_STOP];
  if(category_top_item_id === 0){
    query_category_top_item_id = '';
  }
  else{
    query_category_top_item_id = 'AND item.category_top_item_id=?';
    datas.push(category_top_item_id);
  }

  if(category_sub_item_ids.length === 0){
    query_category_sub_item_ids = '';
  }else{
    query_category_sub_item_ids = 'AND item.category_sub_item_id IN (?)';
    datas.push(category_sub_item_ids);
  }

  if(contents_filter_selects.length === 0){
    query_category_filter_selects = '';
  }else{
    let filter_selects = [];
    for(let i = 0 ; i < contents_filter_selects.length ; i++){
      const data = contents_filter_selects[i];
      filter_selects.push(data.type);
    }
    query_category_filter_selects = 'AND item.product_category_type IN (?)';

    datas.push(filter_selects);
  }
    
  datas.push(limit);
  datas.push(skip);

  let query_order_by = '';
  if(contents_sort_select_type === Types.sort_category.SORT_POPULAR){
    query_order_by = 'ORDER BY COUNT(CASE WHEN orders_item.state < 100 THEN 1 END) DESC, item.view_count DESC';
  }
  else if(contents_sort_select_type === Types.sort_category.SORT_NEW){
    query_order_by = 'ORDER BY item.id DESC';
  }
  else if(contents_sort_select_type === Types.sort_category.SORT_PRICE_HIGH){
    query_order_by = 'ORDER BY item.price DESC, item.id DESC';
  }
  else if(contents_sort_select_type === Types.sort_category.SORT_PRICE_LOW){
    query_order_by = 'ORDER BY item.price, item.id DESC';
  }
  else{
    query_order_by = 'ORDER BY item.id DESC';
  }

  const querySelect = mysql.format(`SELECT item.id AS item_id FROM items AS item LEFT JOIN orders_items AS orders_item ON orders_item.item_id=item.id LEFT JOIN stores AS store ON item.store_id=store.id WHERE store.state=? AND item.state<>? ${query_category_top_item_id} ${query_category_sub_item_ids} ${query_category_filter_selects} AND item.category_top_item_id IS NOT NULL AND item.category_sub_item_id IS NOT NULL GROUP BY item.id ${query_order_by} LIMIT ? OFFSET ?`, datas);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/store/list', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const category_top_item_id = req.body.data.category_top_item_id;
  const category_sub_item_ids = req.body.data.category_sub_item_ids;

  const creator_sort_select_type = req.body.data.creator_sort_select_type;

  // let queryString = ""
  let query_category_top_item_id = ''
  let query_category_sub_item_ids = '';
  let datas = [Types.store.STATE_APPROVED, Types.item_state.SALE_STOP];
  if(category_top_item_id === 0){
    query_category_top_item_id = '';
  }
  else{
    query_category_top_item_id = 'AND item.category_top_item_id=?';
    datas.push(category_top_item_id);
  }

  if(category_sub_item_ids.length === 0){
    query_category_sub_item_ids = '';
  }else{
    query_category_sub_item_ids = 'AND item.category_sub_item_id IN (?)';
    datas.push(category_sub_item_ids);
  }
    
  datas.push(limit);
  datas.push(skip);

  let query_order_by = '';
  if(creator_sort_select_type === Types.sort_category.SORT_POPULAR){
    query_order_by = 'ORDER BY COUNT(CASE WHEN orders_item.state < 100 THEN 1 END) DESC, item.view_count DESC';
  }
  else if(creator_sort_select_type === Types.sort_category.SORT_NEW){
    query_order_by = 'ORDER BY item.id DESC';
  }
  else if(creator_sort_select_type === Types.sort_category.SORT_NAME_HIGH){
    query_order_by = 'ORDER BY store.title';
  }
  else if(creator_sort_select_type === Types.sort_category.SORT_NAME_LOW){
    query_order_by = 'ORDER BY store.title DESC';
  }
  else{
    query_order_by = 'ORDER BY item.id DESC';
  }

  const querySelect = mysql.format(`SELECT store.id AS store_id, store.title, store.user_id, store.alias FROM items AS item LEFT JOIN orders_items AS orders_item ON orders_item.item_id=item.id LEFT JOIN stores AS store ON item.store_id=store.id WHERE store.state=? AND item.state<>? ${query_category_top_item_id} ${query_category_sub_item_ids} AND item.category_top_item_id IS NOT NULL AND item.category_sub_item_id IS NOT NULL GROUP BY store.id ${query_order_by} LIMIT ? OFFSET ?`, datas);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/top/info', function(req, res){
  const category_top_item_id = req.body.data.category_top_item_id;

  const querySelect = mysql.format('SELECT title FROM category_top_items WHERE id=?', [category_top_item_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'top category 조회 오류',
        result: {}
      })
    }
    
    const data = result[0];

    return res.json({
      result: {
        state: res_state.success,
        title: data.title
      }
    })
  })
})

router.post('/any/sub/info', function(req, res){
  const category_sub_item_id = req.body.data.category_sub_item_id;

  const querySelect = mysql.format('SELECT title FROM category_sub_items WHERE id=?', [category_sub_item_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'sub category 조회 오류',
        result: {}
      })
    }
    
    const data = result[0];

    return res.json({
      result: {
        state: res_state.success,
        title: data.title
      }
    })
  })
})

module.exports = router;