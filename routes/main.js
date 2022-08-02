var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
var mysql = require('mysql');
const res_state = use('lib/res_state.js');
const Util = use('lib/util.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const global = use('lib/global_const.js');

router.post('/wait/order', function(req, res){
  const user_id = req.body.data.user_id;
  
  let orderQuery = mysql.format("SELECT ticket.category, categories_ticket.title AS categories_ticket_title, ticket.price AS ticket_price, ticket.show_date, _order.id, _order.state AS order_state, _order.project_id AS project_id, _order.created_at, project.title, project.poster_renew_url, project.isDelivery, project.type AS pay_type, merchant_uid, total_price, _order.count, _order.ticket_id FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id LEFT JOIN categories_tickets AS categories_ticket ON categories_ticket.id=ticket.category WHERE _order.user_id=? AND _order.state=? ORDER BY id DESC", [user_id, Types.order.ORDER_STATE_APP_PAY_WAIT]);
  db.SELECT(orderQuery, [], (result_order) => {
    // console.log(result_order);
    if(result_order === undefined || result_order.length === 0){
      return res.json({
        state: res_state.none,
        result: {
        }
      })
    }

    const orderData = result_order[0];

    //goods 구매 정보도 가져온다.
    let goodsQuery = mysql.format("SELECT ticket_discount, count, _goods.price, goods_id, _goods.title FROM orders_goods AS _orders_goods LEFT JOIN goods AS _goods ON _orders_goods.goods_id=_goods.id WHERE _orders_goods.order_id=?;", orderData.id);
    let discountsQuery = mysql.format("SELECT id AS discount_id, percent_value AS discount_value, content AS discount_content, submit_check AS discount_submit_check FROM discounts WHERE project_id=?;", orderData.project_id);
    let goods_discounts_query = goodsQuery+discountsQuery;
    db.SELECT_MULITPLEX(goods_discounts_query, (result_goods_discounts) => {
      // console.log(result_goods_discounts);
      const GOODS_INDEX = 0;
      const DISCOUNT_INDEX = 1;
      const goodsDatas = result_goods_discounts[GOODS_INDEX];
      const discountsDatas = result_goods_discounts[DISCOUNT_INDEX];
      // console.log(goodsDatas);

      let select_tickets = [];
      let select_goods = [];

      let _total_ticket_price = 0;
      let _total_goods_discount_ticket= 0
      let _total_goods_price= 0
      //티켓정보가 없으면 
      if(orderData.ticket_id !== null){
        const ticketObject = {
          id: orderData.ticket_id,
          count: orderData.count,
          show_date: orderData.show_date,
          price: orderData.ticket_price,
          category: orderData.category,
          categories_ticket_title: orderData.categories_ticket_title
        }

        select_tickets.push(ticketObject);

        _total_ticket_price = Number(orderData.ticket_price) * Number(orderData.count);
      }

      for(let i = 0 ; i < goodsDatas.length ; i++){
        const goodsObject = goodsDatas[i];
        const selectGoodsObject = {
          id: goodsObject.goods_id,
          count: goodsObject.count,
          title: goodsObject.title,
          discount_ticket_price: goodsObject.ticket_discount
        };
        select_goods.push(selectGoodsObject);

        _total_goods_price += Number(goodsObject.price) * Number(goodsObject.count);
        _total_goods_discount_ticket += Number(goodsObject.ticket_discount) * Number(goodsObject.count);
      }

      if(_total_ticket_price === 0){
        //티켓 값이 0원이면 할인도 안된다.
        _total_goods_discount_ticket = 0;
      }

      //총 티켓가격에서 할인가 적용한다.
      _total_ticket_price = _total_ticket_price - _total_goods_discount_ticket;
      if(_total_ticket_price < 0){
        _total_ticket_price = 0;
      }

      //날짜 체크해서 처리하기...
      const waitSec = Util.getWaitTimeSec(orderData.created_at);
      if(waitSec <= 0){
        //0보다 작으면 값을 바꿔줘야함.
        //이거 주석 풀어줘야 함. 일단 테스트로 8 고정
        
        db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [Types.order.ORDER_STATE_CANCEL_WAIT_PAY, orderData.id], (result_order_update) => {
          return res.json({
            state: res_state.none,
            result: {
            }
          });
        }, (error) => {
            
        });
        
        return;
      }
      // console.log(Util.getWaitTimeSec(orderData.created_at));

      return res.json({
        result: {
          state: res_state.success,
          toastType: Types.toastMessage.TOAST_TYPE_CONNECT_TICKETING,
          toastMessage: '',
          toastMessageData: {
            wait_sec: waitSec,
            order_id: orderData.id,
            project_id: orderData.project_id,
            total_ticket_price: _total_ticket_price,
            total_discount_price: _total_goods_discount_ticket,
            total_goods_price: _total_goods_price,

            total_price: orderData.total_price,
            merchant_uid: orderData.merchant_uid,

            select_tickets: select_tickets.concat(),
            select_goods: select_goods.concat(),

            title: orderData.title,
            poster_renew_url: orderData.poster_renew_url,
            isDelivery: orderData.isDelivery,
            pay_type: orderData.pay_type,

            discount_info: [
              ...discountsDatas
            ]
          },
        }
      })
    });
  })
});

router.post('/topthumbnail', function(req, res) {
  db.SELECT("SELECT type_rgb, title_rgb, url, title, type, target_id, target_id_name, page_key FROM maincarousel", [], function(result){
    res.json({
      result
    })
  });
});

router.post('/ticketing/list', function(req, res) {
  db.SELECT("SELECT mt.project_id AS project_id, title, poster_renew_url, project_id FROM main_thumbnails AS mt " +
            "JOIN projects AS pjt " +
            "WHERE mt.project_id = pjt.id", [],
            function(result){
              res.json({
                result
              })
            });

});

//SELECT title, poster_renew_url, id FROM projects WHERE event_type_sub != 2 ORDER BY id DESC
router.post('/all/project', function(req, res) {

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let querySelect = mysql.format("SELECT title, poster_renew_url, poster_url, id FROM projects WHERE state=? AND event_type_sub!=? ORDER BY funding_closing_at DESC", [Types.project.STATE_APPROVED, Types.project.EVENT_TYPE_SUB_SECRET_PROJECT]);

  // let querySelect = mysql.format("SELECT title, poster_renew_url, poster_url, id FROM projects WHERE state=? AND event_type_sub<>? AND funding_closing_at>? ORDER BY funding_closing_at DESC", [Types.project.STATE_APPROVED, Types.project.EVENT_TYPE_SUB_SECRET_PROJECT, date]);

  db.SELECT(querySelect, {}, function(result){
              res.json({
                result
              });

  // db.SELECT("SELECT title, poster_renew_url, poster_url, id FROM projects" +
  //           " WHERE state = ?"+
  //           " AND event_type_sub <> ?"+
  //           " ORDER BY id DESC LIMIT 13", [Types.project.STATE_APPROVED, Types.project.EVENT_TYPE_SUB_SECRET_PROJECT], function(result){
  //             res.json({
  //               result
  //             });
  });

  /*
  db.SELECT("SELECT title, poster_renew_url, id FROM projects" +
            " WHERE state = "+Types.project.STATE_APPROVED +
            " AND event_type_sub != "+Types.project.EVENT_TYPE_SUB_SECRET_PROJECT +
            " ORDER BY id DESC LIMIT 13", function(result){
    res.json({
      result
    });
  });
  */
});

router.post('/event/feed', function(req, res){
  return res.json({
    result:{
      event_image_bg_url: 'https://crowdticket0.s3-ap-northeast-1.amazonaws.com/banner/200806_banner_bg_color.png',
      event_image_url: 'https://crowdticket0.s3-ap-northeast-1.amazonaws.com/banner/200806_banner_m.png',
      event_link: 'https://docs.google.com/forms/u/1/d/e/1FAIpQLSdTjkJne_8uf0UtRgPPjq7jeGe7Hi09O2vgPWpIQM6w2xpmmA/viewform',
      info: {
        bg_height: 80,
        img_height: 62
      }
    }
  })
});

router.post('/any/thumbnails/popular/list', function(req, res){
  const thumbnails_type = req.body.data.thumbnails_type;

  const querySelect = mysql.format("SELECT project_id, target_id, type, thumb_img_url, first_text, second_text, first_text_eng, second_text_eng FROM main_thumbnails WHERE type=?", [thumbnails_type]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/thumbnails/list', function(req, res){
  const thumbnails_type = req.body.data.thumbnails_type;

  const querySelect = mysql.format("SELECT target_id, type, thumb_img_url, first_text, second_text, first_text_eng, second_text_eng FROM main_thumbnails WHERE type=?", [thumbnails_type]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/thumbnails/list/order', function(req, res){
  const thumbnails_type = req.body.data.thumbnails_type;

  const querySelect = mysql.format("SELECT target_id, type, thumb_img_url, first_text, second_text, first_text_eng, second_text_eng FROM main_thumbnails WHERE type=? ORDER BY order_number", [thumbnails_type]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/curation/get/bgcolor', function(req, res){
  const querySelect = mysql.format("SELECT target_id, type, thumb_img_url, first_text, second_text FROM main_thumbnails WHERE type=?", [Types.thumbnails.store_item_popular]);

  db.SELECT(querySelect, {}, (result) => {

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        second_text: data.second_text
      }
    })
  })
});

router.post('/any/recommand/creator', function(req, res){
  const querySelect = mysql.format("SELECT store.user_id AS store_user_id, store.title AS store_title, store.id AS store_id, store.alias, store.view_count, user.profile_photo_url, COUNT(comment.id) AS comment_count FROM stores AS store LEFT JOIN comments AS comment ON comment.commentable_id=store.id AND comment.commentable_type=? LEFT JOIN users AS user ON store.user_id=user.id WHERE store.tier=? AND store.state=? GROUP BY store.id ORDER BY RAND() LIMIT ?", ['App\\Models\\Store', Types.tier_store.sale_keep, Types.store.STATE_APPROVED, 6])

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/recommand/creator/v1', function(req, res){

  //원코드
  // const querySelect = mysql.format("SELECT store.user_id AS store_user_id, store.title AS store_title, store.id AS store_id, store.alias, store.view_count, user.profile_photo_url, COUNT(comment.id) AS comment_count FROM stores AS store LEFT JOIN comments AS comment ON comment.commentable_id=store.id AND comment.commentable_type=? LEFT JOIN users AS user ON store.user_id=user.id WHERE store.tier=? AND store.state=? GROUP BY store.id ORDER BY RAND() LIMIT ?", ['App\\Models\\Store', Types.tier_store.sale_keep, Types.store.STATE_APPROVED, 6])

  const querySelect = mysql.format("SELECT store.user_id AS store_user_id, store.title AS store_title, store.id AS store_id, store.alias, store.view_count, user.profile_photo_url, COUNT(comment.id) AS comment_count FROM stores AS store LEFT JOIN comments AS comment ON comment.commentable_id=store.id AND comment.commentable_type=? LEFT JOIN users AS user ON store.user_id=user.id WHERE store.tier=? AND store.state=? AND store.id<>? GROUP BY store.id ORDER BY RAND() LIMIT ?", ['App\\Models\\Store', Types.tier_store.sale_keep, Types.store.STATE_APPROVED, global.except_place_id, 6])

  // const querySelect = mysql.format("SELECT id AS store_id FROM stores AS store WHERE store.state=? GROUP BY store.id ORDER BY RAND() LIMIT ?", [Types.store.STATE_APPROVED, 9])

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/thumbnails/attention/list', function(req, res){
  const querySelect = mysql.format("SELECT store.id AS store_id, store.id, store.title, store.alias, store.state FROM (SELECT store.id, store.title, store.alias, store.state FROM stores AS store LEFT JOIN items AS item ON item.store_id=store.id GROUP BY store.id HAVING COUNT(CASE WHEN item.state=? THEN 1 END)>0 ) AS store WHERE store.state=? GROUP BY store.id ORDER BY store.id DESC LIMIT ?", [Types.item_state.SALE, Types.store.STATE_APPROVED, 8]); //open

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/thumbnails/event/list', function(req, res){

  const querySelect = mysql.format("SELECT id, target_id AS item_id, first_text FROM main_thumbnails AS main_thumbnail WHERE main_thumbnail.type=?", [Types.thumbnails.store_home_event]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/thumbnails/fanevent/list', function(req, res){

  const querySelect = mysql.format("SELECT id, target_id, first_text FROM main_thumbnails AS main_thumbnail WHERE main_thumbnail.type=?", [Types.thumbnails.fan_events]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/thumbnails/updates/list', function(req, res){
  const querySelect = mysql.format("SELECT item.id AS item_id FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id WHERE item.state=? AND store.state=? ORDER BY item.updated_at DESC LIMIT ?", [Types.item_state.SALE, Types.project.STATE_APPROVED, 8]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/search/stores', function(req, res){
  const search_text = req.body.data.search_text;
  if(search_text.length === 0){
    return res.json({
      result: {
        state: res_state.success,
        list: []
      }
    })
  }

  // let querySelect = mysql.format("SELECT store.id AS store_id FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE store.state=? AND store.title LIKE ?", [Types.project.STATE_APPROVED, "%"+search_text+"%"]);

  let queryTail = '';
  for(let i = 0 ; i < search_text.length ; i++){
    const data = search_text[i];
    if(i === 0){
      queryTail = `store.title LIKE '%${data}%'`;
    }else{
      queryTail += ` OR store.title LIKE '%${data}%'`;
    }
  }

  let querySelect = mysql.format(`SELECT store.id AS store_id FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE store.state=? AND (${queryTail})`, [Types.project.STATE_APPROVED]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })

})

router.post('/any/search/items', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const search_text = req.body.data.search_text;

  if(search_text.length === 0){
    return res.json({
      result: {
        state: res_state.success,
        list: []
      }
    })
  }

  let queryTail = '';
  for(let i = 0 ; i < search_text.length ; i++){
    const data = search_text[i];
    if(i === 0){
      queryTail = `item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
    }else{
      queryTail += ` OR item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
    }
  }

  // const querySelect = mysql.format(`SELECT item.id AS item_id FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id WHERE store.state=? AND item.state<>? AND (${queryTail}) GROUP BY item.id LIMIT ? OFFSET ?`, [Types.store.STATE_APPROVED, Types.item_state.SALE_STOP, limit, skip]);

  const querySelect = mysql.format(`SELECT item.id AS item_id FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN onoffs AS onoff ON onoff.store_id=store.id AND onoff.type=? WHERE (onoff.is_on IS NULL OR onoff.is_on=?) AND store.state=? AND item.state<>? AND (${queryTail}) GROUP BY item.id LIMIT ? OFFSET ?`, ['store', true, Types.store.STATE_APPROVED, Types.item_state.SALE_STOP, limit, skip]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/search/items/count', function(req, res){
  const search_text = req.body.data.search_text;

  if(search_text.length === 0){
    return res.json({
      result: {
        state: res_state.success,
        data: {
          count: 0
        },
      }
    })
  }

  let queryTail = '';
  for(let i = 0 ; i < search_text.length ; i++){
    const data = search_text[i];
    if(i === 0){
      queryTail = `item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
    }else{
      queryTail += ` OR item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
    }
  }

  // const querySelect = mysql.format(`SELECT item.id AS item_id FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id WHERE store.state=? AND item.state<>? AND (${queryTail}) GROUP BY item.id`, [Types.store.STATE_APPROVED, Types.item_state.SALE_STOP]);

  const querySelect = mysql.format(`SELECT item.id AS item_id FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN onoffs AS onoff ON onoff.store_id=store.id AND onoff.type=? WHERE (onoff.is_on IS NULL OR onoff.is_on=?) AND store.state=? AND item.state<>? AND (${queryTail}) GROUP BY item.id`, ['store', true, Types.store.STATE_APPROVED, Types.item_state.SALE_STOP]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        data: {
          count: result.length
        },
      }
    })
  })
});

router.post('/any/search/projects', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  const search_text = req.body.data.search_text;
  if(search_text.length === 0){
    return res.json({
      result: {
        state: res_state.success,
        list: []
      }
    })
  }

  let queryTail = '';
  for(let i = 0 ; i < search_text.length ; i++){
    const data = search_text[i];
    if(i === 0){
      // queryTail = `item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
      queryTail = `project.title LIKE '%${data}%' OR categorie.title LIKE '%${data}%' OR citie.name LIKE '%${data}%'`
    }else{
      // queryTail += ` OR item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
      queryTail += `OR project.title LIKE '%${data}%' OR categorie.title LIKE '%${data}%' OR citie.name LIKE '%${data}%'`
    }
  }

  const querySelect = mysql.format(`SELECT project.id AS project_id FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.state=? AND (${queryTail}) GROUP BY project.id ORDER BY project.id DESC LIMIT ? OFFSET ?`, [Types.project.STATE_APPROVED, limit, skip]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/search/projects/count', function(req, res){

  const search_text = req.body.data.search_text;
  if(search_text.length === 0){
    return res.json({
      result: {
        state: res_state.success,
        data: {
          count: 0
        }
      }
    })
  }

  let queryTail = '';
  for(let i = 0 ; i < search_text.length ; i++){
    const data = search_text[i];
    if(i === 0){
      // queryTail = `item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
      queryTail = `project.title LIKE '%${data}%' OR categorie.title LIKE '%${data}%' OR citie.name LIKE '%${data}%'`
    }else{
      // queryTail += ` OR item.title LIKE '%${data}%' OR store.title LIKE '%${data}%'`;
      queryTail += `OR project.title LIKE '%${data}%' OR categorie.title LIKE '%${data}%' OR citie.name LIKE '%${data}%'`
    }
  }

  const querySelect = mysql.format(`SELECT COUNT(project.id) AS project_count FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.state=? AND (${queryTail})`, [Types.project.STATE_APPROVED]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        data: {
          count: result[0].project_count
        }
      }
    })
  })

  /*
  const search_text = req.body.data.search_text;

  const queyrFind = "%"+search_text+"%";

  const querySelect = mysql.format("SELECT COUNT(project.id) AS project_count FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.state=? AND (project.title LIKE ? OR categorie.title LIKE ? OR citie.name LIKE ?) ", [Types.project.STATE_APPROVED, queyrFind, queyrFind, queyrFind]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        data: {
          count: result[0].project_count
        }
      }
    })
  })
  */
});

router.post('/any/search/no/recommend', function(req, res){
  const querySelect = mysql.format("SELECT item.id AS item_id FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id WHERE store.tier=? AND store.state=? AND item.state=? GROUP BY item.id ORDER BY RAND()", [Types.tier_store.sale, Types.project.STATE_APPROVED, Types.item_state.SALE]);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/carousels', function(req, res){
  const querySelect = mysql.format("SELECT img_url, title, title_eng, sub_title, sub_title_eng, bg_color, bg_img_url, bg_img_type, target_id, target_type, link_url, is_open_new_window FROM main_web_carousels WHERE order_number > 0 ORDER BY order_number");

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/stores/count', function(req, res){
  // const querySelect = mysql.format("SELECT COUNT(id) AS store_count FROM stores WHERE state=?", [Types.store.STATE_APPROVED]);
  const querySelect = mysql.format("SELECT COUNT(id) AS store_count FROM stores", []);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        data: {
          store_count: result[0].store_count
        }
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: 'dddd'
    })
  })
})

router.post('/any/items/count', function(req, res){
  // const querySelect = mysql.format("SELECT COUNT(id) AS item_count FROM items WHERE state=?", [Types.item_state.SALE]);
  const querySelect = mysql.format("SELECT COUNT(id) AS item_count FROM items", []);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        data: {
          item_count: result[0].item_count
        }
      }
    })
  })
})

router.post('/any/projects', function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip;

  // const querySelect = mysql.format("SELECT project.id AS project_id FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.state=? AND project.is_secret=? AND event_type_sub<>? GROUP BY project.id ORDER BY project.funding_closing_at DESC LIMIT ? OFFSET ?", [Types.project.STATE_APPROVED, false, Types.project.EVENT_TYPE_SUB_SECRET_PROJECT, limit, skip]);

  const querySelect = mysql.format("SELECT project.id AS project_id FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.state=? AND project.is_secret=? AND event_type_sub<>? GROUP BY project.id ORDER BY project.funding_closing_at DESC LIMIT ? OFFSET ?", [Types.project.STATE_APPROVED, false, Types.project.EVENT_TYPE_SUB_SECRET_PROJECT, limit, skip]);
  
  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/event/list', function(req, res){
  const querySelect = mysql.format("SELECT alias, text, text_eng, color_bg, color_text FROM event_pages WHERE is_home=? AND row_type=?", [true, Types.event_row_type.title]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          list: [],
          alias: null,
          text: '',
          text_eng: '',
          color_bg: null,
          color_text: null
        }
      })
    }

    const data = result[0];
    const querySelectEventItem = mysql.format("SELECT target_id AS item_id FROM event_items WHERE alias=? ORDER BY RAND() LIMIT 8", [data.alias]);
    db.SELECT(querySelectEventItem, {}, (result_event_items) => {
      return res.json({
        result: {
          state: res_state.success,
          list: result_event_items,
          alias: data.alias,
          text: data.text,
          text_eng: data.text_eng,
          color_bg: data.color_bg,
          color_text: data.color_text
        }
      })
    })
  })
})

module.exports = router;