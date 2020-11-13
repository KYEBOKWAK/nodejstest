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

// var aws = require('aws-sdk');
// var s3 = new aws.S3({ 
//   accessKeyId: process.env.AWS_S3_KEY,
//   secretAccessKey: process.env.AWS_S3_SECRET,
//   region: process.env.AWS_S3_REGION,
// });

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
  let querySelect = mysql.format("SELECT item.id, item.store_id, store.alias, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.state=? AND store.state=? ORDER BY item.id DESC LIMIT ? OFFSET ?", [Types.item_state.SALE, Types.project.STATE_APPROVED, limit, skip]);

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

  let querySelect = mysql.format("SELECT item.id, item.store_id, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.store_id=? AND item.state=? AND item.order_number IS NOT NULL ORDER BY item.order_number LIMIT ? OFFSET ?", [store_id, Types.item_state.SALE, limit, skip]);

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
  const querySelect = mysql.format("SELECT item.state, item.ask, item.store_id, item.price, item.title, item.img_url, item.content, user.nick_name FROM items AS item LEFT JOIN stores AS store ON store.id=item.store_id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.id=?", store_item_id);
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
  const querySelect = mysql.format("SELECT store.alias, store.title, store.contact, store.email, store.content, store.id AS store_id, user.nick_name FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE user_id=?", store_user_id);

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

//take skip 이 아니라 통째로 가져옴.
router.post("/item/list/all", function(req, res){
  const store_id = req.body.data.store_id;

  let querySelect = mysql.format("SELECT item.state, item.order_number, item.id, item.store_id, price, item.title, item.img_url, nick_name FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.store_id=? AND item.order_number IS NOT NULL ORDER BY item.order_number", [store_id]);

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

router.post("/item/add", function(req, res){
  const store_id = req.body.data.store_id;
  const price = req.body.data.price;
  const state = req.body.data.state;
  const title = req.body.data.title;
  const img_url = req.body.data.img_url;
  const content = req.body.data.content;
  const ask = req.body.data.ask;
  const img_s3_key = '';

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
  const state = req.body.data.state;
  const title = req.body.data.title;
  // const img_url = req.body.data.img_url;
  const content = req.body.data.content;
  const ask = req.body.data.ask;
  // const img_s3_key = '';

  db.UPDATE("UPDATE items SET state=?, title=?, price=?, content=?, ask=? WHERE id=?", [state, title, price, content, ask, item_id], 
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
    querySelect = mysql.format("SELECT orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state < ? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, Types.order.ORDER_STATE_ERROR_START, limit, skip]);
  }else if(sort_item_id === -1){
    querySelect = mysql.format("SELECT orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.state=? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, sort_state, limit, skip]);
  }else if(sort_state === 0){
    querySelect = mysql.format("SELECT orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.item_id=? AND orders_item.state < ? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, sort_item_id, Types.order.ORDER_STATE_ERROR_START, limit, skip]);
  }else {
    querySelect = mysql.format("SELECT orders_item.state, orders_item.count, orders_item.created_at, orders_item.id, orders_item.store_id, orders_item.total_price, item.title FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.store_id=? AND orders_item.item_id=? AND orders_item.state=? ORDER BY orders_item.id DESC LIMIT ? OFFSET ?", [store_id, sort_item_id, sort_state, limit, skip]);
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

router.post("/order/readysuccess/count", function(req, res){
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT COUNT(id) AS ready_success_total_count FROM orders_items WHERE store_id=? AND state=?", [store_id, Types.order.ORDER_STATE_APP_STORE_RELAY_CUSTOMER]);

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

  const querySelect = mysql.format("SELECT id, created_at, pay_price FROM paids WHERE store_id=? ORDER BY created_at DESC", store_id);

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

  // const querySelect = mysql.format("SELECT store.title, store.content, store.id AS store_id, user.profile_photo_url FROM stores AS store LEFT JOIN items AS item ON store.id=item.store_id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.id=?", store_item_id);

  const querySelect = mysql.format("SELECT store.alias, store.title, store.content, store.id AS store_id, user.profile_photo_url FROM items AS item LEFT JOIN stores AS store ON store.id=item.store_id LEFT JOIN users AS user ON store.user_id=user.id WHERE item.id=?", store_item_id);

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

module.exports = router;