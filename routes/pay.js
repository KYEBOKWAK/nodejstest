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

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

app.use(express.json())
app.use(cors());

const PAY_SERIALIZER_ONETIME = "onetime"
const PAY_SERIALIZER_SCHEDULE = "scheduled"

function getUserIP(req) {
    const addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return addr;
}

function getOrderStateCheckIamportState(iamport_state){
// 결제가 승인되었을 때(모든 결제 수단) - (status : paid)
// 가상계좌가 발급되었을 때 - (status : ready)
// 가상계좌에 결제 금액이 입금되었을 때 - (status : paid)
// 예약결제가 시도되었을 때 - (status : paid or failed)
// 대시보드에서 환불되었을 때 - (status : cancelled)
    if(iamport_state === 'paid'){
        // return types.order.ORDER_STATE_APP_PAY_COMPLITE;
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

function getStoreOrderStateCheckIamportState(iamport_state){
    // 결제가 승인되었을 때(모든 결제 수단) - (status : paid)
    // 가상계좌가 발급되었을 때 - (status : ready)
    // 가상계좌에 결제 금액이 입금되었을 때 - (status : paid)
    // 예약결제가 시도되었을 때 - (status : paid or failed)
    // 대시보드에서 환불되었을 때 - (status : cancelled)
    if(iamport_state === 'paid'){
        // return types.order.ORDER_STATE_APP_PAY_COMPLITE;
        return types.order.ORDER_STATE_APP_STORE_PAYMENT;
    }
    else if(iamport_state === 'scheduled'){
        // return types.order.ORDER_STATE_PAY_SCHEDULE;
        return types.order.ORDER_STATE_APP_STORE_PAYMENT;
    }
    else if(iamport_state === 'failed'){
        return types.order.ORDER_STATE_PAY_SCHEDULE_RESULT_FAIL;
    }
    else if(iamport_state === 'cancelled'){
        return types.order.ORDER_STATE_CANCEL;
    }
    else{
        return types.order.ORDER_STATE_APP_STORE_PAYMENT;
    }

    /*
        if(iamport_state === 'paid'){
            // return types.order.ORDER_STATE_APP_PAY_COMPLITE;
            return types.order.ORDER_STATE_APP_PAY_COMPLITE;
        }else if(iamport_state === 'ready'){
            return types.order.ORDER_STATE_APP_PAY_WAIT_VBANK;
        }else if(iamport_state === 'failed'){
            return types.order.ORDER_STATE_PAY_SCHEDULE_RESULT_FAIL;
        }else if(iamport_state === 'cancelled'){
            return types.order.ORDER_STATE_CANCEL;
        }else if(iamport_state === 'scheduled'){
            // return types.order.ORDER_STATE_PAY_SCHEDULE;
            return types.order.ORDER_STATE_APP_STORE_READY;
        }
        else{
            return types.order.ORDER_STATE_ERROR_IAMPORT_WEBHOOK_NONE;
        }
        */
    }

// app.set('view engine', 'ejs');
// app.engine('html', require('ejs').renderFile);

/*
function templateHTML(basicURL){
    // console.log(process.env.IAMPORT_IMP);
    const iamport_IMP = process.env.IAMPORT_IMP;
    const iamport_app_scheme = process.env.IAMPORT_APP_SCHEME;
    const redirect_url = basicURL + "/pay/any/payments/complete";
    console.log(redirect_url);
    return `
    <!DOCTYPE html>
    <html>
        <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
        <meta http-equiv="content-type" content="text/html; charset=utf-8">
        <script type="text/javascript" src="https://code.jquery.com/jquery-1.12.4.min.js" ></script>
        <script type="text/javascript" src="https://cdn.iamport.kr/js/iamport.payment-1.1.5.js" ></script>
            <title>크티-결제</title>
        </head>
        <body>
        
        </body>

        <script type="text/javascript">

        var IMP = window.IMP; // 생략가능
        IMP.init("${iamport_IMP}"); // 'iamport' 대신 부여받은 "가맹점 식별코드"를 사용

        callIamPortPay = function(pay_method){
            //onclick, onload 등 원하는 이벤트에 호출합니다
            IMP.request_pay({
                pg : 'nice', // version 1.1.0부터 지원.
                pay_method : pay_method,
                merchant_uid : 'merchant_' + new Date().getTime(),
                name : '주문명:결제테스트',
                amount : 100,
                buyer_email : 'bogame@naver.com',
                buyer_name : '곽계보',
                buyer_tel : '01096849880',    //(필수항목) 누락되거나 blank일 때 일부 PG사에서 오류 발생
                // buyer_addr : '',
                // buyer_postcode : '123-456',
                m_redirect_url : '${redirect_url}',
                app_scheme : '${iamport_app_scheme}',
                display : {
                    card_quota: []
                },
                digital: true //	결제상품이 컨텐츠인지 여부
            }, function(rsp) {
                // window.ReactNativeWebView.postMessage(rsp);
                //모바일은 m_redirect_url 을 통해서 처리한다.
                
                if ( rsp.success ) {
                    var msg = '결제가 완료되었습니다.';
                    msg += '고유ID : ' + rsp.imp_uid;
                    msg += '상점 거래ID : ' + rsp.merchant_uid;
                    msg += '결제 금액 : ' + rsp.paid_amount;
                    msg += '카드 승인번호 : ' + rsp.apply_num;
                } else {
                    var msg = '결제에 실패하였습니다.';
                    msg += '에러내용 : ' + rsp.error_msg;
                }
                

                //alert(msg);
            });

            return true;
        }
        alert("aaaaaa");
        </script>

    </html>
    `
}
*/

/*
function payComplite(req, res, serializer_uid){
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

                let _imp_meta = {
                    serializer_uid: serializer_uid,
                    imp_uid: imp_uid,
                    merchant_uid: merchant_uid
                }
                db.UPDATE("UPDATE orders AS _order SET state=?, imp_uid=?, imp_meta=? WHERE id=?", [orderState, imp_uid, _imp_meta, orderData.id], 
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
}
*/

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
    const pay_method = req.body.data.pay_method;

    // console.log(order_id+"/"+merchant_uid+"/"+imp_uid);
    let orderQuery = "SELECT state, id, total_price FROM orders_items AS _order WHERE _order.id=? AND _order.merchant_uid=?";
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
            const orderState = getStoreOrderStateCheckIamportState('paid');

            db.UPDATE("UPDATE orders_items AS _order SET state=? WHERE id=?", [orderState, orderData.id], 
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
                const orderState = getStoreOrderStateCheckIamportState('scheduled');
                let _imp_meta = {
                    serializer_uid: serializer_uid,
                    merchant_uid: merchant_uid,
                    customer_uid: customer_uid
                };

                _imp_meta = JSON.stringify(_imp_meta);

                db.UPDATE("UPDATE orders_items AS _order SET state=?, imp_uid=?, imp_meta=?, serializer_uid=?, pay_method=? WHERE id=?", [orderState, imp_uid, _imp_meta, serializer_uid, pay_method, orderData.id], 
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
                        const orderState = getStoreOrderStateCheckIamportState(status);
        
                        let _imp_meta = {
                            serializer_uid: serializer_uid,
                            imp_uid: imp_uid,
                            merchant_uid: merchant_uid,
                            customer_uid: customer_uid
                        };
    
                        _imp_meta = JSON.stringify(_imp_meta);
        
                        db.UPDATE("UPDATE orders_items AS _order SET state=?, imp_uid=?, imp_meta=?, serializer_uid=?, pay_method=? WHERE id=?", [orderState, imp_uid, _imp_meta, serializer_uid, pay_method, orderData.id], 
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

router.post('/store/schedule', function(req, res){
    // amount = req.body.data.amount;

    // amount = req.body.data.amount;
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

    const requestContent = _data.requestContent;

    const total_price = _data.total_price;

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    const merchant_uid = Util.getPayStoreNewMerchant_uid(store_id, user_id);

    // const item_price = _data.item_price;

    const insertOrderItemData = {
        store_id: store_id,
        item_id: item_id,
        user_id: user_id,
        state: types.order.ORDER_STATE_STAY,
        count: 1,
        price: total_price,
        name: name,
        contact: contact,
        email: email,
        requestContent: requestContent,
        merchant_uid: merchant_uid,
        created_at: date,
        updated_at: date
    }
    
    db.INSERT("INSERT INTO orders_items SET ?", insertOrderItemData, (result_insert_orders_items) => {
        const item_order_id = result_insert_orders_items.insertId;
        req.body.data.order_id = item_order_id;

        let payingDate = moment_timezone(date).add(7, 'days');
        payingDate = moment_timezone(payingDate).format("YYYY-MM-DD 13:00:00");
        payingDate = moment_timezone(payingDate).format("X");

        // const orderData = result_order[0];
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

        // subscribe/customers
        iamport.subscribe_customer.create({
            ...paymentData
        }).then((result_iamport_subscribe_customer) => {
            if(_data.total_price === 0){
                //0원이면 iamport 안함.
                req.body.data.merchant_uid = merchant_uid;
                req.body.data.imp_uid = 0;
                this.payStoreComplite(req, res, PAY_SERIALIZER_ONETIME);
            }else{
                iamport.subscribe.schedule({
                    ...paymentData,
                    schedules: [
                        {
                            merchant_uid: merchant_uid,
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
                        this.payStoreComplite(req, res, PAY_SERIALIZER_SCHEDULE);
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
    })
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

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    const merchant_uid = Util.getPayStoreNewMerchant_uid(store_id, user_id);

    // const item_price = _data.item_price;

    const insertOrderItemData = {
        store_id: store_id,
        item_id: item_id,
        user_id: user_id,
        state: types.order.ORDER_STATE_STAY,
        count: 1,
        price: total_price,
        total_price: total_price,
        name: name,
        contact: contact,
        email: email,
        requestContent: requestContent,
        merchant_uid: merchant_uid,
        pay_method: pay_method,
        created_at: date,
        updated_at: date
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
                /*
                db.UPDATE("UPDATE orders_items SET state=? WHERE id=?", [types.order.ORDER_STATE_ERROR_TICKET_OVER_COUNT, item_order_id], (result) => {
                    
                    return res.json({
                        state: res_state.error,
                        message: '해당 상품은 품절되었습니다.',
                    })
                }, (error) => {
                    return res.json({
                        state: res_state.error,
                        message: '해당 상품은 품절되었습니다.(상태 업데이트 에러)',
                    })
                })
                */

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
    
            // subscribe/customers
            let _requestContents = Util.getReplaceBRTagToEnter(requestContent);
    
            let _html = `
                        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                        <html xmlns="http://www.w3.org/1999/xhtml">
                          <head>
                            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                            <title>콘텐츠 상점 주문서</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                          </head>
                          <body style="margin:0%">
                            상품명 : ${item_title} <br><br>
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
                // to: 'cyan@crowdticket.kr',
                to: '크라우드티켓<event@crowdticket.kr>',
                from: 'contact@crowdticket.kr',
                subject: `콘텐츠 상점 주문 [${item_title}]`,
                html: _html,
            };
    
            if(_data.total_price === 0){
                //0원이면 iamport 안함.
                if(process.env.APP_TYPE !== 'local'){
                    sgMail.send(msg).then((result) => {
                          
                    }).catch((error) => {
                      
                    });
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
                            sgMail.send(msg).then((result) => {
                            
                            }).catch((error) => {
                            
                            });
                        }
                        
    
                        req.body.data.merchant_uid = result.merchant_uid;
                        req.body.data.imp_uid = result.imp_uid;
                        req.body.data.pay_method = result.pay_method;
                        this.payStoreComplite(req, res, PAY_SERIALIZER_ONETIME);
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
/*
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

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    const merchant_uid = Util.getPayStoreNewMerchant_uid(store_id, user_id);

    // const item_price = _data.item_price;

    const insertOrderItemData = {
        store_id: store_id,
        item_id: item_id,
        user_id: user_id,
        state: types.order.ORDER_STATE_STAY,
        count: 1,
        price: total_price,
        total_price: total_price,
        name: name,
        contact: contact,
        email: email,
        requestContent: requestContent,
        merchant_uid: merchant_uid,
        pay_method: pay_method,
        created_at: date,
        updated_at: date
    }
    
    db.INSERT("INSERT INTO orders_items SET ?", insertOrderItemData, (result_insert_orders_items) => {
        const item_order_id = result_insert_orders_items.insertId;
        req.body.data.order_id = item_order_id;
        // let payingDate = moment_timezone(date).add(7, 'days');
        // payingDate = moment_timezone(payingDate).format("YYYY-MM-DD 13:00:00");
        // payingDate = moment_timezone(payingDate).format("X");
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

        // subscribe/customers
        let _requestContents = Util.getReplaceBRTagToEnter(requestContent);

        let _html = `
                    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <html xmlns="http://www.w3.org/1999/xhtml">
                      <head>
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                        <title>콘텐츠 상점 주문서</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                      </head>
                      <body style="margin:0%">
                        상품명 : ${item_title} <br><br>
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
            // to: 'cyan@crowdticket.kr',
            to: '크라우드티켓<event@crowdticket.kr>',
            from: 'contact@crowdticket.kr',
            subject: `콘텐츠 상점 주문 [${item_title}]`,
            html: _html,
        };

        if(_data.total_price === 0){
            //0원이면 iamport 안함.
            sgMail.send(msg).then((result) => {
                      
            }).catch((error) => {
              
            });

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
                    sgMail.send(msg).then((result) => {
                      
                    }).catch((error) => {
                      
                    });

                    req.body.data.merchant_uid = result.merchant_uid;
                    req.body.data.imp_uid = result.imp_uid;
                    req.body.data.pay_method = result.pay_method;
                    this.payStoreComplite(req, res, PAY_SERIALIZER_ONETIME);
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
    })
});
*/
//rest api Iamport 요청 ENd


//?imp_uid=xxxxxxx&merchant_uid=yyyyyyy
//iamport webhook verify
router.post('/any/payments/complete', function(req, res){
    let yourIP = getUserIP(req);
    let webHookIPList = [];
    if(process.env.APP_TYPE === 'local'){
        let ip = process.env.IAMPORT_WEB_HOOK_IP_TEST;
        webHookIPList.push(ip);
        // webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_1);
        // webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_2);
    }else{
        webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_1);
        webHookIPList.push(process.env.IAMPORT_WEB_HOOK_IP_2);
    }

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
    const merchant_uid = req.body.merchant_uid;
    const status = req.body.status;

    let orderQuery = "SELECT total_price, state, id FROM orders AS _order WHERE _order.imp_uid=? AND _order.merchant_uid=?"
    orderQuery = mysql.format(orderQuery, [imp_uid, merchant_uid]);
    db.SELECT(orderQuery, [], (result_order) => {
        if(!result_order || result_order.length === 0){
            return  res.json({
                result:{
                    state: res_state.error,
                    message: '주문 결과가 없습니다.'
                }
            });
        }

        const orderData = result_order[0];
        iamport.payment.getByImpUid({
            imp_uid: imp_uid  
          }).then(function(result_import){
            // To do
            if(result_import.amount === orderData.total_price){
                const orderState = getOrderStateCheckIamportState(status);
                db.UPDATE("UPDATE orders AS _order SET state=? WHERE id=?", [orderState, orderData.id], 
                (result_order_update) => {
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
                            state: res_state.success
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
                result:{
                    state: res_state.error,
                    message: '결제정보가 없습니다.'
                }
            });
          });
    })      

    //'p_%d_u_%d_%d%s'
    // is req.body.imp_uid
    // 52.78.100.19
    // 52.78.48.223
    // console.log(yourIP);
    
});

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