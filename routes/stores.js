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

const STORE_HOME_ITEM_LIST_TAKE = 4;
const STORE_HOME_ITEM_LIST_IN_ITEM_TAKE = 3;

router.post('/order', function(req, res){

});

router.post('/any/list', function(req, res){
  let querySelect = mysql.format("SELECT store.id AS id, store.id AS store_id, alias, thumb_img_url, title, profile_photo_url FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE state=? ORDER BY RAND()", Types.store.STATE_APPROVED);

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
  // let limit = req.body.data.limit;
  // let skip = req.body.data.skip

  let type = req.body.data.type;

  let querySelect = '';
  if(type === Types.store_home_item_list.POPUALER){
    //최근 구매된 아이템
    // querySelect = mysql.format("SELECT store.title AS store_title, item.id, item.store_id, store.alias, item.price, item.title, item.img_url, nick_name FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE orders_item.state<? AND (item.state=? OR item.state=? OR item.state=?) AND store.state=? ORDER BY orders_item.id DESC LIMIT ?", [Types.order.ORDER_STATE_PAY_END, Types.item_state.SALE, Types.item_state.SALE_PAUSE, Types.item_state.SALE_LIMIT, Types.project.STATE_APPROVED, STORE_HOME_ITEM_LIST_TAKE]);

    querySelect = mysql.format("SELECT item.type_contents, store.title AS store_title, item.id, item.store_id, store.alias, item.price, item.title, item.img_url, nick_name FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE orders_item.state<? AND item.state=? AND store.state=? ORDER BY orders_item.id DESC LIMIT ?", [Types.order.ORDER_STATE_PAY_END, Types.item_state.SALE, Types.project.STATE_APPROVED, STORE_HOME_ITEM_LIST_TAKE]);

  }
  else if(type === Types.store_home_item_list.NEW_UPDATE){
    querySelect = mysql.format("SELECT item.type_contents, store.title AS store_title, item.id, item.store_id, store.alias, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.state=? AND store.state=? ORDER BY item.updated_at DESC LIMIT ?", [Types.item_state.SALE, Types.project.STATE_APPROVED, STORE_HOME_ITEM_LIST_TAKE]);
  }
  else if(type === Types.store_home_item_list.IN_ITEM){
    const store_id = req.body.data.store_id;
    querySelect = mysql.format("SELECT item.type_contents, store.title AS store_title, item.id, item.store_id, store.alias, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE (item.state=? OR item.state=? OR item.state=?) AND store.state=? AND item.store_id=? ORDER BY item.order_number ASC LIMIT ?", [Types.item_state.SALE, Types.item_state.SALE_PAUSE, Types.item_state.SALE_LIMIT, Types.project.STATE_APPROVED, store_id, STORE_HOME_ITEM_LIST_IN_ITEM_TAKE]);
  }

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })

  /*
  let limit = req.body.data.limit;
  let skip = req.body.data.skip
  let querySelect = mysql.format("SELECT item.id, item.store_id, store.alias, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.state=? AND store.state=? ORDER BY item.id DESC LIMIT ? OFFSET ?", [Types.item_state.SALE, Types.project.STATE_APPROVED, limit, skip]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
  */
})

router.post('/any/home/store/list', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  let show_ids = req.body.data.show_ids;

  let querySelect = '';
  if(show_ids.length === 0){
    querySelect = mysql.format("SELECT id AS store_id, alias FROM stores AS store WHERE store.state=? ORDER BY RAND() LIMIT ?", [Types.project.STATE_APPROVED,limit]);
  }else{
    querySelect = mysql.format("SELECT id AS store_id, alias FROM stores AS store WHERE store.state=? AND store.id NOT IN (?) ORDER BY RAND() LIMIT ?", [Types.project.STATE_APPROVED, show_ids, limit]);
  }
  

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/detail/info', function(req, res){
  const store_id = req.body.data.store_id;
  const store_alias = req.body.data.store_alias;

  const querySelect = mysql.format("SELECT store.user_id AS store_user_id, store.content AS store_content, user.nick_name, store.id, store.title, store.alias, store.thumb_img_url, store.user_id, profile_photo_url FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE store.id=? OR store.alias=?", [store_id, store_alias]);

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

  let querySelect = mysql.format("SELECT item.price_USD, item.currency_code, item.type_contents, store.title AS store_title, item.id, item.store_id, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.store_id=? AND item.state!=? AND item.order_number IS NOT NULL ORDER BY item.order_number LIMIT ? OFFSET ?", [store_id, Types.item_state.SALE_STOP, limit, skip]);

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
  const querySelect = mysql.format("SELECT item.price_USD, item.currency_code, item.category_top_item_id, item.category_sub_item_id, item.completed_type_product_answer, item.type_contents, item.id AS item_id, user.name AS user_name, user.id AS store_user_id, item.youtube_url, item.notice AS item_notice, item.product_category_type, item.ask_play_time, user.profile_photo_url, item.product_state, item.file_upload_state, store.title AS store_title, item.re_set_at, item.order_limit_count, item.state, item.ask, item.store_id, item.price, item.title, item.img_url, item.content, user.nick_name FROM items AS item LEFT JOIN stores AS store ON store.id=item.store_id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.id=?", store_item_id);
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
  // const user_id = req.body.data.user_id;
  const store_user_id = req.body.data.store_user_id;
  const querySelect = mysql.format("SELECT store.alias, store.title, store.contact, store.email, store.content, store.id AS store_id, user.nick_name, user.profile_photo_url FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE user_id=?", store_user_id);

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

  const querySelect = mysql.format("SELECT id AS store_order_id FROM orders_items WHERE store_id=? AND state < ? ORDER BY id DESC", [store_id, Types.order.ORDER_STATE_CANCEL]);
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/orders/ask/list/get", function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  let store_id = req.body.data.store_id;

  let querySelect = mysql.format("SELECT id AS store_order_id FROM orders_items WHERE store_id=? AND state < ? ORDER BY id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_CANCEL, limit, skip]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
});

//save/info 이거는 이전꺼, 시간 좀 지나면 제거
router.post('/save/info', function(req, res){
  const store_id = req.body.data.store_id;
  const title = req.body.data.title;
  // const contact = req.body.data.contact;
  // const email = req.body.data.email;
  const content = req.body.data.content;

  db.UPDATE("UPDATE stores AS store SET title=?, content=? WHERE id=?", [title, content, store_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '스토어 정보 수정 에러'
    })
  })
})

router.post('/save/info/v1', function(req, res){
  const store_id = req.body.data.store_id;
  const title = req.body.data.title;
  // const contact = req.body.data.contact;
  // const email = req.body.data.email;
  const content = req.body.data.content;
  const alias = req.body.data.alias;

  db.UPDATE("UPDATE stores AS store SET alias=?, title=?, content=? WHERE id=?", [alias, title, content, store_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '스토어 정보 수정 에러'
    })
  })
})

//take skip 이 아니라 통째로 가져옴.
router.post("/item/list/all", function(req, res){
  const store_id = req.body.data.store_id;

  let querySelect = mysql.format("SELECT item.price_USD, item.currency_code, item.type_contents, store.title AS store_title, item.state, item.order_number, item.id, item.store_id, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.store_id=? AND item.order_number IS NOT NULL ORDER BY item.order_number", [store_id]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/item/list/order/set", function(req, res){
  // const store_id = req.body.data.store_id;
  const item_order_datas = req.body.data.item_order_datas.concat();

  let _itemUpdateQueryArray = [];
  let _itemUpdateOptionArray = [];

  for(let i = 0 ; i < item_order_datas.length ; i++){
    const data = item_order_datas[i];
    let object = [{
      order_number: data.order_number,
    }, 
    data.item_id];

    let queryObject = {
      key: i,
      value: "UPDATE items AS item SET ? WHERE id=?;"
    }

    let updateItemObject = {
      key: i,
      value: object
    }

    _itemUpdateQueryArray.push(queryObject);
    _itemUpdateOptionArray.push(updateItemObject);
  }

  db.UPDATE_MULITPLEX(_itemUpdateQueryArray, _itemUpdateOptionArray, (result) => {
    return res.json({
      result: {
        state: res_state.success,

      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '업데이트 실패',
      result:{}
    })
  })

  /*
  db.UPDATE("UPDATE items AS item (id, order_number) VALUES ?", [test.map(item => [item.id, item.order_number])], 
  (result) => {
    return res.json({
      state: res_state.success,
      result:{

      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '업데이트 실패'
    })
  })
  */
});

router.post("/item/delete", function(req, res){
  const item_id = req.body.data.item_id;
  
  const querySelect = mysql.format("SELECT id FROM orders_items WHERE item_id=?", item_id);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length > 0) {
      return res.json({
        state: res_state.error,
        message: '이미 주문이 있는 상품입니다. 수정에서 판매중지 기능을 이용해주세요.',
        result:{}
      })
    }

    db.DELETE("DELETE FROM items WHERE id=?", item_id, (result) => {
      return res.json({
        result:{
          state: res_state.success
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '상품 제거 실패',
        result:{}
      })
    })
  })
});

router.post("/item/get/typecontents", function(req, res){
  const item_id = req.body.data.item_id;
  const querySelect = mysql.format("SELECT type_contents FROM items WHERE id=?", [item_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0) {
      return res.json({
        state: res_state.error,
        message: '아이템 정보 조회 에러. 새로고침 후 이용해주세요.',
        result:{}
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          type_contents: data.type_contents
        }
      }
    })
  })
})

router.post("/item/add", function(req, res){
  const store_id = req.body.data.store_id;
  const price = req.body.data.price;
  const state = req.body.data.state;
  const title = req.body.data.title;
  const img_url = req.body.data.img_url;
  const content = req.body.data.content;
  const ask = req.body.data.ask;

  const ask_play_time = req.body.data.ask_play_time;

  let completed_type_product_answer = req.body.data.completed_type_product_answer;
  if(completed_type_product_answer === undefined){
    completed_type_product_answer = '';
  }

  let type_contents = req.body.data.type_contents;
  if(type_contents === undefined){
    type_contents = Types.contents.customized;
  }

  let file_upload_state = req.body.data.file_upload_state;

  let product_state = req.body.data.product_state;
  if(!product_state){
    product_state = 0;
  }

  const img_s3_key = '';

  const order_limit_count = req.body.data.order_limit_count;

  let product_category_type = req.body.data.product_category_type;
  if(product_category_type === undefined){
    product_category_type = null;
  }

  let item_notice = req.body.data.item_notice;
  if(item_notice === undefined){
    item_notice = null;
  }

  let youtube_url = req.body.data.youtube_url;
  if(youtube_url === undefined){
    youtube_url = null;
  }

  let category_top_item_id = req.body.data.category_top_item_id;
  if(category_top_item_id === undefined){
    category_top_item_id = null;
  }

  let category_sub_item_id = req.body.data.category_sub_item_id;
  if(category_sub_item_id === undefined){
    category_sub_item_id = null;
  }

  let querySelect = mysql.format("SELECT order_number FROM items WHERE store_id=? ORDER BY order_number DESC", store_id);

  db.SELECT(querySelect, {}, (result_select) => {
    if(!result_select){
      return res.json({
        state: res_state.error,
        message: '상점 로드 오류'
      })
    }

    let _order_number = 0;
    if(result_select.length === 0){
      _order_number = 0;
    }else{
      _order_number = result_select[0].order_number;
      _order_number++;
    }

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    let re_set_at = null;
    if(order_limit_count > 0){
      //제한이 있음.
      re_set_at = moment_timezone().add(1, 'weeks').startOf('isoWeek').format("YYYY-MM-DD HH:mm:ss");
    }

    const itemData = {
      store_id: store_id,
      price: price,
      state: state,
      title: title,
      img_url: '',
      content: content,
      ask: ask,
      order_number: _order_number,
      img_s3_key: img_s3_key,
      order_limit_count: order_limit_count,
      re_set_at: re_set_at,
      file_upload_state: file_upload_state,
      product_state: product_state,
      ask_play_time: ask_play_time,
      product_category_type: product_category_type,
      notice: item_notice,
      youtube_url: youtube_url,
      completed_type_product_answer: completed_type_product_answer,
      type_contents: type_contents,
      category_top_item_id: category_top_item_id,
      category_sub_item_id: category_sub_item_id,
      created_at: date,
      updated_at: date
    }

    db.INSERT("INSERT INTO items SET ?", itemData, 
    (result_insert) => {
      return res.json({
        result: {
          state: res_state.success,
          item_id: result_insert.insertId
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '아이템 추가 에러',
        result: {}
      })
    });  
  })
});

router.post("/item/update", function(req, res){
  const store_id = req.body.data.store_id;
  const item_id = req.body.data.item_id;
  const price = req.body.data.price;
  let state = req.body.data.state;
  const title = req.body.data.title;
  // const img_url = req.body.data.img_url;
  const content = req.body.data.content;
  const ask = req.body.data.ask;
  
  const ask_play_time = req.body.data.ask_play_time;

  const file_upload_state = req.body.data.file_upload_state;
  // const img_s3_key = '';

  const order_limit_count = req.body.data.order_limit_count;

  const isChangeLimitCount = req.body.data.isChangeLimitCount;

  let product_category_type = req.body.data.product_category_type;
  if(product_category_type === undefined){
    product_category_type = null;
  }

  let item_notice = req.body.data.item_notice;
  if(item_notice === undefined){
    item_notice = null;
  }

  let product_state = req.body.data.product_state;
  if(!product_state){
    product_state = 0;
  }

  let youtube_url = req.body.data.youtube_url;
  if(youtube_url === undefined){
    youtube_url = null;
  }

  let completed_type_product_answer = req.body.data.completed_type_product_answer;
  if(completed_type_product_answer === undefined){
    completed_type_product_answer = '';
  }

  let type_contents = req.body.data.type_contents;
  if(type_contents === undefined){
    type_contents = Types.contents.customized;
  }

  let category_top_item_id = req.body.data.category_top_item_id;
  if(category_top_item_id === undefined){
    category_top_item_id = null;
  }

  let category_sub_item_id = req.body.data.category_sub_item_id;
  if(category_sub_item_id === undefined){
    category_sub_item_id = null;
  }

  const updated_at = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let re_set_at = null;
  if(order_limit_count > 0){
    //제한이 있음.
    re_set_at = moment_timezone().add(1, 'weeks').startOf('isoWeek').format("YYYY-MM-DD HH:mm:ss");
  }

  if(isChangeLimitCount){

    db.UPDATE("UPDATE items SET category_top_item_id=?, category_sub_item_id=?, type_contents=?, completed_type_product_answer=?, youtube_url=?, notice=?, product_category_type=?, ask_play_time=?, product_state=?, file_upload_state=?, updated_at=?, re_set_at=?, state=?, title=?, price=?, content=?, ask=?, order_limit_count=? WHERE id=?", [category_top_item_id, category_sub_item_id, type_contents, completed_type_product_answer, youtube_url, item_notice, product_category_type, ask_play_time, product_state, file_upload_state, updated_at, re_set_at, state, title, price, content, ask, order_limit_count, item_id], 
    (result_update) => {

      this.isSoldOutAllItemCheck(item_id, order_limit_count, (isSoldOut) => {
        if(isSoldOut){
          state = Types.item_state.SALE_LIMIT;
        }

        db.UPDATE("UPDATE items SET state=? WHERE id=?", [state, item_id], 
        (result_update) => {
          return res.json({
            result: {
              state: res_state.success,
              data: {
                state: state
              }
            }
          })
        }, (error) => {
          return res.json({
            state: res_state.error,
            message: '아이템 정보 업데이트 실패',
            result: {}
          })
        })
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '아이템 정보 업데이트 실패',
        result: {}
      })
    })
  }else{
    db.UPDATE("UPDATE items SET category_top_item_id=?, category_sub_item_id=?, type_contents=?, completed_type_product_answer=?, youtube_url=?, notice=?, product_category_type=?, ask_play_time=?, product_state=?, file_upload_state=?, updated_at=?, re_set_at=?, state=?, title=?, price=?, content=?, ask=?, order_limit_count=? WHERE id=?", [category_top_item_id, category_sub_item_id, type_contents, completed_type_product_answer, youtube_url, item_notice, product_category_type, ask_play_time, product_state, file_upload_state, updated_at, re_set_at, state, title, price, content, ask, order_limit_count, item_id], 
    (result_update) => {
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '아이템 정보 업데이트 실패',
        result: {}
      })
    })
  }
  
});

router.post("/manager/order/list", function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const store_id = req.body.data.store_id;

  const sort_state = req.body.data.sort_state;
  const sort_item_id = req.body.data.sort_item_id;

  // let querySelect = mysql.format("SELECT item.id, item.store_id, store.alias, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE orders_item.store_id=? ORDER BY item.id DESC LIMIT ? OFFSET ?", [store_id, limit, skip]);

  let querySelect = '';

  if(sort_state === 0 && sort_item_id === -1){
    querySelect = mysql.format("SELECT orders_item.total_price_USD, orders_item.currency_code, orders_item.updated_at, orders_item.confirm_at, orders_item.name, orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state < ? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_ERROR_START, limit, skip]);
  }else if(sort_item_id === -1){
    querySelect = mysql.format("SELECT orders_item.total_price_USD, orders_item.currency_code, orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state=? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, sort_state, limit, skip]);
  }else if(sort_state === 0){
    querySelect = mysql.format("SELECT orders_item.total_price_USD, orders_item.currency_code, orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.item_id=? AND orders_item.state < ? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, sort_item_id, Types.order.ORDER_STATE_ERROR_START, limit, skip]);
  }else {
    querySelect = mysql.format("SELECT orders_item.total_price_USD, orders_item.currency_code, orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.item_id=? AND orders_item.state=? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, sort_item_id, sort_state, limit, skip]);
  }

  // let querySelect = mysql.format("SELECT orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, limit, skip]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/order/all/count", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT COUNT(id) AS total_buy_count FROM orders_items WHERE store_id=? AND state<=?", [store_id, Types.order.ORDER_STATE_CANCEL]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
         state: res_state.success,
         total_buy_count: 0 
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        total_buy_count: data.total_buy_count
      }
    })
  })
})

router.post("/order/cancelrefund/count", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT COUNT(id) AS cancel_refund_total_count FROM orders_items WHERE store_id=? AND state>=? AND state<=?", [store_id, Types.order.ORDER_STATE_PAY_END, Types.order.ORDER_STATE_CANCEL]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
         state: res_state.success,
         cancel_refund_total_count: 0 
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        cancel_refund_total_count: data.cancel_refund_total_count
      }
    })
  })
})

router.post("/order/ready/count", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT COUNT(id) AS ready_total_count FROM orders_items WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_STORE_PAYMENT]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
         state: res_state.success,
         ready_total_count: 0 
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        ready_total_count: data.ready_total_count
      }
    })
  })
})

router.post("/order/saling/count", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT COUNT(id) AS ready_total_count FROM orders_items WHERE store_id=? AND (state=? OR state=? OR state=?)", [store_id, Types.order.ORDER_STATE_APP_STORE_READY, Types.order.ORDER_STATE_APP_STORE_RELAY_CUSTOMER, Types.order.ORDER_STATE_APP_STORE_PLAYING_DONE_CONTENTS]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
         state: res_state.success,
         ready_total_count: 0 
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        ready_total_count: data.ready_total_count
      }
    })
  })
})

router.post("/order/readysuccess/count", function(req, res){
  const store_id = req.body.data.store_id;

  // const querySelect = mysql.format("SELECT COUNT(id) AS ready_success_total_count FROM orders_items WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_STORE_RELAY_CUSTOMER]);

  const querySelect = mysql.format("SELECT COUNT(id) AS ready_success_total_count FROM orders_items WHERE (store_id=? AND state=?) OR (store_id=? AND state=?)", [store_id, Types.order.ORDER_STATE_APP_STORE_RELAY_CUSTOMER, store_id, Types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
         state: res_state.success,
         ready_success_total_count: 0 
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        ready_success_total_count: data.ready_success_total_count
      }
    })
  })
})

router.post("/order/comfirm/count", function(req, res){
  const store_id = req.body.data.store_id;

  // const querySelect = mysql.format("SELECT COUNT(id) AS ready_success_total_count FROM orders_items WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_STORE_RELAY_CUSTOMER]);

  const querySelect = mysql.format("SELECT COUNT(id) AS ready_success_total_count FROM orders_items WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
         state: res_state.success,
         ready_success_total_count: 0 
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        ready_success_total_count: data.ready_success_total_count
      }
    })
  })
})

router.post("/order/total/price", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT SUM(total_price) AS total_price FROM orders_items WHERE store_id=? AND state>=? AND state <?", [store_id, Types.order.ORDER_STATE_APP_STORE_READY, Types.order.ORDER_STATE_PAY_END]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
         state: res_state.success,
         total_price: 0 
        }
      })
    }

    const data = result[0];

    let _total_price = data.total_price;
    if(data.total_price === null){
      _total_price = 0;
    }
    return res.json({
      result: {
        state: res_state.success,
        total_price: _total_price
      }
    })
  })
})

router.post("/item/list/sort", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT id, title FROM items WHERE store_id=? ORDER BY order_number DESC", store_id);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/manager/account/paid/list", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT id, created_at, pay_price, paid.explain FROM paids AS paid WHERE store_id=? ORDER BY created_at DESC", store_id);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/manager/account/info", function(req, res){
  const store_id = req.body.data.store_id;
  const querySelect = mysql.format("SELECT account_name, account_number, account_bank FROM stores WHERE id=?", store_id);

  db.SELECT(querySelect, {}, (result) => {
    
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

router.post("/manager/account/info/set", function(req, res){
  const store_id = req.body.data.store_id;
  const account_name = req.body.data.account_name;
  const account_number = req.body.data.account_number;
  const account_bank = req.body.data.account_bank;

  const email = req.body.data.email;
  const contact = req.body.data.contact;

  db.UPDATE("UPDATE stores SET account_name=?, account_number=?, account_bank=?, email=?, contact=? WHERE id=?", [account_name, account_number, account_bank, email, contact, store_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '계좌정보 업데이트 실패',
      result: {}
    })
  })
});

router.post("/any/info/storeid", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT user_id AS store_user_id FROM stores WHERE id=?", store_id);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '상점 정보가 없습니다.',
        result:{}
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...result[0]
        }
      }
    })
  })
});

router.post("/any/info/itemid", function(req, res){
  const store_item_id = req.body.data.store_item_id;

  const querySelect = mysql.format("SELECT store.user_id AS store_user_id, store.alias, store.title, store.content, store.id AS store_id, user.profile_photo_url FROM items AS item LEFT JOIN stores AS store ON store.id=item.store_id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.id=?", store_item_id);

  // const querySelect = mysql.format("SELECT * FROM items WHERE id=?", store_item_id);

  db.SELECT(querySelect, {}, (result) => {

    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: {}
        }
      })
    }
    return res.json({
      result: {
        state: res_state.success,
        data: result[0]
      }
    })
  })
})

router.post("/any/sns/list", function(req, res){
  const store_user_id = req.body.data.store_user_id;
  
  const querySelect = mysql.format("SELECT img_store_url, channel.url AS link_url, channel.id FROM channels AS channel LEFT JOIN categories_channels AS categories_channel ON channel.categories_channel_id=categories_channel.id WHERE user_id=?", store_user_id);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/sns/channel/list", function(req, res){
  const store_user_id = req.body.data.store_user_id;

  const querySelect = mysql.format("SELECT id AS channel_id, categories_channel_id, channel.url AS channel_link_url FROM channels AS channel WHERE channel.user_id=?", store_user_id);

  db.SELECT(querySelect, {}, 
    (result) => {
      return res.json({
        result: {
          state: res_state.success,
          list: result
        }
      })
    })
})

router.post("/sns/channel/category/list", function(req, res){
  const querySelect = mysql.format("SELECT id, title FROM categories_channels ORDER BY order_number ASC");

  db.SELECT(querySelect, {}, 
    (result) => {
      return res.json({
        result: {
          state: res_state.success,
          list: result
        }
      })
    })
})

router.post("/channels/remove", function(req, res){
  const store_user_id = req.body.data.store_user_id;
  const channels = req.body.data.channels;

  let _channelDeleteQueryArray = [];
  let _channelDeleteOptionArray = [];

  for(let i = 0 ; i < channels.length ; i++){
    const data = channels[i];
    let queryObject = {
      key: i,
      value: "DELETE FROM channels WHERE id=?;"
    }

    let deleteItemObject = {
      key: i,
      value: data.channel_id
    }

    _channelDeleteQueryArray.push(queryObject);
    _channelDeleteOptionArray.push(deleteItemObject);
  }

  db.DELETE_MULITPLEX(_channelDeleteQueryArray, _channelDeleteOptionArray, (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '채널 제거 실패',
      result:{}
    })
  })
})

router.post("/channels/add", function(req, res){
  const store_user_id = req.body.data.store_user_id;
  const channels = req.body.data.channels;

  let _channelInsertQueryArray = [];
  let _channelInsertOptionArray = [];

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  for(let i = 0 ; i < channels.length ; i++){
    const data = channels[i];
    let queryObject = {
      key: i,
      value: "INSERT INTO channels SET ?;"
    }

    let channel_object = {
      user_id: store_user_id,
      categories_channel_id: data.categories_channel_id,
      url: data.channel_link_url,
      created_at: date,
      updated_at: date
    };

    let insertChannelObject = {
      key: i,
      value: channel_object
    }

    _channelInsertQueryArray.push(queryObject);
    _channelInsertOptionArray.push(insertChannelObject);
  }

  db.INSERT_MULITPLEX(_channelInsertQueryArray, _channelInsertOptionArray, (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '채널 추가 실패',
      result:{}
    })
  })
})

router.post("/channels/update", function(req, res){
  const store_user_id = req.body.data.store_user_id;
  const channels = req.body.data.channels;

  let _channelUpdateQueryArray = [];
  let _channelUpdateOptionArray = [];

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  for(let i = 0 ; i < channels.length ; i++){
    const data = channels[i];
    let object = [{
      categories_channel_id: data.categories_channel_id,
      url: data.channel_link_url,
      updated_at: date
    }, 
    data.channel_id];

    let queryObject = {
      key: i,
      value: "UPDATE channels SET ? WHERE id=?;"
    }

    let updateChannelObject = {
      key: i,
      value: object
    }

    _channelUpdateQueryArray.push(queryObject);
    _channelUpdateOptionArray.push(updateChannelObject);
  }

  db.UPDATE_MULITPLEX(_channelUpdateQueryArray, _channelUpdateOptionArray, (result) => {
    return res.json({
      result: {
        state: res_state.success,

      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '업데이트 실패',
      result:{}
    })
  })
})

router.post("/item/state/check", function(req, res){
  const store_item_id = req.body.data.store_item_id;

  const querySelect = mysql.format("SELECT state FROM items WHERE id=?", store_item_id);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '아이템 조회 오류',
        result: {}
      })
    }

    // console.log(req.body.data.user_id);
    // console.log(store_item_id);
    // console.log(result);

    return res.json({
      result: {
        state: res_state.success,
        item_state: result[0].state
      }
    })
  })
});

router.post("/item/soldout/check", function(req, res){
  const item_id = req.body.data.item_id;
  const order_limit_count = req.body.data.order_limit_count;

  this.isSoldOutAllItemCheck(item_id, order_limit_count, 
  (isSoldOut) => {
    return res.json({
      result: {
        state: res_state.success,
        isSoldOut: isSoldOut
      }
    })
  })
});

router.post("/item/order/quantity", function(req, res){
  const item_id = req.body.data.item_id;
  const querySelect = mysql.format("SELECT order_limit_count, state FROM items WHERE id=?", item_id);

  db.SELECT(querySelect, {}, (result) => {
    const data = result[0];
    const order_limit_count = data.order_limit_count;
    const state = data.state;

    if(state === Types.item_state.SALE_LIMIT){
      this.isSoldOutAllItemCheck(item_id, order_limit_count, 
      (isSoldOut) => {
        if(isSoldOut){
          //취소를 했는데 여전히 솔드아웃??
          console.log("#### soldout??" + item_id);
          return res.json({
            result: {
              state: res_state.success
            }
          })
        }

        db.UPDATE("UPDATE items SET state=? WHERE id=?", [Types.item_state.SALE, item_id], (result_update) => {
          return res.json({
            result: {
              state: res_state.success
            }
          })
        })
      })
    }else{
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }
  })
});

router.post("/item/order/islast", function(req, res){
  const item_id = req.body.data.item_id;
  const store_item_order_id = req.body.data.store_item_order_id;

  this.isLastOrderCheck(item_id, store_item_order_id, (isLastOrder) => {
    
    if(isLastOrder){
      db.UPDATE("UPDATE items SET state=? WHERE id=?", [Types.item_state.SALE_LIMIT, item_id], 
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
    else{
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }
  })
})

router.post("/file/order/list", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  let file_upload_target_type = req.body.data.file_upload_target_type;
  if(file_upload_target_type === undefined){
    file_upload_target_type = Types.file_upload_target_type.orders_items;
  }

  const querySelect = mysql.format("SELECT id, url, mimetype, originalname, expired_at FROM files WHERE target_id=? AND target_type=?", [store_order_id, file_upload_target_type]);

  db.SELECT(querySelect, {}, (result) => {

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];
      const isExpired = Util.isExpireTime(data.expired_at);
      result[i].isExpired = isExpired;
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/file/set/orderid", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const filesInsertID = req.body.data.filesInsertID;

  let _orders_itemsUpdateQueryArray = [];
  let _orders_itemsUpdateOptionArray = [];

  for(let i = 0 ; i < filesInsertID.length ; i++){
    const data = filesInsertID[i];
    let object = [{
      target_id: store_order_id,
    }, 
    data.file_id];

    let queryObject = {
      key: i,
      value: "UPDATE files SET ? WHERE id=?;"
    }

    let updateOrdersItemsObject = {
      key: i,
      value: object
    }

    _orders_itemsUpdateQueryArray.push(queryObject);
    _orders_itemsUpdateOptionArray.push(updateOrdersItemsObject);
  }

  db.UPDATE_MULITPLEX(_orders_itemsUpdateQueryArray, _orders_itemsUpdateOptionArray, (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '업데이트 실패',
      result:{}
    })
  })
});

router.post("/product/text/save", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const product_text = req.body.data.product_text;
  const product_title_text = req.body.data.product_title_text;

  db.UPDATE("UPDATE orders_items SET product_title_text=?, product_text=? WHERE id=?", [product_title_text, product_text, store_order_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '상품 텍스트 저장 오류',
      result: {}
    })
  })
});

router.post("/product/text/get", function(req, res){
  const store_order_id = req.body.data.store_order_id;

  let querySelect = mysql.format("SELECT product_text, product_title_text FROM orders_items WHERE id=?", store_order_id);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '주문 정보 조회 오류',
        result: {}
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        product_text: data.product_text,
        product_title_text: data.product_title_text
      }
    })
  })
});


isLastOrderCheck = (item_id, store_item_order_id, callback) => {
  // let thisWeekStart_at = moment_timezone().startOf('isoWeek').format("YYYY-MM-DD HH:mm:ss");

  const queryItemSelect = mysql.format("SELECT re_set_at FROM items WHERE id=?", item_id);
  db.SELECT(queryItemSelect, {}, (result_select_items) => {
    const data = result_select_items[0];
    let thisWeekStart_at = moment_timezone(data.re_set_at).subtract(1, 'weeks').format("YYYY-MM-DD HH:mm:ss");

    const storeOrderSelect = mysql.format("SELECT orders_item.id, item.order_limit_count FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.item_id=? AND orders_item.state<? AND orders_item.created_at>?", [item_id, Types.order.ORDER_STATE_PAY_END, thisWeekStart_at]);
    db.SELECT(storeOrderSelect, {}, (item_orders_select) => {
        let order_limit_count = 0;
        let orderCounter = 0;
        let isLastOrder = false;
        for(let i = 0 ; i < item_orders_select.length ; i++){
            orderCounter++;

            const data = item_orders_select[i];
            order_limit_count = data.order_limit_count;
            if(order_limit_count === 0){
                // console.log("무제한 구매");
                break;
            }

            if(data.id === store_item_order_id){
                if(orderCounter === order_limit_count){
                    isLastOrder = true;
                }else{
                }
                break;
            }
        }

        callback(isLastOrder);
        // return isSoldOut;
    });
  });
}

isSoldOutAllItemCheck = (item_id, order_limit_count, callback) => {
  // let thisWeekStart_at = moment_timezone().startOf('isoWeek').format("YYYY-MM-DD HH:mm:ss");

  const queryItemSelect = mysql.format("SELECT re_set_at FROM items WHERE id=?", item_id);
  db.SELECT(queryItemSelect, {}, (result_select_items) => {
    const data = result_select_items[0];

    if(data.re_set_at === null){
      callback(false);
      return
    }

    let thisWeekStart_at = moment_timezone(data.re_set_at).subtract(1, 'weeks').format("YYYY-MM-DD HH:mm:ss");

    const storeOrderSelect = mysql.format("SELECT orders_item.id FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.item_id=? AND orders_item.state<? AND orders_item.created_at>?", [item_id, Types.order.ORDER_STATE_PAY_END, thisWeekStart_at]);
    db.SELECT(storeOrderSelect, {}, (item_orders_select) => {
        let orderCounter = 0;
        let isSoldOut = false;
        for(let i = 0 ; i < item_orders_select.length ; i++){
            orderCounter++;

            const data = item_orders_select[i];
            if(order_limit_count === 0){
                // console.log("무제한 구매");
                break;
            }

            
            if(orderCounter >= order_limit_count){
                // console.log("품절됨");
                isSoldOut = true;
                break;
            }else{
                // console.log("통과");
            }          
        }

        callback(isSoldOut);
        // return isSoldOut;
    });
  })
}

router.post("/eventplaytime/select", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const event_play_time_id = req.body.data.event_play_time_id;
  const select_time = req.body.data.select_time;

  db.UPDATE("UPDATE event_play_times SET select_time=? WHERE id=? AND store_order_id=?", [select_time, event_play_time_id, store_order_id], (result_update) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '시간 정보 수정 에러'
    })
  })
});

router.post("/eventplaytime/set", function(req, res){
  const store_order_id = req.body.data.store_order_id;

  const event_play_times = req.body.data.event_play_times;

  let _eventPlayTimeInsertQueryArray = [];
  let _eventPlayTimeInsertOptionArray = [];

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  for(let i = 0 ; i < event_play_times.length ; i++){
    const data = event_play_times[i];
    let queryObject = {
      key: i,
      value: "INSERT INTO event_play_times SET ?;"
    }

    let eventPlayTime_object = {
      store_order_id: store_order_id,
      start_time: data.start_time,
      end_time: data.end_time,
      select_time: null,
      created_at: date,
      updated_at: date
    };

    let insertEventPlayTimeObject = {
      key: i,
      value: eventPlayTime_object
    }

    _eventPlayTimeInsertQueryArray.push(queryObject);
    _eventPlayTimeInsertOptionArray.push(insertEventPlayTimeObject);
  }

  db.INSERT_MULITPLEX(_eventPlayTimeInsertQueryArray, _eventPlayTimeInsertOptionArray, (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '시간 추가 실패',
      result:{}
    })
  })
});

router.post("/eventplaytime/get", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const querySelect = mysql.format("SELECT id, start_time, end_time, select_time FROM event_play_times WHERE store_order_id=?", store_order_id);

  db.SELECT(querySelect, {}, (result) => {
    // if(result.length === 0){
    //   return res.json({
    //     state: res_state.error,
    //     message: '시간 정보 조회 오류',
    //     result:{}
    //   })
    // }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/eventplaytime/select/get", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const querySelect = mysql.format("SELECT id, select_time FROM event_play_times WHERE store_order_id=? AND select_time IS NOT NULL", store_order_id);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result:{
          state: res_state.success,
          select_time: ''
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        select_time: result[0].select_time
      }
    })
  })
})

router.post("/order/detailask/set", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const product_detail_ask = req.body.data.product_detail_ask;

  db.UPDATE("UPDATE orders_items SET product_detail_ask=? WHERE id=?", [product_detail_ask, store_order_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '주문 디테일 요청 정보 수정 에러'
    })
  })
});

router.post("/order/detailask/get", function(req, res){
  const store_order_id = req.body.data.store_order_id;
  const querySelect = mysql.format("SELECT product_detail_ask FROM orders_items WHERE id=?", store_order_id);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '디테일 요청사항 조회 오류',
        result:{}
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        product_detail_ask: result[0].product_detail_ask
      }
    })
  })
})

const COMMISION_PERCENTAGE = 15;
router.post("/manager/payment/info", function(req, res){
  const store_id = req.body.data.store_id;

  const nowDate = moment_timezone();
  //범위 구하기
  let startDate = '';
  let endDate = '';
  let paymentDate = '';
  if(nowDate.date() === 1){
    //전달 1일 ~ 16일 전달
    startDate = moment_timezone(nowDate).add(-1, 'months').format("YYYY-MM-01 00:00:00");
    endDate = moment_timezone(nowDate).add(-1, 'months').format("YYYY-MM-15 23:59:59");

    paymentDate = moment_timezone(nowDate).format("YYYY-MM-01 00:00:00");
    
  }
  else if(nowDate.date() <= 16){
    startDate = moment_timezone(nowDate).add(-1, 'months').format("YYYY-MM-16 00:00:00");
    let endDays = moment_timezone(startDate).daysInMonth();

    endDate = moment_timezone(startDate).format("YYYY-MM-"+endDays+" 23:59:59");

    paymentDate = moment_timezone(nowDate).format("YYYY-MM-16 00:00:00");
  }
  else if(nowDate.date() > 16){
    startDate = moment_timezone(nowDate).format("YYYY-MM-01 00:00:00");
    endDate = moment_timezone(nowDate).format("YYYY-MM-15 23:59:59");

    paymentDate = moment_timezone(nowDate).add(1, 'months').format("YYYY-MM-01 00:00:00");
  }

  // const selectQuery = mysql.format("SELECT orders_item.total_price_USD, orders_item.currency_code, orders_item.total_price, orders_item.id, orders_item.confirm_at, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state=? AND orders_item.confirm_at IS NOT NULL AND orders_item.confirm_at>=? AND orders_item.confirm_at<=? ORDER BY id DESC", [store_id, Types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE, startDate, endDate]);

  const selectQuery = mysql.format("SELECT orders_item.total_price_USD, orders_item.currency_code, orders_item.total_price, orders_item.id, orders_item.confirm_at, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state=? AND orders_item.confirm_at IS NOT NULL AND orders_item.confirm_at>=? AND orders_item.confirm_at<=? AND orders_item.currency_code=? ORDER BY id DESC", [store_id, Types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE, startDate, endDate, Types.currency_code.Won]);

  db.SELECT(selectQuery, {}, (result) => {

    for(let i = 0 ; i < result.length ; i++){
      result[i].confirm_at = moment_timezone(result[i].confirm_at).format("YYYY-MM-DD");
      result[i].commission = result[i].total_price * (COMMISION_PERCENTAGE/100);
      result[i].payment_price = result[i].total_price - result[i].commission;
    }

    return res.json({
      result: {
        state: res_state.success,
        next_deposit_date: paymentDate,
        standard_payment_date_start: startDate,
        standard_payment_date_end: endDate,
        list: result
      }
    })
  })
});

router.post("/any/tags/get", function(req, res){
  const item_id = req.body.data.item_id;

  const selectQuery = mysql.format("SELECT categories_tag.tag FROM item_tags AS item_tag LEFT JOIN categories_tags AS categories_tag ON item_tag.categories_tag_id=categories_tag.id WHERE item_tag.item_id=?", [item_id]);

  db.SELECT(selectQuery, {}, (result) => {
    
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })

  })
})

router.post("/any/like/count", function(req, res){
  const item_id = req.body.data.item_id;
  const selectQuery = mysql.format("SELECT count(id) AS order_count FROM orders_items WHERE item_id=? AND state=?", [item_id, Types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE]);

  db.SELECT(selectQuery, {}, (result) => {

    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          order_count: 0
        }
      })
    }
    
    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        order_count: data.order_count
      }
    })
  })
})

router.post("/any/averageday", function(req, res){
  const item_id = req.body.data.item_id;
  const selectQuery = mysql.format("SELECT apporve_at, relay_at FROM orders_items AS orders_item WHERE item_id=? AND relay_at IS NOT NULL ORDER BY id DESC LIMIT ?", [item_id, 5])

  db.SELECT(selectQuery, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/any/item/other/get", function(req, res){
  const store_id = req.body.data.store_id;
  const item_id = req.body.data.item_id;

  const querySelect = mysql.format("SELECT id, title, img_url, price, price_USD, currency_code FROM items WHERE store_id=? AND id<>? AND state=?", [store_id, item_id, Types.item_state.SALE])
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/any/order/review/get", function(req, res){
  const store_id = req.body.data.store_id;

  //최근 주문 10건만 가져온다.
  const querySelect = mysql.format("SELECT orders_item.id, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id LEFT JOIN comments AS comment ON comment.second_target_id=orders_item.id WHERE orders_item.store_id=? AND product_answer IS NOT NULL AND product_answer<>? AND comment.second_target_type=? ORDER BY orders_item.id DESC LIMIT ?", [store_id, '', Types.comment.second_target_type[0].value, 10]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/any/file/item/list", function(req, res){
  const store_item_id = req.body.data.store_item_id;
  let file_upload_target_type = req.body.data.file_upload_target_type;
  if(file_upload_target_type === undefined){
    file_upload_target_type = Types.file_upload_target_type.items_images;
  }

  const querySelect = mysql.format("SELECT id, url, mimetype, originalname FROM items_imgs WHERE target_id=? AND target_type=?", [store_item_id, file_upload_target_type]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/file/download/list", function(req, res){
  const store_item_id = req.body.data.store_item_id;
  const file_upload_target_type = req.body.data.file_upload_target_type;

  const querySelect = mysql.format("SELECT id, url, size, originalname, file_s3_key FROM files_downloads WHERE target_id=? AND target_type=?", [store_item_id, file_upload_target_type]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/file/item/delete", function(req, res){
  const items_img_id = req.body.data.items_img_id;
  db.DELETE("DELETE FROM items_imgs WHERE id=?", items_img_id, (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '이미지 DB 삭제 실패',
      result:{}
    })
  })
});

router.post("/file/download/delete", function(req, res){
  const files_downloads_id = req.body.data.files_downloads_id;
  db.DELETE("DELETE FROM files_downloads WHERE id=?", files_downloads_id, (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '이미지 DB 삭제 실패',
      result:{}
    })
  })
});

router.post("/file/set/itemsimgs/itemid", function(req, res){
  const store_item_id = req.body.data.store_item_id;
  const filesInsertID = req.body.data.filesInsertID;

  let _orders_itemsUpdateQueryArray = [];
  let _orders_itemsUpdateOptionArray = [];

  for(let i = 0 ; i < filesInsertID.length ; i++){
    const data = filesInsertID[i];
    let object = [{
      target_id: store_item_id,
    }, 
    data.file_id];

    let queryObject = {
      key: i,
      value: "UPDATE items_imgs SET ? WHERE id=?;"
    }

    let updateOrdersItemsObject = {
      key: i,
      value: object
    }

    _orders_itemsUpdateQueryArray.push(queryObject);
    _orders_itemsUpdateOptionArray.push(updateOrdersItemsObject);
  }

  db.UPDATE_MULITPLEX(_orders_itemsUpdateQueryArray, _orders_itemsUpdateOptionArray, (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '업데이트 실패',
      result:{}
    })
  })
});

router.post("/file/set/downloadfiles/itemid", function(req, res){
  const store_item_id = req.body.data.store_item_id;
  const filesInsertID = req.body.data.filesInsertID;

  let _orders_itemsUpdateQueryArray = [];
  let _orders_itemsUpdateOptionArray = [];

  for(let i = 0 ; i < filesInsertID.length ; i++){
    const data = filesInsertID[i];
    let object = [{
      target_id: store_item_id,
    }, 
    data.file_id];

    let queryObject = {
      key: i,
      value: "UPDATE files_downloads SET ? WHERE id=?;"
    }

    let updateOrdersItemsObject = {
      key: i,
      value: object
    }

    _orders_itemsUpdateQueryArray.push(queryObject);
    _orders_itemsUpdateOptionArray.push(updateOrdersItemsObject);
  }

  db.UPDATE_MULITPLEX(_orders_itemsUpdateQueryArray, _orders_itemsUpdateOptionArray, (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '업데이트 실패',
      result:{}
    })
  })
});

router.post("/notice/list", function(req, res){
  const selectQuery = mysql.format("SELECT contents, contents_img_url, link FROM notice_stores")

  db.SELECT(selectQuery, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/order/new/list", function(req, res){
  const store_id = req.body.data.store_id;

  const selectQuery = mysql.format("SELECT item.price_USD, item.currency_code, orders_item.created_at, orders_item.id AS store_order_id, item.title, item.price, item.img_url FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state=? ORDER BY orders_item.id DESC", [store_id, Types.order.ORDER_STATE_APP_STORE_PAYMENT]);

  db.SELECT(selectQuery, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

const MAX_ALIAS_LENGTH = 32;

router.post("/alias/check", function(req, res){
  const alias = req.body.data.store_alias;
  const store_id = req.body.data.store_id;

  let warning_text = '';
  if(Util.checkPatternSpecial(alias.charAt(0))){
    // console.log("특수문자가 있음");
    warning_text = '첫글자는 특수문자가 올 수 없습니다.';
  }else if(Util.checkPatternSpecialInAlias(alias)){
    warning_text = '특수문자는 _ 만 입력이 가능합니다.';
  }else if(Util.checkPatternKor(alias)){
    warning_text = '한글은 입력 불가능합니다.';
  }else if(alias.length === MAX_ALIAS_LENGTH){
    warning_text = '32자 이내만 가능합니다';
  }

  if(warning_text !== ''){
    return res.json({
      result: {
        state: res_state.success,
        warning_text: warning_text
      }
    })
  }

  const selectQuery = mysql.format("SELECT id FROM stores WHERE alias=?", [alias]);

  db.SELECT(selectQuery, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          warning_text: ''
        }
      })
    }

    const data = result[0];
    if(data.id === store_id){
      return res.json({
        result: {
          state: res_state.success,
          warning_text: ''
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        warning_text: '이 상점 링크는 이미 존재합니다.'
      }
    })
  })
})

router.post('/any/viewcount/store/add', function(req, res){
  const store_id = req.body.data.store_id;

  db.UPDATE("UPDATE stores AS store SET view_count=view_count+1 WHERE id=?", [store_id], 
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
});

router.post('/any/viewcount/item/add', function(req, res){
  const item_id = req.body.data.item_id;

  db.UPDATE("UPDATE items AS item SET view_count=view_count+1 WHERE id=?", [item_id], 
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
});

router.post('/any/item/info/first', function(req, res){
  const store_id = req.body.data.store_id;

  const selectQuery = mysql.format("SELECT title, price, img_url, id, currency_code, price_USD FROM items AS item WHERE item.store_id=? AND item.state=? ORDER BY item.order_number", [store_id, Types.item_state.SALE]);

  db.SELECT(selectQuery, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '아이템이 없습니다. id: ' + store_id,
        result:{}
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        data: result[0]
      }
    })
  })
});

router.post('/any/download/file/count', function(req, res){
  const store_item_id = req.body.data.store_item_id;

  const querySelect = mysql.format("SELECT COUNT(id) AS file_count FROM files_downloads WHERE target_id=? AND target_type=?", [store_item_id, Types.file_upload_target_type.download_file]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          file_count: 0
        }
      })
    }
    
    return res.json({
      result: {
        state: res_state.success,
        file_count: result[0].file_count
      }
    })
  })
})

router.post('/expired/download/valid', function(req, res){
  const store_order_id = req.body.data.store_order_id;

  const querySelect = mysql.format("SELECT down_expired_at FROM orders_items WHERE id=?", [store_order_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'expired time error',
        result:{}
      })
    }

    const down_expired_at = result[0].down_expired_at;
    if(down_expired_at === null){
      return res.json({
        result: {
          state: res_state.success,
          data: {
            isExpired: false
          }
        }
      })
    }

    let isExpired = Util.isExpireTime(down_expired_at);
    console.log(isExpired);
    // const _down_expired_at = moment_timezone(down_expired_at).format('YYYY-MM-DD');

    return res.json({
      result: {
        state: res_state.success,
        data: {
          isExpired: isExpired
        }
      }
    })
  })
});

router.post('/expired/download', function(req, res){
  const store_order_id = req.body.data.store_order_id;

  const querySelect = mysql.format("SELECT down_expired_at FROM orders_items WHERE id=?", [store_order_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'expired time error',
        result:{}
      })
    }

    const down_expired_at = result[0].down_expired_at;
    if(down_expired_at === null){
      return res.json({
        state: res_state.error,
        message: 'expired time error',
        result:{}
      })
    }

    const _down_expired_at = moment_timezone(down_expired_at).format('YYYY-MM-DD');

    return res.json({
      result: {
        state: res_state.success,
        data: {
          down_expired_at: _down_expired_at
        }
      }
    })
  })
})

router.post("/delete/item/valid", function(req, res){
  const item_id = req.body.data.item_id;
  
  const querySelect = mysql.format("SELECT COUNT(id) AS order_count FROM orders_items WHERE item_id=?", item_id);
  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '삭제 가능 정보 조회 에러. 새로고침 후 다시 이용해주세요',
        result:{}
      })
    }

    const data = result[0];
    
    if(data.order_count > 0) {
      return res.json({
        result: {
          state: res_state.success,
          data: {
            isValid: false
          }
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        data: {
          isValid: true
        }
      }
    })
  })
})

router.post("/delete/filesdownload", function(req, res){
  const target_type = req.body.data.target_type;
  const target_id = req.body.data.target_id;

  const querySelect = mysql.format("SELECT id FROM files_downloads WHERE target_id=? AND target_type=?", [target_id, target_type]);

  db.SELECT(querySelect, {}, (result) => {
    let _deleteQueryArray = [];
    let _deleteOptionArray = [];

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];
      let queryObject = {
        key: i,
        value: "DELETE FROM files_downloads WHERE id=?;"
      }

      let deleteItemObject = {
        key: i,
        value: data.id
      }

      _deleteQueryArray.push(queryObject);
      _deleteOptionArray.push(deleteItemObject);
    }

    db.DELETE_MULITPLEX(_deleteQueryArray, _deleteOptionArray, (result) => {
      return res.json({
        result:{
          state: res_state.success
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '파일 제거 실패',
        result:{}
      })
    })
  })
})

router.post("/order/doller/count", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT COUNT(id) AS doller_count FROM orders_items WHERE store_id=? AND currency_code=?", [store_id, Types.currency_code.US_Dollar]);
  db.SELECT(querySelect, {}, (result) => {
    const doller_count = result[0].doller_count;
    return res.json({
      result: {
        state: res_state.success,
        doller_count: doller_count
      }
    })
  })
})

module.exports = router;