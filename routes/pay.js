var express = require('express');
var app = express();
var router = express.Router();
const cors = require('cors');
const use = require('abrequire');

const Util = use('lib/util.js');
const res_state = use('lib/res_state.js');

var db = use('lib/db_sql.js');
var mysql = require('mysql');
const types = use('lib/types.js');

const moment = require('moment');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const Templite_email = use('lib/templite_email');
const Global_Func = use("lib/global_func.js");

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

app.use(express.json())
app.use(cors());

//slack
var Slack = require('slack-node');
 
webhookUri = process.env.CROWDTICKET_SLACK_WEBHOOK_URI;
 
slack = new Slack();
slack.setWebhook(webhookUri);
////////////


const PAY_SERIALIZER_ONETIME = "onetime";
const PAY_SERIALIZER_SCHEDULE = "scheduled";

const DEFAULT_DONATION_PRICE = 3000;
const DEFAULT_DONATION_PRICE_USD = 3;

function getUserIP(req) {
    const addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return addr;
}

function getOrderStateCheckIamportState(iamport_state, pay_isp_type = types.pay_isp_type.isp_store_item){
// 결제가 승인되었을 때(모든 결제 수단) - (status : paid)
// 가상계좌가 발급되었을 때 - (status : ready)
// 가상계좌에 결제 금액이 입금되었을 때 - (status : paid)
// 예약결제가 시도되었을 때 - (status : paid or failed)
// 대시보드에서 환불되었을 때 - (status : cancelled)
    if(iamport_state === 'paid'){
        // return types.order.ORDER_STATE_APP_PAY_COMPLITE;
        if(pay_isp_type === types.pay_isp_type.isp_donation) {
            return types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION;
        }

        return types.order.ORDER_STATE_APP_PAY_COMPLITE;
    }else if(iamport_state === 'ready'){
        return types.order.ORDER_STATE_APP_PAY_WAIT_VBANK;
    }else if(iamport_state === 'failed'){
        return types.order.ORDER_STATE_PAY_SCHEDULE_RESULT_FAIL;
    }else if(iamport_state === 'cancelled'){
        return types.order.ORDER_STATE_CANCEL;
    }else if(iamport_state === 'scheduled'){
        return types.order.ORDER_STATE_PAY_SCHEDULE;
    }
    else{
        return types.order.ORDER_STATE_ERROR_IAMPORT_WEBHOOK_NONE;
    }
}

function getStoreOrderStateCheckIamportState(iamport_state, type_contents){
    // 결제가 승인되었을 때(모든 결제 수단) - (status : paid)
    // 가상계좌가 발급되었을 때 - (status : ready)
    // 가상계좌에 결제 금액이 입금되었을 때 - (status : paid)
    // 예약결제가 시도되었을 때 - (status : paid or failed)
    // 대시보드에서 환불되었을 때 - (status : cancelled)
    if(iamport_state === 'paid'){
        
        if(type_contents === types.contents.completed){
            return types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE;
        }

        return types.order.ORDER_STATE_APP_STORE_PAYMENT;
    }
    else if(iamport_state === 'scheduled'){
        // return types.order.ORDER_STATE_PAY_SCHEDULE;
        
        if(type_contents === types.contents.completed){
            return types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE;
        }

        return types.order.ORDER_STATE_APP_STORE_PAYMENT;
    }
    else if(iamport_state === 'failed'){
        return types.order.ORDER_STATE_PAY_SCHEDULE_RESULT_FAIL;
    }
    else if(iamport_state === 'cancelled'){
        return types.order.ORDER_STATE_CANCEL;
    }
    else{

        if(type_contents === types.contents.completed){
            return types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE;
        }

        return types.order.ORDER_STATE_APP_STORE_PAYMENT;
    }
}

// app.set('view engine', 'ejs');
// app.engine('html', require('ejs').renderFile);

payComplite = (req, res, serializer_uid) => {
    const order_id = req.body.data.order_id;
    const merchant_uid = req.body.data.merchant_uid;
    const imp_uid = req.body.data.imp_uid;
    const user_id = req.body.data.user_id;
    const customer_uid = Util.getPayNewCustom_uid(user_id);
    const pay_method = req.body.data.pay_method;

    // console.log(order_id+"/"+merchant_uid+"/"+imp_uid);
    let orderQuery = "SELECT state, id, total_price FROM orders AS _order WHERE _order.id=? AND _order.merchant_uid=?";
    orderQuery = mysql.format(orderQuery, [order_id, merchant_uid]);
    // console.log(orderQuery);
    db.SELECT(orderQuery, [], (result_order) => {
        if(result_order.length === 0){
            return  res.json({
                result:{
                    state: res_state.error,
                    message: '주문 결과가 없습니다.'
                }
            })
        }

        const orderData = result_order[0];

        if(orderData.total_price === 0){
            //결제금액 0원
            const orderState = getOrderStateCheckIamportState('paid');

            db.UPDATE("UPDATE orders AS _order SET state=? WHERE id=?", [orderState, orderData.id], 
            (result_order_update) => {
                console.log(result_order_update);
                if(!result_order_update){
                    return  res.json({
                        result:{
                            state: res_state.error,
                            message: '주문정보 업데이트 실패'
                        }
                    })
                }

                return  res.json({
                    result:{
                        state: res_state.success,
                        order_id: orderData.id
                    }
                })            
            }, (error) => {
                return  res.json({
                    result:{
                        state: res_state.error,
                        message: '주문정보 업데이트 실패'
                    }
                })
            });
        }else{
            if(serializer_uid === PAY_SERIALIZER_SCHEDULE){
                const orderState = getOrderStateCheckIamportState('scheduled');
                let _imp_meta = {
                    serializer_uid: serializer_uid,
                    merchant_uid: merchant_uid,
                    customer_uid: customer_uid
                };

                _imp_meta = JSON.stringify(_imp_meta);

                db.UPDATE("UPDATE orders AS _order SET state=?, imp_uid=?, imp_meta=?, serializer_uid=?, pay_method=? WHERE id=?", [orderState, imp_uid, _imp_meta, serializer_uid, pay_method, orderData.id], 
                (result_order_update) => {
                    console.log(result_order_update);
                    if(!result_order_update){
                        return  res.json({
                            result:{
                                state: res_state.error,
                                message: '주문정보 업데이트 실패'
                            }
                        })
                    }

                    return  res.json({
                        result:{
                            state: res_state.success,
                            order_id: orderData.id
                        }
                    })            
                }, (error) => {
                    return  res.json({
                        result:{
                            state: res_state.error,
                            message: '주문정보 업데이트 실패'
                        }
                    })
                });
            }else{
                iamport.payment.getByImpUid({
                    imp_uid: imp_uid  
                  }).then(function(result_import){
                    // To do
                    const status = result_import.status;
                    if(result_import.amount === orderData.total_price){
                        const orderState = getOrderStateCheckIamportState(status);
        
                        let _imp_meta = {
                            serializer_uid: serializer_uid,
                            imp_uid: imp_uid,
                            merchant_uid: merchant_uid,
                            customer_uid: customer_uid
                        };
    
                        _imp_meta = JSON.stringify(_imp_meta);
        
                        db.UPDATE("UPDATE orders AS _order SET state=?, imp_uid=?, imp_meta=?, serializer_uid=?, pay_method=? WHERE id=?", [orderState, imp_uid, _imp_meta, serializer_uid, pay_method, orderData.id], 
                        (result_order_update) => {
                            // console.log(result_order_update);
                            if(!result_order_update){
                                return  res.json({
                                    result:{
                                        state: res_state.error,
                                        message: '주문정보 업데이트 실패'
                                    }
                                })
                            }
        
                            return  res.json({
                                result:{
                                    state: res_state.success,
                                    order_id: orderData.id
                                }
                            })            
                        }, (error) => {
                            return  res.json({
                                result:{
                                    state: res_state.error,
                                    message: '주문정보 업데이트 실패'
                                }
                            })
                        });
                    }else{
                        return  res.json({
                            result:{
                                state: res_state.error,
                                message: '결제 금액이 다릅니다.'
                            }
                        });
                    }
                  }).catch(function(error){
                    // handle error
                    return  res.json({
                        state: res_state.error,
                        message: '결제정보가 없습니다.',
                        result:{
                        }
                    });
                  });
            }
        }

        
    })
}

payStoreComplite = (req, res, serializer_uid) => {
    const order_id = req.body.data.order_id;
    const merchant_uid = req.body.data.merchant_uid;
    const imp_uid = req.body.data.imp_uid;
    const user_id = req.body.data.user_id;
    const customer_uid = Util.getPayNewCustom_uid(user_id);
    

    let orderQuery = "SELECT _order.currency_code, _order.total_price_USD, _order.state, _order.id, _order.total_price, item.type_contents, item.completed_type_product_answer FROM orders_items AS _order LEFT JOIN items AS item ON _order.item_id=item.id WHERE _order.id=? AND _order.merchant_uid=?";
    
    orderQuery = mysql.format(orderQuery, [order_id, merchant_uid]);
    db.SELECT(orderQuery, [], (result_order) => {
        if(result_order.length === 0){
            return  res.json({
                result:{
                    state: res_state.error,
                    message: '주문 결과가 없습니다.'
                }
            })
        }

        const orderData = result_order[0];

        let down_expired_at = null;
        let product_answer = null;
        let confirm_at = null;
        if(orderData.type_contents === types.contents.completed){
            down_expired_at = moment_timezone().add(59, 'days').format('YYYY-MM-DD 23:59:59');
            product_answer = orderData.completed_type_product_answer;
            confirm_at = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
        }

        let total_price = orderData.total_price;

        if(orderData.currency_code === types.currency_code.US_Dollar){
          total_price = orderData.total_price_USD;
        }

        if(total_price === 0){
            //결제금액 0원
            const orderState = getStoreOrderStateCheckIamportState('paid', orderData.type_contents);

            db.UPDATE("UPDATE orders_items AS _order SET confirm_at=?, product_answer=?, down_expired_at=?, state=? WHERE id=?", [confirm_at, product_answer, down_expired_at, orderState, orderData.id], 
            (result_order_update) => {
                // console.log(result_order_update);
                if(!result_order_update){
                    return  res.json({
                        result:{
                            state: res_state.error,
                            message: '주문정보 업데이트 실패'
                        }
                    })
                }

                return  res.json({
                    result:{
                        state: res_state.success,
                        order_id: orderData.id
                    }
                })            
            }, (error) => {
                return  res.json({
                    result:{
                        state: res_state.error,
                        message: '주문정보 업데이트 실패'
                    }
                })
            });
        }else{
            if(serializer_uid === PAY_SERIALIZER_SCHEDULE){
                const orderState = getStoreOrderStateCheckIamportState('scheduled', orderData.type_contents);
                let _imp_meta = {
                    serializer_uid: serializer_uid,
                    merchant_uid: merchant_uid,
                    customer_uid: customer_uid
                };

                _imp_meta = JSON.stringify(_imp_meta);

                db.UPDATE("UPDATE orders_items AS _order SET confirm_at=?, product_answer=?, down_expired_at=?, state=?, imp_uid=?, imp_meta=?, serializer_uid=?, WHERE id=?", [confirm_at, product_answer, down_expired_at, orderState, imp_uid, _imp_meta, serializer_uid, orderData.id], 
                (result_order_update) => {
                    console.log(result_order_update);
                    if(!result_order_update){
                        return  res.json({
                            result:{
                                state: res_state.error,
                                message: '주문정보 업데이트 실패'
                            }
                        })
                    }

                    return  res.json({
                        result:{
                            state: res_state.success,
                            order_id: orderData.id
                        }
                    })            
                }, (error) => {
                    return  res.json({
                        result:{
                            state: res_state.error,
                            message: '주문정보 업데이트 실패'
                        }
                    })
                });
            }else{
                iamport.payment.getByImpUid({
                    imp_uid: imp_uid  
                  }).then(function(result_import){
                    // To do
                    const status = result_import.status;
                    //이곳의 결제 금액이 다름
                    if(result_import.amount === total_price){
                        const orderState = getStoreOrderStateCheckIamportState(status, orderData.type_contents);
        
                        let _imp_meta = {
                            serializer_uid: serializer_uid,
                            imp_uid: imp_uid,
                            merchant_uid: merchant_uid,
                            customer_uid: customer_uid
                        };
    
                        _imp_meta = JSON.stringify(_imp_meta);

                        let orders_item_data = {
                          confirm_at: confirm_at,
                          product_answer: product_answer,
                          down_expired_at: down_expired_at,
                          state: orderState,
                          imp_uid: imp_uid,
                          imp_meta: _imp_meta,
                          serializer_uid: serializer_uid,
                          // orders_donation_id: donation_order_id
                        }
        
                        db.UPDATE("UPDATE orders_items AS _order SET ? WHERE id=?", [orders_item_data, orderData.id], 
                        (result_order_update) => {
                            // console.log(result_order_update);
                            if(!result_order_update){
                                return  res.json({
                                    result:{
                                        state: res_state.error,
                                        message: '주문정보 업데이트 실패'
                                    }
                                })
                            }
        
                            return  res.json({
                                result:{
                                    state: res_state.success,
                                    order_id: orderData.id
                                }
                            })            
                        }, (error) => {
                            return  res.json({
                                result:{
                                    state: res_state.error,
                                    message: '주문정보 업데이트 실패'
                                }
                            })
                        });
                    }else{
                      return res.json({
                        state: res_state.error,
                        message: '결제 금액이 다릅니다.',
                        result:{}
                      })
                        // return  res.json({
                        //     result:{
                        //         state: res_state.error,
                        //         message: '결제 금액이 다릅니다.'
                        //     }
                        // });
                    }
                  }).catch(function(error){
                    // handle error
                    return  res.json({
                        state: res_state.error,
                        message: '결제정보가 없습니다.',
                        result:{
                        }
                    });
                  });
            }
        }

        
    })
}

payISPComplite = (req, res, serializer_uid) => {
    const order_id = req.body.data.order_id;
    const merchant_uid = req.body.data.merchant_uid;
    const imp_uid = req.body.data.imp_uid;
    const user_id = req.body.data.user_id;
    const customer_uid = Util.getPayNewCustom_uid(user_id);
    // const pay_method = req.body.data.pay_method;

    const pay_isp_type = req.body.data.pay_isp_type;

    let orderQuery = '';
    if(pay_isp_type === types.pay_isp_type.isp_donation){
      orderQuery = "SELECT orders_item.total_price_USD AS orders_item_total_price_USD, orders_donation.currency_code, orders_donation.total_price_USD, store.contact AS place_contact, orders_donation.count, item.type_contents, orders_donation.item_id, orders_donation.name, store.title AS place_title, orders_item_id, orders_donation.state, orders_donation.id, orders_donation.total_price, orders_item.total_price AS orders_item_total_price FROM orders_donations AS orders_donation LEFT JOIN orders_items AS orders_item ON orders_donation.orders_item_id=orders_item.id LEFT JOIN items AS item ON orders_donation.item_id=item.id LEFT JOIN stores AS store ON orders_donation.store_id=store.id WHERE orders_donation.id=? AND orders_donation.merchant_uid=?";
        // orderQuery = "SELECT _order.state, _order.id, _order.total_price FROM orders_donations AS _order WHERE _order.id=? AND _order.merchant_uid=?";
    }else{
        return res.json({
            result:{
                state: res_state.error,
                message: 'error pay complite'
            }
        })
        // orderQuery = "SELECT _order.state, _order.id, _order.total_price, item.type_contents, item.completed_type_product_answer FROM orders_items AS _order LEFT JOIN items AS item ON _order.item_id=item.id WHERE _order.id=? AND _order.merchant_uid=?";
    }
    
    
    orderQuery = mysql.format(orderQuery, [order_id, merchant_uid]);
    db.SELECT(orderQuery, [], (result_order) => {
        if(result_order.length === 0){
            return  res.json({
                result:{
                    state: res_state.error,
                    message: '주문 결과가 없습니다.'
                }
            })
        }

        const orderData = result_order[0];

        let total_price = orderData.total_price;
        if(orderData.currency_code === types.currency_code.Won){
          total_price = orderData.total_price;
        }else{
          total_price = orderData.total_price_USD;
        }

        if(total_price === 0){
            //결제금액 0원
            return  res.json({
                state: res_state.error,
                message: '금액 0원 오류',
                result:{}
            })
        }else{
          let checkTotalPrice = orderData.total_price;
          if(orderData.currency_code === types.currency_code.Won){
          }else{
            checkTotalPrice = orderData.total_price_USD;
          }

          if(orderData.orders_item_id !== null){
            checkTotalPrice = orderData.orders_item_total_price

            if(orderData.currency_code === types.currency_code.Won){
            }else{
              checkTotalPrice = orderData.orders_item_total_price_USD;
            }
          }
            
          iamport.payment.getByImpUid({
            imp_uid: imp_uid  
            }).then(function(result_import){
            // To do
            const status = result_import.status;
            if(result_import.amount === checkTotalPrice){
              let orderState = '';
              if(orderData.item_id){
                if(status === 'paid'){
                  if(orderData.type_contents === types.contents.completed){
                    orderState = types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION;
                  }else{
                    orderState = types.order.ORDER_STATE_APP_STORE_PAYMENT;
                  }
                }else{
                  orderState = getOrderStateCheckIamportState(status, pay_isp_type);
                }
              }else{
                orderState = getOrderStateCheckIamportState(status, pay_isp_type);
              }
              

              let _imp_meta = {
                  serializer_uid: serializer_uid,
                  imp_uid: imp_uid,
                  merchant_uid: merchant_uid,
                  customer_uid: customer_uid
              };

              _imp_meta = JSON.stringify(_imp_meta);

              let orders_donations = {
                  state: orderState,
                  imp_uid: imp_uid,
                  imp_meta: _imp_meta,
                  serializer_uid: serializer_uid,
              }

              db.UPDATE("UPDATE orders_donations SET ? WHERE id=?", [orders_donations, orderData.id], 
              (result_order_update) => {
                  // console.log(result_order_update);
                  if(!result_order_update){
                      return  res.json({
                          result:{
                              state: res_state.error,
                              message: '주문정보 업데이트 실패'
                          }
                      })
                  }
                  
                  if(process.env.APP_TYPE === 'local'){
                    
                  }else{
                    if(pay_isp_type === types.pay_isp_type.isp_donation){
                      if(orderData.orders_item_id === null){
                        slack.webhook({
                          channel: "#결제알림",
                          username: "알림bot",
                          text: `(후원)\n플레이스: ${orderData.place_title}\n한화: ${orderData.total_price}원\n달러: $${orderData.total_price_USD}\n주문자명: ${orderData.name}`
                        }, function(err, response) {
                          console.log(err);
                        });
                      }

                      if(orderData.type_contents === types.contents.completed){
                        Global_Func.sendKakaoAlimTalk({
                          templateCode: 'Kalarm16v1',
                          to: orderData.place_contact,
                          donation_user_name: orderData.name,
                          creator_name: orderData.place_title,
                          coffee_count: orderData.count,
                          place_manager_url: 'ctee.kr/manager/place'
                        })   
                      }            
                    }
                  }
                  

                  return  res.json({
                      result:{
                          state: res_state.success,
                          order_id: orderData.id
                      }
                  })            
              }, (error) => {
                  return  res.json({
                      result:{
                          state: res_state.error,
                          message: '주문정보 업데이트 실패'
                      }
                  })
              });
            }else{
                return  res.json({
                  state: res_state.error,
                  message: '결제 금액이 다릅니다.',
                  result:{}
                });
            }
            }).catch(function(error){
            // handle error
                return  res.json({
                    state: res_state.error,
                    message: '결제정보가 없습니다.',
                    result:{
                    }
                });
            });
          }        
    })
}

//rest api Iamport 요청 START
router.post('/complite', function(req, res){
    // console.log(req.body.data);
    if(!req.body.data.imp_success){
        //여기는 무조건 성공해야 옴.    
        return res.json({
            result:{
                state: 'error',
                message: '잘못된 정보입니다.'
            }
        })
    }

    this.payComplite(req, res, PAY_SERIALIZER_ONETIME);
    /*
    const order_id = req.body.data.order_id;
    const merchant_uid = req.body.data.merchant_uid;
    const imp_uid = req.body.data.imp_uid;

    console.log(order_id+"/"+merchant_uid+"/"+imp_uid);
    let orderQuery = "SELECT state, id, total_price FROM orders AS _order WHERE _order.id=? AND _order.merchant_uid=?";
    orderQuery = mysql.format(orderQuery, [order_id, merchant_uid]);
    // console.log(orderQuery);
    db.SELECT(orderQuery, [], (result_order) => {
        if(result_order.length === 0){
            return  res.json({
                result:{
                    state: res_state.error,
                    message: '주문 결과가 없습니다.'
                }
            })
        }

        const orderData = result_order[0];

        iamport.payment.getByImpUid({
            imp_uid: imp_uid  
          }).then(function(result_import){
            // To do
            const status = result_import.status;
            if(result_import.amount === orderData.total_price){
                const orderState = getOrderStateCheckIamportState(status);
                db.UPDATE("UPDATE orders AS _order SET state=?, imp_uid=? WHERE id=?", [orderState, imp_uid, orderData.id], 
                (result_order_update) => {
                    console.log(result_order_update);
                    if(!result_order_update){
                        return  res.json({
                            result:{
                                state: res_state.error,
                                message: '주문정보 업데이트 실패'
                            }
                        })
                    }

                    return  res.json({
                        result:{
                            state: res_state.success,
                            order_id: orderData.id
                        }
                    })            
                });
            }else{
                return  res.json({
                    result:{
                        state: res_state.error,
                        message: '결제 금액이 다릅니다.'
                    }
                });
            }
          }).catch(function(error){
            // handle error
            return  res.json({
                result:{
                    state: res_state.error,
                    message: '결제정보가 없습니다.'
                }
            });
          });
    })
    */
});

router.post('/onetime', function(req, res){
    // amount = req.body.data.amount;
    const _data = req.body.data;
    const user_id = req.body.data.user_id;
    const order_id = _data.order_id;
    // console.log(_data);
    const project_id = _data.project_id;
    const total_price = _data.total_price;

   let orderQuery = mysql.format("SELECT merchant_uid FROM orders AS _order WHERE _order.id = ?", order_id);
//    console.log(orderQuery);
    db.SELECT(orderQuery, [], function(result_order){
        if(!result_order || result_order.length === 0){
            return  res.json({
                state: res_state.error,
                message: '오더 정보 오류',
                result:{
                    
                }
            });
        }

        const orderData = result_order[0];
        const paymentData = {
            project_id: project_id,
            card_number: _data.card_number,
            expiry: Util.getCardExpire(_data.card_yy, _data.card_mm),
            amount: _data.total_price, //onetime total_price는 order_id의 db 조회해서 total_price와 비교한다.
            merchant_uid: orderData.merchant_uid,
            birth: _data.card_birth,
            customer_uid: Util.getPayNewCustom_uid(user_id),
            pwd_2digit: _data.card_pw_2digit,
            name: _data.title,
            buyer_name: _data.name,
            buyer_email: _data.email,
            buyer_tel: _data.contact
        };

        if(_data.total_price === 0){
            //0원이면 iamport 안함.
            req.body.data.merchant_uid = orderData.merchant_uid;
            req.body.data.imp_uid = 0;
            this.payComplite(req, res, PAY_SERIALIZER_ONETIME);
        }else{
            iamport.subscribe.onetime({
                ...paymentData
            }).then((result) => {
                // To do
                // console.log(result);
                //status: 'paid',
                if(result.status === 'paid'){
                    //결제 성공
                    req.body.data.merchant_uid = result.merchant_uid;
                    req.body.data.imp_uid = result.imp_uid;
                    req.body.data.pay_method = result.pay_method;
                    this.payComplite(req, res, PAY_SERIALIZER_ONETIME);
                }else{
                    // console.log("success");
                    return res.json({
                        state: res_state.error,
                        message: result.fail_reason,
                    });
                }
                // console.log(result);
            }).catch((error) => {
                // handle error
                // console.log(error);
                return res.json({
                    state: res_state.error,
                    message: error.message,
                })
                // console.log(error);
            });
        }
    });
});

router.post('/schedule', function(req, res){
    // amount = req.body.data.amount;

    // amount = req.body.data.amount;
    const _data = req.body.data;
    const user_id = req.body.data.user_id;
    const customer_uid = Util.getPayNewCustom_uid(user_id);
    const order_id = _data.order_id;
    // console.log(_data);
    const project_id = _data.project_id;
    const total_price = _data.total_price;

   let orderQuery = mysql.format("SELECT merchant_uid, funding_closing_at, picking_closing_at FROM orders AS _order LEFT JOIN projects AS project ON project.id=_order.project_id WHERE _order.id = ?", order_id);
   
    db.SELECT(orderQuery, [], function(result_order){
        if(!result_order || result_order.length === 0){
            return  res.json({
                state: res_state.error,
                message: '오더 정보 오류',
                result:{
                    
                }
            });
        }

        const orderData = result_order[0];

        if(orderData.funding_closing_at === null){
            return  res.json({
                state: res_state.error,
                message: 'closing 오류',
                result:{
                }
            });
        }

        let endDate = orderData.funding_closing_at;

        if(orderData.picking_closing_at){
            endDate = orderData.picking_closing_at;
        }       

        let payingDate = moment_timezone(endDate).add(1, 'days');
        payingDate = moment_timezone(payingDate).format("YYYY-MM-DD 13:00:00");
        payingDate = moment_timezone(payingDate).format("X");

        // const orderData = result_order[0];
        const paymentData = {
            project_id: project_id,
            card_number: _data.card_number,
            expiry: Util.getCardExpire(_data.card_yy, _data.card_mm),
            amount: _data.total_price, //onetime total_price는 order_id의 db 조회해서 total_price와 비교한다.
            merchant_uid: orderData.merchant_uid,
            birth: _data.card_birth,
            customer_uid: customer_uid,
            pwd_2digit: _data.card_pw_2digit,
            name: _data.title,
            buyer_name: _data.name,
            buyer_email: _data.email,
            buyer_tel: _data.contact
        };

        // subscribe/customers
        iamport.subscribe_customer.create({
            ...paymentData
        }).then((result_iamport_subscribe_customer) => {
            if(_data.total_price === 0){
                //0원이면 iamport 안함.
                req.body.data.merchant_uid = orderData.merchant_uid;
                req.body.data.imp_uid = 0;
                this.payComplite(req, res, PAY_SERIALIZER_ONETIME);
            }else{
                iamport.subscribe.schedule({
                    ...paymentData,
                    schedules: [
                        {
                            merchant_uid: orderData.merchant_uid,
                            schedule_at: payingDate,
                            amount: _data.total_price
                        }
                    ]
                }).then((result) => {
                    // To do
                    const _result = result[0];
                    //status: 'paid',
                    if(_result.schedule_status === 'scheduled'){
                        //결제 성공
                        req.body.data.merchant_uid = _result.merchant_uid;
                        req.body.data.imp_uid = _result.imp_uid;
                        req.body.data.pay_method = 'card'
                        this.payComplite(req, res, PAY_SERIALIZER_SCHEDULE);
                    }else{
                        // console.log("success");
                        return res.json({
                            state: res_state.error,
                            message: result.fail_reason,
                        });
                    }
                    // console.log(result);
                }).catch((error) => {
                    // handle error
                    // console.log(error);
                    return res.json({
                        state: res_state.error,
                        message: error.message,
                    })
                    // console.log(error);
                });
            }
        }).catch((error) => {
            return res.json({
                state: res_state.error,
                message: error.message,
            })
        })
    });
});


isSoldOutCheck = (item_id, store_item_order_id, callback) => {
    // let thisWeekStart_at = moment_timezone().startOf('isoWeek').format("YYYY-MM-DD HH:mm:ss");

    const queryItemSelect = mysql.format("SELECT re_set_at FROM items WHERE id=?", item_id);
    db.SELECT(queryItemSelect, {}, (result_select_items) => {
        const data = result_select_items[0];
        let thisWeekStart_at = moment_timezone(data.re_set_at).subtract(1, 'weeks').format("YYYY-MM-DD HH:mm:ss");

        // console.log(thisWeekStart_at);
        const storeOrderSelect = mysql.format("SELECT orders_item.id, item.order_limit_count FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.item_id=? AND orders_item.state<? AND orders_item.created_at>?", [item_id, types.order.ORDER_STATE_PAY_END, thisWeekStart_at]);
        db.SELECT(storeOrderSelect, {}, (item_orders_select) => {
            let order_limit_count = 0;
            let orderCounter = 0;
            let isSoldOut = false;
            // let isLastOrder = false;
            for(let i = 0 ; i < item_orders_select.length ; i++){
                orderCounter++;

                const data = item_orders_select[i];
                order_limit_count = data.order_limit_count;
                if(order_limit_count === 0){
                    // console.log("무제한 구매");
                    break;
                }

                // console.log(data);
                if(data.id === store_item_order_id){
                    if(orderCounter > order_limit_count){
                        // console.log("품절됨");
                        isSoldOut = true;
                    }else{
                        // console.log("통과");
                    }
                    break;
                }
            }

            callback(isSoldOut);
            // return isSoldOut;
        });

    })
}

sendStoreMasterSMSOrder = (store_id, item_title, total_price, name) => {

    const querySelect = mysql.format("SELECT contact, store.title AS creator_name FROM stores AS store WHERE store.id=?", store_id);
  
    db.SELECT(querySelect, {}, (result) => {
        if(!result || result.length === 0){
        return;
        }
        
        const data = result[0];
        if(!data.contact || data.contact === ''){
            return;
        }

        let _requested_at = moment_timezone().format('YYYY-MM-DD HH:mm');        

        let _order_url = 'ctee.kr';
        if(process.env.APP_TYPE === 'local'){
        _order_url = 'localhost:8000';
        }else if(process.env.APP_TYPE === 'qa'){
        _order_url = 'qa.ctee.kr';
        }

        _order_url = _order_url + `/manager/store`;
        
        Global_Func.sendKakaoAlimTalk(
        {
            templateCode: 'CTSTORE06a',
            to: data.contact,
            store_manager_url: _order_url,
            creator_name: data.creator_name,
            item_title: item_title,
            item_price: total_price,
            customer_name: name,
            requested_at: _requested_at,
        })
    })
}

sendStoreOrderNineAMEvent = (store_order_id) => {
    const querySelect = mysql.format("SELECT orders_item.email, orders_item.requestContent, orders_item.created_at AS requested_at, item.price AS item_price, orders_item.user_id AS user_id, store.id AS store_id, store.alias, item.title AS item_title, orders_item.contact, orders_item.name AS customer_name, store.title AS creator_name FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.id=?", store_order_id);

    db.SELECT(querySelect, {}, 
    (result) => {
        if(result.length === 0){
            return;
        }

        const data = result[0];
        const requestContent = data.requestContent;
        const item_title = data.item_title;
        const name = data.customer_name;
        const creator_name = data.creator_name;
        const contact = data.contact;
        const email = data.email;

        const _requestContents = Util.getReplaceBRTagToEnter(requestContent);
    
        let _html = `
                    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <html xmlns="http://www.w3.org/1999/xhtml">
                        <head>
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                        <title>콘텐츠 상점 주문서</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                        </head>
                        <body style="margin:0%">
                        상품명 : ${item_title} <br>
                        크리에이터명: ${creator_name} <br><br>
                        주문자 정보 
                        이름 : ${name} <br>
                        연락처 : ${contact} <br>
                        이메일 : ${email} <br><br>
                        요청사항:<br>
                        ${_requestContents}
                        </body>
                    </html>
                    `

        const msg = {
            to: '크라우드티켓<event@ctee.kr>',
            from: 'contact@ctee.kr',
            subject: `콘텐츠 상점 주문 [${item_title}]`,
            html: _html,
        };

        sgMail.send(msg).then((result) => {
                            
        }).catch((error) => {
        
        });
    }, (error) => {
        
    })

    
}

sendStoreMasterEmailOrder = (store_id, item_title, item_price, order_name, created_at, requestContent) => {

    const querySelect = mysql.format("SELECT user.nick_name, user.name, user.email AS user_email, store.email AS store_user_email FROM stores AS store LEFT JOIN users AS user ON store.user_id=user.id WHERE store.id=?", store_id);
    db.SELECT(querySelect, {}, (result) => {
        const data = result[0];

        let toEmail = data.store_user_email
        if(!data.store_user_email || data.store_user_email === ''){
            toEmail = data.user_email;
        }

        let store_manager_name = data.nick_name;
        if(!data.nick_name || data.nick_name === ''){
            store_manager_name = data.name;
        }

        // //test
        // toEmail = 'bogame@naver.com';
        // //////
        let _requestContents = Util.getReplaceBRTagToEnter(requestContent);
        
        const mailMSG = {
            to: toEmail,
            from: '크티<contact@ctee.kr>',
            subject: Templite_email.email_store_creator_order.subject,
            html: Templite_email.email_store_creator_order.html(store_manager_name, order_name, item_title, item_price, created_at, _requestContents)
        }
        sgMail.send(mailMSG).then((result) => {
            // console.log(result);
        }).catch((error) => {
            // console.log(error);
        })
    })
}

sendStoreOrderCompliteEmail = (user_id, to_email, item_title, item_price, order_name, created_at, requestContent) => {
    let _requestContents = Util.getReplaceBRTagToEnter(requestContent);

    const mailMSG = {
        to: to_email,
        from: '크티<contact@ctee.kr>',
        subject: Templite_email.email_store_order_requested.subject,
        html: Templite_email.email_store_order_requested.html(user_id, order_name, item_title, item_price, created_at, _requestContents)
    }
    sgMail.send(mailMSG).then((result) => {
        // console.log(result);
    }).catch((error) => {
        // console.log(error);
    })
}

sendStoreOrderCompliteKakaoAlim = (store_order_id) => {

    const querySelect = mysql.format("SELECT orders_item.created_at AS requested_at, item.price AS item_price, orders_item.user_id AS user_id, store.id AS store_id, store.alias, item.title AS item_title, orders_item.contact, orders_item.name AS customer_name, store.title AS creator_name FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.id=?", store_order_id);
  
    db.SELECT(querySelect, {}, (result) => {
      if(!result || result.length === 0){
        return;
      }
      
      const data = result[0];
      if(!data.contact || data.contact === ''){
          return;
      }
  
      let _requested_at = moment_timezone(data.requested_at).format('YYYY-MM-DD HH:mm');

      
  

      let _order_url = 'ctee.kr';
      if(process.env.APP_TYPE === 'local'){
        _order_url = 'localhost:8000';
      }else if(process.env.APP_TYPE === 'qa'){
        _order_url = 'qa.ctee.kr';
      }

      _order_url = _order_url + `/users/store/${data.user_id}/orders`;
      
      
      Global_Func.sendKakaoAlimTalk({
        templateCode: 'CTSTORE01a',
        to: data.contact,
        content_url: _order_url,
        creator_name: data.creator_name,
        item_title: data.item_title,
        item_price: data.item_price,
        requested_at: _requested_at,
        customer_name: data.customer_name,
      })
    })
}

router.post('/store/onetime', function(req, res){
    const _data = req.body.data;
    const user_id = req.body.data.user_id;
    const customer_uid = Util.getPayNewCustom_uid(user_id);
    // const order_id = _data.order_id;
    // console.log(_data);
    const store_id = _data.store_id;
    const item_id = _data.item_id;

    const name = _data.name;
    const contact = _data.contact;
    const email = _data.email;

    const pay_method = _data.pay_method;

    const requestContent = _data.requestContent;

    const total_price = _data.total_price;

    const item_title = _data.title;
    const item_price = _data.item_price;

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    const merchant_uid = Util.getPayStoreNewMerchant_uid(store_id, user_id);

    let pg = _data.pg;

    let total_price_usd = _data.total_price_usd;
    if(total_price_usd === undefined || total_price_usd === null){
      total_price_usd = 0;
    }

    let price_usd = _data.price_usd;
    if(price_usd === undefined || price_usd === null){
      price_usd = 0;
    }

    let currency_code = _data.currency_code;
    if(currency_code === undefined){
      currency_code = types.currency_code.Won;
    }

    if(pg === undefined){
      pg = null;
    }

    // const item_price = _data.item_price;

    const insertOrderItemData = {
        store_id: store_id,
        item_id: item_id,
        user_id: user_id,
        state: types.order.ORDER_STATE_STAY,
        count: 1,
        price: item_price,
        price_USD: price_usd,
        total_price: total_price,
        total_price_USD: total_price_usd,
        currency_code: currency_code,
        name: name,
        contact: contact,
        email: email,
        requestContent: requestContent,
        merchant_uid: merchant_uid,
        pay_method: pay_method,
        created_at: date,
        updated_at: date,
        pg: pg
    }
    
    db.INSERT("INSERT INTO orders_items SET ?", insertOrderItemData, (result_insert_orders_items) => {
        const item_order_id = result_insert_orders_items.insertId;
        req.body.data.order_id = item_order_id;
        // let payingDate = moment_timezone(date).add(7, 'days');
        // payingDate = moment_timezone(payingDate).format("YYYY-MM-DD 13:00:00");
        // payingDate = moment_timezone(payingDate).format("X");

        ///////////품절 됐는지 확인한다.//////////

        this.isSoldOutCheck(item_id, item_order_id, (isSoldOut) => {
            if(isSoldOut){
                let _updateQueryArray = [];
                let _updateOptionArray = [];

                _updateQueryArray.push({
                    key: 0,
                    value: "UPDATE orders_items SET ? WHERE id=?;"
                })

                _updateOptionArray.push({
                    key: 0,
                    value: [
                        {state: types.order.ORDER_STATE_ERROR_TICKET_OVER_COUNT},
                        item_order_id
                    ]
                })

                _updateQueryArray.push({
                    key: 1,
                    value: "UPDATE items SET ? WHERE id=?;"
                })

                _updateOptionArray.push({
                    key: 1,
                    value: [
                        {state: types.item_state.SALE_LIMIT},
                        item_id
                    ]
                })

                db.UPDATE_MULITPLEX(_updateQueryArray, _updateOptionArray, 
                (result_update) => {
                    return res.json({
                        state: res_state.error,
                        message: '해당 상품은 품절되었습니다.',
                    })
                }, (error_update) => {
                    return res.json({
                        state: res_state.error,
                        message: '해당 상품은 품절되었습니다.(상태 업데이트 에러)',
                    })
                })

                return;
            }

            const paymentData = {
                store_id: store_id,
                card_number: _data.card_number,
                expiry: Util.getCardExpire(_data.card_yy, _data.card_mm),
                amount: _data.total_price, //onetime total_price는 order_id의 db 조회해서 total_price와 비교한다.
                merchant_uid: merchant_uid,
                birth: _data.card_birth,
                customer_uid: customer_uid,
                pwd_2digit: _data.card_pw_2digit,
                name: _data.title,
                buyer_name: _data.name,
                buyer_email: _data.email,
                buyer_tel: _data.contact
            }; 
    
            if(_data.total_price === 0){
                //0원이면 iamport 안함.
                if(process.env.APP_TYPE !== 'local'){
                  senderOrderCompleteAlarm(req, item_id, user_id, email, item_order_id, store_id, item_title, total_price, name, date, requestContent);
                }
    
                req.body.data.merchant_uid = merchant_uid;
                req.body.data.imp_uid = 0;
                this.payStoreComplite(req, res, PAY_SERIALIZER_ONETIME);
    
            }else{
              iamport.subscribe.onetime({
                  ...paymentData
              }).then((result) => {
                  // To do
                  // console.log(result);
                  //status: 'paid',
                  if(result.status === 'paid'){
                      //결제 성공
                      if(process.env.APP_TYPE !== 'local'){
                        senderOrderCompleteAlarm(req, item_id, user_id, email, item_order_id, store_id, item_title, total_price, name, date, requestContent);
                      }
  
                      req.body.data.merchant_uid = result.merchant_uid;
                      req.body.data.imp_uid = result.imp_uid;

                      req.body.data.pay_isp_type = types.pay_isp_type.onetime_donation;
                      req.body.data.created_at = date;
                      // req.body.data.pay_method = result.pay_method;

                      this.setDonation(req, res, (donation_order_id) => {
                        this.payStoreComplite(req, res, PAY_SERIALIZER_ONETIME);
                      }, (error) => {

                      })
                      
                  }else{
                      // console.log("success");
                      return res.json({
                          state: res_state.error,
                          message: result.fail_reason,
                      });
                  }
                  // console.log(result);
              }).catch((error) => {
                  // handle error
                  // console.log(error);
                  //ORDER_STATE_ERROR_PAY
                  
                  db.UPDATE("UPDATE orders_items SET state=? WHERE id=?", [types.order.ORDER_STATE_ERROR_PAY, req.body.data.order_id], (result) => {
                    return res.json({
                        state: res_state.error,
                        message: error.message,
                    })
                  }, (error) => {
                    return res.json({
                        state: res_state.error,
                        message: error.message,
                    })
                  })
                  
                  // console.log(error);
              });
            }
        });
        /////////////////////////////////////
    })
});

function senderOrderCompleteAlarm(req, item_id, user_id, email, item_order_id, store_id, item_title, total_price, name, date, requestContent){
    const querySelect = mysql.format("SELECT type_contents FROM items WHERE id=?", [item_id]);
    
    db.SELECT(querySelect, {}, (result) => {
        if(result.length === 0){
            return;
        }

        const data = result[0];
        this.sendSlackAlim(req, item_order_id);
        if(data.type_contents === types.contents.completed){
            return;
        }

        // this.sendStoreOrderNineAMEvent(item_order_id);

        this.sendStoreMasterEmailOrder(store_id, item_title, total_price, name, date, requestContent);

        this.sendStoreMasterSMSOrder(store_id, item_title, total_price, name);

        this.sendStoreOrderCompliteEmail(user_id, email, item_title, total_price, name, date, requestContent);

        this.sendStoreOrderCompliteKakaoAlim(item_order_id);
    })
}

sendSlackAlim = (req, item_order_id, _donation_total_price=null) => {
    const querySelect = mysql.format("SELECT orders_item.total_price AS total_price, orders_donation.count AS donation_count, orders_donation.total_price AS donation_total_price, orders_item.orders_donation_id, item.price_USD AS item_price_usd, orders_item.total_price_USD, orders_item.created_at AS requested_at, item.price AS item_price, orders_item.user_id AS user_id, store.id AS store_id, store.alias, item.title AS item_title, orders_item.contact, orders_item.name AS customer_name, store.title AS creator_name FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id LEFT JOIN orders_donations AS orders_donation ON orders_item.orders_donation_id=orders_donation.id WHERE orders_item.id=?", item_order_id);
  
    db.SELECT(querySelect, {}, (result) => {
      if(!result || result.length === 0){
        return;
      }
      
      const data = result[0];

      let priceText = '';
      let total_price_text = '';
      if(data.total_price_USD > 0){
          priceText = '$'+ data.item_price_usd;
          total_price_text = '$'+ data.total_price_USD;
      }else{
        priceText = data.item_price;
        total_price_text = data.total_price;
      }

      let donation_total_price = 0;
      if(_donation_total_price === undefined || _donation_total_price === null){
        const _data = req.body.data;
        donation_total_price = _data.donation_total_price;      
      }else{
        donation_total_price = _donation_total_price;
      }

      if(donation_total_price === undefined){
        donation_total_price = 0;
      }
      
      slack.webhook({
        channel: "#결제알림",
        username: "알림bot",
        text: `(상품)\n플레이스: ${data.creator_name}\n상품명: ${data.item_title}\n상품금액: ${priceText}\n후원: ${donation_total_price}\n총주문금액: ${total_price_text}\n주문자명: ${data.customer_name}`
      }, function(err, response) {
        console.log(err);
      });
    })
}

setDonation = (req, res, successCallBack, errorCallBack) => {
    const _data = req.body.data;
    const user_id = _data.user_id;
    const store_id = _data.store_id;
    const item_id = _data.item_id;

    const order_id = _data.order_id;

    const name = _data.name;
    const contact = _data.contact;
    const email = _data.email;

    const pay_method = _data.pay_method;

    const coffee_count = _data.coffee_count;
    const donation_total_price = _data.donation_total_price;
    const donation_total_price_usd = _data.donation_total_price_usd;

    const pay_isp_type = _data.pay_isp_type;

    const store_title = _data.store_title;
    const store_contact = _data.store_contact;

    let pg = _data.pg;

    if(coffee_count === 0){
      return successCallBack(null);
    }

    const created_at = _data.created_at;

    if(order_id === undefined || order_id === null){
        return errorCallBack();
    }

    let currency_code = _data.currency_code;
    if(currency_code === undefined){
        currency_code = types.currency_code.Won;
    }

    if(pg === undefined){
      pg = null;
    }

    const merchant_uid = _data.merchant_uid;

    const selectQuery = mysql.format('SELECT type_contents FROM items WHERE id=?', [item_id]);
    db.SELECT(selectQuery, {}, (result) => {
      const itemData = result[0];

      let insertDonationData = {
        store_id: store_id,
        user_id: user_id,
        item_id: item_id,
        orders_item_id: order_id,
        state: types.order.ORDER_STATE_APP_STORE_STANBY,
        count: coffee_count,
        price: DEFAULT_DONATION_PRICE,
        total_price: donation_total_price,
        price_USD: DEFAULT_DONATION_PRICE_USD,
        total_price_USD: donation_total_price_usd,
        name: name,
        contact: contact,
        email: email,
        currency_code: currency_code,
        merchant_uid: merchant_uid,
        pay_method: pay_method,
        // imp_uid: imp_uid,
        // currency_code: currency_code,
        created_at: created_at,
        updated_at: created_at,
        confirm_at: null,

        pg: pg,
        donation_comment_id: null,
        is_heart: false
      }

      let confirm_at = null;
      let state = null;
      
  
      if(pay_isp_type === types.pay_isp_type.onetime_donation){
        const imp_uid = _data.imp_uid;
        const customer_uid = Util.getPayNewCustom_uid(user_id);
  
        let _imp_meta = {
          serializer_uid: PAY_SERIALIZER_ONETIME,
          imp_uid: imp_uid,
          merchant_uid: merchant_uid,
          customer_uid: customer_uid
        };
  
        _imp_meta = JSON.stringify(_imp_meta);

        if(itemData.type_contents === types.contents.completed){
          confirm_at = created_at;
          state = types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION;
        }else{
          confirm_at = null;
          state = types.order.ORDER_STATE_APP_STORE_PAYMENT;
        }
  
        insertDonationData = {
          ...insertDonationData,
          state: state,
          imp_uid: imp_uid,
          imp_meta: _imp_meta,
          serializer_uid: PAY_SERIALIZER_ONETIME,
          confirm_at: confirm_at
        }

        if(itemData.type_contents === types.contents.completed){
          Global_Func.sendKakaoAlimTalk({
            templateCode: 'Kalarm16v1',
            to: store_contact,
            donation_user_name: name,
            creator_name: store_title,
            coffee_count: coffee_count,
            place_manager_url: 'ctee.kr/manager/place'
          })
        }        
      }else{
        if(itemData.type_contents === types.contents.completed){
          confirm_at = created_at;
        }else{
          confirm_at = null;
        }
        
        state = types.order.ORDER_STATE_APP_STORE_STANBY;
        
        insertDonationData = {
          ...insertDonationData,
          state: state,
          confirm_at: confirm_at
        }
      }
  
      db.INSERT("INSERT INTO orders_donations SET ?", insertDonationData, (result_insert_orders_donations) => {
        const donation_order_id = result_insert_orders_donations.insertId;

        let ordersData = {
          orders_donation_id: donation_order_id
        }
        db.UPDATE("UPDATE orders_items SET ? WHERE id=?", [ordersData, order_id], () => {
          return successCallBack(donation_order_id);
        }, (update_error) => {
          return errorCallBack();
        })        
      }, (error) => {
          return errorCallBack();
      })
    })    
}

router.post("/store/isp/iamport", function(req, res){
    const _data = req.body.data;
    const user_id = req.body.data.user_id;
    const customer_uid = Util.getPayNewCustom_uid(user_id);
    // const order_id = _data.order_id;
    // console.log(_data);
    const store_id = _data.store_id;
    const item_id = _data.item_id;

    const name = _data.name;
    const contact = _data.contact;
    const email = _data.email;

    const pay_method = _data.pay_method;

    const requestContent = _data.requestContent;

    let total_price = _data.total_price;

    const item_title = _data.title;
    let item_price = _data.item_price;

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    req.body.data.created_at = date;

    const merchant_uid = _data.merchant_uid;

    let currency_code = _data.currency_code;
    if(currency_code === undefined){
        currency_code = types.currency_code.Won;
    }

    let total_price_usd = _data.total_price_usd;
    if(total_price_usd === undefined || total_price_usd === null){
        total_price_usd = 0;
    }

    let price_usd = _data.price_usd;
    if(price_usd === undefined || price_usd === null){
        price_usd = 0;
    }

    if(currency_code === types.currency_code.US_Dollar){
      //달러일 경우 total_price 와 item_price를 0으로 만들어준다.
      total_price = 0;
      item_price = 0;
    }

    let pg = _data.pg;
    if(pg === undefined){
      pg = null;
    }

    const insertOrderItemData = {
        store_id: store_id,
        item_id: item_id,
        user_id: user_id,
        state: types.order.ORDER_STATE_APP_STORE_STANBY,
        count: 1,
        price: item_price,
        price_USD: price_usd,
        total_price: total_price,
        total_price_USD: total_price_usd,
        name: name,
        contact: contact,
        email: email,
        requestContent: requestContent,
        merchant_uid: merchant_uid,
        pay_method: pay_method,
        // imp_uid: imp_uid,
        currency_code: currency_code,
        created_at: date,
        updated_at: date,

        pg: pg
    }

    db.INSERT("INSERT INTO orders_items SET ?", insertOrderItemData, (result_insert_orders_items) => {
        const item_order_id = result_insert_orders_items.insertId;
        req.body.data.order_id = item_order_id;
        // let payingDate = moment_timezone(date).add(7, 'days');
        // payingDate = moment_timezone(payingDate).format("YYYY-MM-DD 13:00:00");
        // payingDate = moment_timezone(payingDate).format("X");

        ///////////품절 됐는지 확인한다.//////////

        this.isSoldOutCheck(item_id, item_order_id, (isSoldOut) => {
            if(isSoldOut){
                let _updateQueryArray = [];
                let _updateOptionArray = [];

                _updateQueryArray.push({
                    key: 0,
                    value: "UPDATE orders_items SET ? WHERE id=?;"
                })

                _updateOptionArray.push({
                    key: 0,
                    value: [
                        {state: types.order.ORDER_STATE_ERROR_TICKET_OVER_COUNT},
                        item_order_id
                    ]
                })

                _updateQueryArray.push({
                    key: 1,
                    value: "UPDATE items SET ? WHERE id=?;"
                })

                _updateOptionArray.push({
                    key: 1,
                    value: [
                        {state: types.item_state.SALE_LIMIT},
                        item_id
                    ]
                })

                db.UPDATE_MULITPLEX(_updateQueryArray, _updateOptionArray, 
                (result_update) => {

                  return res.json({
                    state: res_state.error,
                    message: '해당 상품은 품절되었습니다.',
                  })

                    // if(total_price === 0){
                    //     return res.json({
                    //         state: res_state.error,
                    //         message: '해당 상품은 품절되었습니다.',
                    //     })
                    // }

                    // iamport.payment.cancel({
                    //     merchant_uid: merchant_uid,
                    //     amount: total_price
                    // }).then(function(result_iamport){
                    //     return res.json({
                    //         state: res_state.error,
                    //         message: '해당 상품은 품절되었습니다.',
                    //     })
                    // }).catch(function(error){
                    //     return res.json({
                    //         state: res_state.error,
                    //         message: '해당 상품은 품절되었습니다.' + error.message,
                    //     })
                    // })

                    
                }, (error_update) => {
                    if(total_price === 0){
                        return res.json({
                            state: res_state.error,
                            message: '해당 상품은 품절되었습니다.(상태 업데이트 에러)',
                        })
                    }
                    
                })
                return;
            }else{
                this.setDonation(req, res, (donation_order_id) => {
                  // console.log(donation_order_id);
                  return res.json({
                    result:{
                        state: res_state.success,
                        order_id: item_order_id,
                        donation_order_id: donation_order_id
                    }
                  })
                }, (error) => {
                    return res.json({
                        state: res_state.error,
                        message: '후원 셋팅 에러 (isp pay donation)',
                    })
                })
                
            }            
        });
        /////////////////////////////////////
    })
});

router.post('/store/isp/success', function(req, res){
    this.payStoreComplite(req, res, PAY_SERIALIZER_ONETIME);
});

router.post('/store/isp/error', function(req, res){
    // const imp_uid = req.body.data.imp_uid;
    const merchant_uid = req.body.data.merchant_uid;

    db.UPDATE("UPDATE orders_items SET state=? WHERE merchant_uid=?", [types.order.ORDER_STATE_APP_STORE_STANBY_FAIL, merchant_uid], 
    (result) => {
        return res.json({
            result: {
                state: res_state.success
            }
        })
    }, (error) => {
        return res.json({
            state: res_state.error,
            message: '주문 상태 업데이트 실패(isp 결제 에러)',
            result: {}
        })
    })
})

router.post('/isp/success', function(req, res){
    this.payISPComplite(req, res, PAY_SERIALIZER_ONETIME);
});

router.post('/isp/error', function(req, res){
    const merchant_uid = req.body.data.merchant_uid;
    const pay_isp_type = req.body.data.pay_isp_type;

    if(pay_isp_type === types.pay_isp_type.isp_donation) {
        db.UPDATE("UPDATE orders_donations SET state=? WHERE merchant_uid=?", [types.order.ORDER_STATE_APP_STORE_STANBY_FAIL, merchant_uid], 
        (result) => {
            return res.json({
                result: {
                    state: res_state.success
                }
            })
        }, (error) => {
            return res.json({
                state: res_state.error,
                message: '후원 업데이트 실패(isp 결제 에러)',
                result: {}
            })
        })
    }
    else if(pay_isp_type === types.pay_isp_type.isp_store_item) {
        db.UPDATE("UPDATE orders_items SET state=? WHERE merchant_uid=?", [types.order.ORDER_STATE_APP_STORE_STANBY_FAIL, merchant_uid], 
        (result) => {
            return res.json({
                result: {
                    state: res_state.success
                }
            })
        }, (error) => {
            return res.json({
                state: res_state.error,
                message: '주문 상태 업데이트 실패(isp 결제 에러)',
                result: {}
            })
        })
    }
});

router.post('/store/send/message', function(req, res){
    //결제 성공
    if(process.env.APP_TYPE === 'local'){
      return res.json({
          result: {
              state: res_state.success
          }
      })
    }

    
    const store_order_id = req.body.data.store_order_id;

    const querySelect = mysql.format("SELECT orders_donation.total_price AS donation_total_price, item.type_contents, orders_item.total_price, orders_item.email, orders_item.requestContent, orders_item.created_at AS requested_at, item.price AS item_price, orders_item.user_id AS user_id, store.id AS store_id, store.alias, item.title AS item_title, orders_item.contact, orders_item.name AS customer_name, store.title AS creator_name FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id LEFT JOIN orders_donations AS orders_donation ON orders_item.orders_donation_id=orders_donation.id WHERE orders_item.id=?", store_order_id);

    db.SELECT(querySelect, {}, 
    (result) => {
        if(result.length === 0){
            return res.json({
                result: {
                    state: res_state.success
                }
            })
        }

        const data = result[0];

        let donation_total_price = data.donation_total_price;
        if(donation_total_price === undefined || donation_total_price === null){
          donation_total_price = null;
        }

        this.sendSlackAlim(req, store_order_id, donation_total_price);

        if(data.type_contents === types.contents.completed){
            return res.json({
                result: {
                    state: res_state.success
                }
            })
        }

        const item_title = data.item_title;
        const name = data.customer_name;
        const contact = data.contact;
        const email = data.email;
        const requestContent = data.requestContent;
        const store_id = data.store_id;
        const total_price = data.total_price;
        const date = moment_timezone(data.requested_at).format('YYYY-MM-DD HH:mm:ss');
        const user_id = data.user_id;

        

        // this.sendStoreOrderNineAMEvent(store_order_id);

        this.sendStoreMasterEmailOrder(store_id, item_title, total_price, name, date, requestContent);

        this.sendStoreMasterSMSOrder(store_id, item_title, total_price, name);

        this.sendStoreOrderCompliteEmail(user_id, email, item_title, total_price, name, date, requestContent);

        this.sendStoreOrderCompliteKakaoAlim(store_order_id);

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
//rest api Iamport 요청 ENd


//?imp_uid=xxxxxxx&merchant_uid=yyyyyyy
//iamport webhook verify
router.post('/any/payments/complete', function(req, res){
  
    let yourIP = getUserIP(req);
    let webHookIPList = [];
    if(process.env.APP_TYPE === 'local'){
        // let ip = process.env.IAMPORT_WEB_HOOK_IP_TEST;
        // webHookIPList.push(ip);
        // webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_1);
        // webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_2);
    }
    else if(process.env.APP_TYPE === 'qa'){
      yourIP = process.env.IAMPORT_WEB_HOOK_IP_1;  
    }
    else{
        // webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_1);
        // webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_2);
    }

    webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_1);
    webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_2);

    let isWebHookPass = false;
    for(let i = 0 ; i < webHookIPList.length ; i++){
        const webHookIP = webHookIPList[i];
        if(webHookIP === yourIP){
            isWebHookPass = true;
        }
    }

    if(!isWebHookPass){
        return res.json({
            state: 'error',
            message: '증명되지 않은 IP 입니다.'
        })
    }

    const imp_uid = req.body.imp_uid;
    // const merchant_uid = req.body.merchant_uid;
    // const status = req.body.status;

    iamport.payment.getByImpUid({
      imp_uid: imp_uid  
    }).then(function(result_import){
      // To do
      req.body.amount = result_import.amount;

      this.webhookOrderCheck(req, res, (isComplite) => {
        if(isComplite){
          return res.json({
            state: 'success'
          })
        }
  
        this.webhookOrderItemCheck(req, res, (isComplite) => {

          this.webhookDonationCheck(req, res, (isComplite) => {
            return res.json({
              state: 'success'
            })
          }, (error_message) => {
            return res.json({
              state: 'error',
              message: error_message
            })
          })
        }, (error_message) => {
          return res.json({
            state: 'error',
            message: error_message
          })
        })
      }, (error_message) => {
        return res.json({
          state: 'error',
          message: error_message
        })
      })
      
    }).catch(function(error){
      // handle error
      return res.json({
        state: 'error',
        message: '결제정보가 없습니다.'
      })
    });
});

webhookOrderCheck = (req, res, successCallBack, errorCallBack) => {
  const imp_uid = req.body.imp_uid;
  const merchant_uid = req.body.merchant_uid;
  const status = req.body.status;
  const amount = req.body.amount;

  let orderQuery = "SELECT total_price, state, id FROM orders AS _order WHERE _order.merchant_uid=?"
  orderQuery = mysql.format(orderQuery, [merchant_uid]);
  db.SELECT(orderQuery, [], (result_order) => {
    if(!result_order || result_order.length === 0){
      successCallBack(false);
      return;
    }

    const orderData = result_order[0];
    if(amount === orderData.total_price){
      const orderState = getOrderStateCheckIamportState(status);
      let orderData = {
        imp_uid: imp_uid,
        state: orderState
      }
      db.UPDATE("UPDATE orders SET ? WHERE merchant_uid=?", [orderData, merchant_uid], 
      (result_order_update) => {
          successCallBack(true);
      }, (error) => {
        errorCallBack('주문정보 업데이트 실패');
      });
    }else{
      errorCallBack('결제 금액이 다릅니다.');
    }
  })    
}

webhookOrderItemCheck = (req, res, successCallBack, errorCallBack) => {
  const imp_uid = req.body.imp_uid;
  const merchant_uid = req.body.merchant_uid;
  const status = req.body.status;
  const amount = req.body.amount;

  let orderQuery = "SELECT orders_item.currency_code, orders_item.total_price_USD, orders_item.down_expired_at, orders_item.product_answer, orders_item.created_at, orders_item.confirm_at, item.completed_type_product_answer, orders_item.total_price, orders_item.state, orders_item.id, item.type_contents FROM orders_items AS orders_item LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE merchant_uid=?"
  orderQuery = mysql.format(orderQuery, [merchant_uid]);
  db.SELECT(orderQuery, [], (result_order) => {
    if(!result_order || result_order.length === 0){
      successCallBack(false);
      return;
    }

    const data = result_order[0];

    let total_price = data.total_price;
    if(data.currency_code === types.currency_code.Won){
      total_price = data.total_price;
    }else{
      total_price = data.total_price_USD;
    }

    if(amount === total_price){
      // const orderState = getOrderStateCheckIamportState(status);
      let orderState = ''; 

      
      let down_expired_at = data.down_expired_at;
      let product_answer = data.completed_type_product_answer;
      let confirm_at = data.confirm_at;
      if(status === 'paid'){
        if(data.type_contents === types.contents.completed){
          orderState = types.order.ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE;

          if(confirm_at === undefined || confirm_at === null || confirm_at === ''){
            down_expired_at = moment_timezone(data.created_at).add(59, 'days').format('YYYY-MM-DD 23:59:59');
            product_answer = data.completed_type_product_answer;
            confirm_at = moment_timezone(data.created_at).format('YYYY-MM-DD HH:mm:ss');
          }          
        }else{
          orderState = types.order.ORDER_STATE_APP_STORE_PAYMENT;
        }
      }else{
        orderState = getOrderStateCheckIamportState(status);
      }

      let orderData = {
        imp_uid: imp_uid,
        state: orderState,
        serializer_uid: PAY_SERIALIZER_ONETIME,

        down_expired_at: down_expired_at,
        product_answer: product_answer,
        confirm_at: confirm_at
      }

      db.UPDATE("UPDATE orders_items SET ? WHERE merchant_uid=?", [orderData, merchant_uid], 
      (result_order_update) => {
          successCallBack(true);
      }, (error) => {
        errorCallBack('주문정보 업데이트 실패');
        return;
      });
    }else{
      errorCallBack('결제 금액이 다릅니다.');
      return;
    }
  })
}

webhookDonationCheck = (req, res, successCallBack, errorCallBack) => { 
  const imp_uid = req.body.imp_uid;
  const merchant_uid = req.body.merchant_uid;
  const status = req.body.status;
  const amount = req.body.amount;

  let orderQuery = "SELECT orders_donation.currency_code, orders_donation.total_price_USD, orders_donation.total_price, orders_donation.state, orders_donation.id, orders_donation.item_id, item.type_contents FROM orders_donations AS orders_donation LEFT JOIN items AS item ON orders_donation.item_id=item.id WHERE merchant_uid=?"
  orderQuery = mysql.format(orderQuery, [merchant_uid]);
  db.SELECT(orderQuery, [], (result_order) => {
    if(!result_order || result_order.length === 0){
      successCallBack(false);
      return;
    }

    const data = result_order[0];

    let orderState = '';
    if(data.item_id !== null){
      if(status === 'paid'){
        if(data.type_contents === types.contents.completed){
          orderState = types.order.ORDER_STATE_APP_PAY_SUCCESS_DONATION;
        }else{
          orderState = types.order.ORDER_STATE_APP_STORE_PAYMENT;
        }
      }else{
        orderState = getOrderStateCheckIamportState(status, types.pay_isp_type.isp_donation);
      }
    }else{
      orderState = getOrderStateCheckIamportState(status, types.pay_isp_type.isp_donation);
    }

    
    

    // const orderState = getOrderStateCheckIamportState(status, types.pay_isp_type.isp_donation);
    let orderData = {
      imp_uid: imp_uid,
      state: orderState,
      serializer_uid: PAY_SERIALIZER_ONETIME
    }
    
    db.UPDATE("UPDATE orders_donations SET ? WHERE merchant_uid=?", [orderData, merchant_uid], 
    (result_order_update) => {
        successCallBack(true);
    }, (error) => {
      errorCallBack('주문정보 업데이트 실패');
      return;
    });
    
  })
}



router.post("/cancel", function(req, res){
    const order_id = req.body.data.order_id;
    const user_id = req.body.data.user_id;
    db.UPDATE("UPDATE orders AS _order SET state=? WHERE id=? AND user_id=?", 
    [types.order.ORDER_STATE_CANCEL, order_id, user_id], 
    (result) => {
        if(result === undefined){
            return res.json({
                state: res_state.error,
                message: 'order cancel error',
                result: {
                }
            });
        }

        return res.json({
            result: {
                state: res_state.success
            }
        })
    }, (error) => {
        return res.json({
            state: res_state.error,
            message: 'order cancel error',
            result: {
            }
        });
    });
    // let orderQuery = mysql.format("SELECT id, state FROM orders AS _order WHERE _order.id=?", order_id);
    // db.SELECT(orderQuery, [], (result) => {

    // })
})

router.post("/get/vbank/info", function(req, res){
    const imp_uid = req.body.data.imp_uid;

    iamport.payment.getByImpUid({
        imp_uid: imp_uid  
      }).then(function(result_import){
        // To do
        return res.json({
            ...result_import
        })
      }).catch(function(error){
        // handle error
        return  res.json({
            state: res_state.error,
            message: error.message,
            result:{
                ...error
            }
        });
      });
})
/*
//ios 전용?? 어케할까
router.get('/any/iamport', function(req, res) {
    console.log("1?!?!?!?!?!?!?");
    const hostname = req.headers.host; // hostname = 'localhost:8080'
    let urlHead = "https://" 
    if(process.env.APP_TYPE === 'local' || process.env.APP_TYPE === 'qa'){
        urlHead = "http://"
    }
    let url = urlHead + hostname;

    res.writeHead(200);
    let _templateHTML = templateHTML(url);
    return res.end(_templateHTML);
    // return res.json({
    //     aaa: 'bbbb'
    // })
});
*/
/*
router.post('/any/iamport', function(req, res) {
    console.log("1?!?!?!?!?!?!?");
    
    
    const hostname = req.headers.host; // hostname = 'localhost:8080'
    let urlHead = "https://" 
    if(process.env.APP_TYPE === 'local' || process.env.APP_TYPE === 'qa'){
        urlHead = "http://"
    }
    let url = urlHead + hostname;

    res.writeHead(200);
    let _templateHTML = templateHTML(url);
    return res.end(_templateHTML);
    
    // return res.json({
    //     aaa: 'bbbb'
    // })
});
*/

module.exports = router;