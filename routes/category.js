var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const global = use('lib/global_const.js');

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
    querySelect = mysql.format("SELECT id, title, title_eng FROM category_sub_items WHERE title<>'기타'");
  }else{
    querySelect = mysql.format("SELECT id, title, title_eng FROM category_sub_items WHERE category_top_id=? ORDER BY order_number", [category_top_id]);
  }
   
  
  db.SELECT(querySelect, {}, (result) => {

    if(category_top_id === 0){
      //기타 data
      const data = {
        id: Types.category_total_etc_id, //전체 카테고리의 기타는 하나만 묶여서 보여야 함.. 9999로 별도 처리
        title: '기타',
        title_eng: 'etc'
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

router.post('/any/place/list/select', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  // const category_top_item_id = req.body.data.category_top_item_id;
  const category_item_ids = req.body.data.category_item_ids;
  if(category_item_ids.length === 0){
    return res.json({
      result: {
        state: res_state.success,
        list: []
      }
    })
  }

  const creator_sort_select_type = req.body.data.creator_sort_select_type;

  let queryString = ""
  let query_category_top_item_id = ''
  let query_category_item_ids = '';
  let datas = [Types.store.STATE_APPROVED, global.except_place_id];

  if(category_item_ids.length === 1 && category_item_ids[0] === 0){
    query_category_item_ids = '';
  }else{
    query_category_item_ids = 'AND select_category_place.categories_place_id IN (?)';
    datas.push(category_item_ids);
  }
    
  datas.push(limit);
  datas.push(skip);

  let query_order_by = '';
  if(creator_sort_select_type === Types.sort_category.SORT_POPULAR){
    // query_order_by = 'ORDER BY COUNT(CASE WHEN orders_item.state < 100 THEN 1 END) DESC, item.view_count DESC';
    query_order_by = 'ORDER BY COUNT(CASE WHEN orders_item.state < 100 THEN 1 END) DESC';
  }
  else if(creator_sort_select_type === Types.sort_category.SORT_NEW){
    query_order_by = 'ORDER BY store.id DESC';
  }
  else if(creator_sort_select_type === Types.sort_category.SORT_NAME_HIGH){
    query_order_by = 'ORDER BY store.title';
  }
  else if(creator_sort_select_type === Types.sort_category.SORT_NAME_LOW){
    query_order_by = 'ORDER BY store.title DESC';
  }
  else{
    query_order_by = 'ORDER BY store.id DESC';
  }

  //원코드
  // const querySelect = mysql.format(`SELECT select_category_place.store_id AS store_id FROM select_category_places AS select_category_place LEFT JOIN stores AS store ON select_category_place.store_id=store.id LEFT JOIN orders_items AS orders_item ON select_category_place.store_id=orders_item.store_id WHERE store.state=? ${query_category_item_ids} GROUP BY select_category_place.store_id ${query_order_by} LIMIT ? OFFSET ?`, datas);
  
  //특수한 이슈
  //상단에 global.except_place_id 이거 배열에서 빼야함.
  const querySelect = mysql.format(`SELECT select_category_place.store_id AS store_id FROM select_category_places AS select_category_place LEFT JOIN stores AS store ON select_category_place.store_id=store.id LEFT JOIN orders_items AS orders_item ON select_category_place.store_id=orders_item.store_id WHERE store.state=? AND store.id<>? ${query_category_item_ids} GROUP BY select_category_place.store_id ${query_order_by} LIMIT ? OFFSET ?`, datas);
  
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/place/list/select/isshow', function(req, res){
  const store_ids = req.body.data.store_ids;
  if(store_ids.length === 0){
    return res.json({
      result: {
        state: res_state.success,
        list: []
      }
    })
  }

  const querySelect = mysql.format("SELECT select_category_place.store_id, select_category_place.categories_place_id, categories_place.is_show FROM select_category_places AS select_category_place LEFT JOIN categories_places AS categories_place ON select_category_place.categories_place_id=categories_place.id WHERE select_category_place.store_id IN (?)", [store_ids]);

  db.SELECT(querySelect, {}, (result) => {
    let list = [];
    let delete_list = [];
    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];
      
      const dataIndex = list.findIndex((value) => {
        return value.store_id === data.store_id;
      });

      const deleteDataIndex = delete_list.findIndex((value) => {
        return value.store_id === data.store_id;
      });

      if(deleteDataIndex >= 0){
        //삭제해야할 데이터임
        continue;
      }

      if(dataIndex < 0){
        if(data.is_show){
          list.push(data);
        }
        
      }else{
        //값이 있는데 is_show가 false면 삭제
        if(!data.is_show){
          delete_list.push(data);
          list.splice(dataIndex, 1);
        }
      }
    }

    // console.log(list);
    return res.json({
      result: {
        state: res_state.success,
        list: list
      }
    })
  })
})

/*
router.post('/any/top/info', function(req, res){
  const category_top_item_id = req.body.data.category_top_item_id;
  const language_code = req.body.data.language_code;

  const querySelect = mysql.format('SELECT title, title_eng FROM category_top_items WHERE id=?', [category_top_item_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'top category 조회 오류',
        result: {}
      })
    }
    
    const data = result[0];

    let title = data.title
    if(language_code === Types.language.en){
      title = data.title_eng;
    }

    return res.json({
      result: {
        state: res_state.success,
        title: title
      }
    })
  })
})
*/

/*
router.post('/any/sub/info', function(req, res){
  const category_sub_item_id = req.body.data.category_sub_item_id;
  const language_code = req.body.data.language_code;

  const querySelect = mysql.format('SELECT title, title_eng FROM category_sub_items WHERE id=?', [category_sub_item_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'sub category 조회 오류',
        result: {}
      })
    }
    
    const data = result[0];

    let title = data.title
    if(language_code === Types.language.en){
      title = data.title_eng;
    }

    return res.json({
      result: {
        state: res_state.success,
        title: title
      }
    })
  })
})
*/

router.post('/any/list/get/item', function(req, res){
  const store_id = req.body.data.store_id;
  
  const querySelect = mysql.format('SELECT category_sub_item.title_eng, category_sub_item.id, category_sub_item.title FROM items AS item LEFT JOIN category_sub_items AS category_sub_item ON item.category_sub_item_id=category_sub_item.id WHERE item.store_id=? AND item.state=? AND item.category_sub_item_id IS NOT NULL GROUP BY item.category_sub_item_id', [store_id, Types.item_state.SALE]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/ad/list', function(req, res){
  const querySelect = mysql.format('SELECT id, title FROM categories_ads ORDER BY order_number ASC')

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.get('/any/place/list', function(req, res){
  const querySelect = mysql.format("SELECT id, text, text_eng, is_show FROM categories_places ORDER BY order_number");

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

const CATEGORY_PLACE_COUNT_MAX = 5;
router.post('/place/set', function(req, res){
  const store_id = req.body.data.store_id;
  const category_id = req.body.data.category_id;

  if(!store_id || !category_id){
    return res.json({
      state: res_state.error,
      message: '카테고리 추가 에러 (id값 오류)',
      result: {}
    })
  }

  const querySelect = mysql.format("SELECT COUNT(id) AS count FROM select_category_places WHERE store_id=?", [store_id]);

  db.SELECT(querySelect, {}, (result_select) => {
    if(result_select[0].count >= CATEGORY_PLACE_COUNT_MAX) {
      return res.json({
        state: res_state.error,
        message: '최대 5개만 선택 가능합니다',
        result: {}
      });
    }

    const insertData = {
      store_id: store_id,
      categories_place_id: category_id
    }

    db.INSERT("INSERT INTO select_category_places SET ?", insertData, 
    (result_insert) => {
      return res.json({
        result: {
          state: res_state.success
        }
      });
    }, (result_error) => {
      return res.json({
        state: res_state.error,
        message: '카테고리 추가 에러',
        result: {}
      })
    })
  })
})

router.post('/place/delete', function(req, res){
  const store_id = req.body.data.store_id;
  const category_id = req.body.data.category_id;

  db.DELETE("DELETE FROM select_category_places WHERE store_id=? AND categories_place_id=?", [store_id, category_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {

  })
})

router.post('/place/select/list', function(req, res){
  const store_id = req.body.data.store_id;
  if(!store_id){
    return res.json({
      state: res_state.error,
      message: '카테고리 조회 에러 (id값 오류)',
      result: {}
    })
  }

  const querySelect = mysql.format("SELECT categories_place_id AS id FROM select_category_places WHERE store_id=?", [store_id]);

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