var express = require('express');
var app = express();
var router = express.Router();
const cors = require('cors');
const use = require('abrequire');

const Util = use('lib/util.js');

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

app.use(express.json())
app.use(cors());

function getUserIP(req) {
    const addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return addr;
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

//rest api Iamport 요청 START
router.post('/complite', function(req, res){
    res.json({
        result:{
            state: 'success'
        }
    })
});

router.post('/onetime', function(req, res){
    // amount = req.body.data.amount;
    const _data = req.body.data[0];
    const user_id = req.body.data.user_id;
    // console.log(_data);
    const project_id = _data.project_id;
    // const total_price = _data.total_price;

    const paymentData = {
        project_id: project_id,
        card_number: _data.card_number,
        expiry: Util.getCardExpire(_data.card_yy, _data.card_mm),
        amount: _data.total_price, //onetime total_price는 order_id의 db 조회해서 total_price와 비교한다.
        merchant_uid: Util.getPayNewMerchant_uid(project_id, user_id),
        birth: _data.card_birth,
        customer_uid: Util.getPayNewCustom_uid(user_id),
        pwd_2digit: _data.card_pw_2digit,
        name: _data.title,
        buyer_name: '김종윤',
        buyer_email: 'localhost8000@naver.com',
        buyer_tel: '01095053639'
    };
    
    iamport.subscribe.onetime({
        ...paymentData
    }).then(function(result){
        // To do
        console.log("success");
        console.log(result);
    }).catch(function(error){
        // handle error
        console.log("error");
        console.log(error);
    });
    
    
    // return res.json({
    //     result: {
    //         state: 'error',
    //         message: 'aaa'
    //     }
    // });
});

router.post('/schedule', function(req, res){
    // amount = req.body.data.amount;
    /*
    const _data = req.body.data[0];
    const user_id = req.body.data.user_id;
    // console.log(_data);
    const project_id = _data.project_id;
    // const total_price = _data.total_price;
    //schedule(params)
    const paymentData = {
        project_id: project_id,
        card_number: _data.card_number,
        expiry: Util.getCardExpire(_data.card_yy, _data.card_mm),
        amount: _data.total_price, //onetime total_price는 order_id의 db 조회해서 total_price와 비교한다.
        merchant_uid: Util.getPayNewMerchant_uid(project_id, user_id),
        birth: _data.card_birth,
        customer_uid: Util.getPayNewCustom_uid(user_id),
        pwd_2digit: _data.card_pw_2digit,
        name: _data.title,
        buyer_name: '김종윤',
        buyer_email: 'localhost8000@naver.com',
        buyer_tel: '01095053639'
    };
    
    iamport.subscribe.schedule({
        ...paymentData
    }).then(function(result){
        // To do
        console.log("success");
        console.log(result);
    }).catch(function(error){
        // handle error
        console.log("error");
        console.log(error);
    });
    
    */
    // return res.json({
    //     result: {
    //         state: 'error',
    //         message: 'aaa'
    //     }
    // });
});
//rest api Iamport 요청 ENd


//?imp_uid=xxxxxxx&merchant_uid=yyyyyyy
router.post('/any/payments/complete', function(req, res){
    console.log('######## payments complete!!');
    // console.log(req.query.imp_uid);
    console.log(req.body);
    let yourIP = getUserIP(req);
    // 52.78.100.19
    // 52.78.48.223
    console.log(yourIP);
    return res.json({
        test: 'test'
    })
});
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