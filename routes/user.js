var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');
var mysql = require('mysql');

var types = use('lib/types.js');

const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const moment = require('moment');

const Util = use('lib/util.js');

/*
router.get('/:id/introduce', function(req, res) {
  db.SELECT("SELECT id, name, profile_photo_url, introduce FROM users" + 
            " WHERE id=?", [req.params.id], function(result){
              res.json({
                result
              });
            });
});
*/

router.post("/info", function(req, res){
  const user_id = req.body.data.user_id;
  let queryMyInfo = mysql.format("SELECT id AS user_id, email, name, nick_name, profile_photo_url FROM users WHERE id=?", user_id);
  db.SELECT(queryMyInfo, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        userInfo: result[0]
      }
    })
  })
});

router.post("/get/nickname", function(req, res){
  const user_id = req.body.data.user_id;
  const query = mysql.format("SELECT nick_name, name FROM users WHERE id=?", user_id);
  db.SELECT(query, {}, function(result_select){
    return res.json({
      result: {
        state: res_state.success,
        ...result_select[0]
      }
    })
  })
});

router.post("/get/profileurl", function(req, res){
  const user_id = req.body.data.user_id;
  const query = mysql.format("SELECT profile_photo_url FROM users WHERE id=?", user_id);
  db.SELECT(query, {}, function(result_select){
    return res.json({
      result: {
        state: res_state.success,
        ...result_select[0]
      }
    })
  })
});

router.post("/save/profile", function(req, res){
  const user_id = req.body.data.user_id;
  const nick_name = req.body.data.nick_name;

  db.UPDATE("UPDATE users AS user SET nick_name=? WHERE user.id=?;", [nick_name, user_id], function(result_update_user){
    return res.json({
      result:{
        state: res_state.success
      }
    })
  });
});

router.post("/order/count", function(req, res){
  const user_id = req.body.data.user_id;
  // var nowDate = moment().format('YYYY-MM-DD HH:mm:ss');
  // var nowDate = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
  // let nextDate = moment(nowDate).add(1, 'days');
  // console.log(nowDate);
  // return res.json({});

  //ORDER_STATE_PAY
  //ORDER_STATE_APP_PAY_COMPLITE

  // let queryOrder = mysql.format("SELECT COUNT(_order.id) AS order_count FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.user_id=? AND _order.ticket_id IS NOT NULL AND ticket.show_date <> ? AND (_order.state=? OR _order.state=?) GROUP BY _order.id ORDER BY ticket.show_date ASC", [user_id, '0000-00-00 00:00:00', types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_APP_PAY_COMPLITE]);

  let queryOrder = mysql.format("SELECT _order.id, project.title, ticket.show_date FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.user_id=? AND _order.ticket_id IS NOT NULL AND ticket.show_date <> ? AND (_order.state=? OR _order.state=?) GROUP BY _order.id ORDER BY ticket.show_date ASC", [user_id, '0000-00-00 00:00:00', types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_APP_PAY_COMPLITE]);

  db.SELECT(queryOrder, {}, (result_select_order) => {
    let _orders = [];
    // console.log(result_select_order);
    for(let i = 0 ; i < result_select_order.length ; i++){
      const _data = result_select_order[i];
      let lostShowDate = moment(_data.show_date).format('YYYY-MM-DD 23:59:59');
      // console.log(_data);
      // console.log(lostShowDate);
      if(!Util.isTicketShowFinished(lostShowDate)){
        _orders.push(_data);
      }
    }

    return res.json({
      result:{
        list: _orders,
        order_count: _orders.length
      }
    });
  })
  
});


module.exports = router;