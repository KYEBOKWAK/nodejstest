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
  
  let tailQuery = '';
  if(thumbnails_type === Types.thumbnails.landing_magazine){
    tailQuery = ' ORDER BY order_number'
  }else{
    tailQuery = ' ORDER BY RAND()'
  }

  const querySelect = mysql.format("SELECT target_id, type, thumb_img_url, first_text, second_text, first_text_eng, second_text_eng FROM main_thumbnails WHERE type=?" + tailQuery, [thumbnails_type]);

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

  let queryTail = '';
  for(let i = 0 ; i < search_text.length ; i++){
    const data = search_text[i];
    if(i === 0){
      queryTail = `store.title LIKE "%${data}%"`;
    }else{
      queryTail += ` OR store.title LIKE "%${data}%"`;
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
      queryTail = `item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
    }else{
      queryTail += ` OR item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
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
      queryTail = `item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
    }else{
      queryTail += ` OR item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
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
      // queryTail = `item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
      queryTail = `project.title LIKE "%${data}%" OR categorie.title LIKE "%${data}%" OR citie.name LIKE "%${data}%"`
    }else{
      // queryTail += ` OR item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
      queryTail += `OR project.title LIKE "%${data}%" OR categorie.title LIKE "%${data}%" OR citie.name LIKE "%${data}%"`
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
      // queryTail = `item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
      queryTail = `project.title LIKE "%${data}%" OR categorie.title LIKE "%${data}%" OR citie.name LIKE "%${data}%"`
    }else{
      // queryTail += ` OR item.title LIKE "%${data}%" OR store.title LIKE "%${data}%"`;
      queryTail += `OR project.title LIKE "%${data}%" OR categorie.title LIKE "%${data}%" OR citie.name LIKE "%${data}%"`
    }
  }

  const querySelect = mysql.format(`SELECT COUNT(project.id) AS project_count FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id LEFT JOIN cities AS citie ON citie.id=project.city_id WHERE project.state=? AND (${queryTail})`, [Types.project.STATE_APPROVED]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: {
            count: 0
          }
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        data: {
          count: result[0].project_count
        }
      }
    })
  })
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
  })
})

router.post('/any/users/count', function(req, res){
  const querySelect = mysql.format("SELECT COUNT(id) AS user_count FROM users", []);

  db.SELECT(querySelect, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        data: {
          user_count: result[0].user_count
        }
      }
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

router.post('/any/notice/info', function(req, res){
  const type = req.body.data.type;
  db.SELECT("SELECT contents, contents_eng, link FROM notice_stores WHERE type=?", [type], 
  (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
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
})

router.post("/any/rolling/creator/list", function(req, res){
  db.SELECT("SELECT store.alias, store.title, user.profile_photo_url AS img_url FROM main_thumbnails AS main_thumbnail LEFT JOIN stores AS store ON main_thumbnail.target_id=store.id LEFT JOIN users AS user ON store.user_id=user.id WHERE main_thumbnail.type=? ORDER BY RAND()", [Types.thumbnails.landing_rolling_creator], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

module.exports = router;