const axios = require('axios');

module.exports = {
  send: function(phonenumber, content){
    axios({
      headers: 
      {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-auth-key': 'FW9vySa6hapMOgZszYKo',
        'x-ncp-service-secret': '0d9f3bc215f745cdbcb2c3bba1fb9191'
      },
      method: 'post',
      url: 'https://api-sens.ncloud.com/v1/sms/services/ncp:sms:kr:256960042991:crowdticket_test/messages',
      data: {
        type:"SMS",
        contentType:"COMM",
        countryCode:"82",
        from:"01096849880",
        to:[
          phonenumber
        ],
        content: content
      }
    }).then(function (response) {
      console.log(response);
      //res.data.messages
    });
  }
};