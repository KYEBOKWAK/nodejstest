const moment = require('moment');
const use = require('abrequire');
const global = use('lib/global_const.js');

module.exports = {
  getRandomNumber: function(min, max){
    return Math.floor(Math.random()* (max - min + 1)) + min;
  },

  getExpTimer: function(exp){
    let nowDate = new Date();
    let expireDate = new Date(Number(exp) * 1000);
    let gapMiliSec = expireDate.getTime() - nowDate.getTime();

    let gap_sec = Math.floor((gapMiliSec/1000)%60);
    let gap_min = Math.floor(((gapMiliSec/1000)/60)%60);
    let get_hour = Math.floor((((gapMiliSec/1000)/60)/60)%24);
    let get_day = Math.floor((((gapMiliSec/1000)/60)/60)/24);

    // console.log(get_day + " 일 " + get_hour + " 시 " + gap_min + " 분 " + gap_sec + ' 초');
  },

  getLaterTimeInTargetByTimeStamp: function(_targetTime){
    // console.log(_targetTime);
    // let targetTime = Number(_targetTime);
    let targetTime = new Date(Number(_targetTime) * 1000);
    // let targetTime = new Date(Number(_targetTime));
    let now = new Date();
    let gap = Math.round((now.getTime() - targetTime) / 1000);
    console.log(now.getTime());
     
    let D = Math.floor(gap / 86400);
    let H = Math.floor((gap - D * 86400) / 3600 % 3600);
    let M = Math.floor((gap - H * 3600) / 60 % 60);
    let S = Math.floor((gap - M * 60) % 60);
  
    return D + ' ' +H + ' ' +M + ' ';

    if(D > 0)
    {
      return ' ' + D + ' day ago';
    }
    else if(H > 0)
    {
      return ' ' + H + ' hours ago';
    }
    else if(M > 0)
    {
      return ' ' + M + ' minute ago';
    }
    else if(S > 0)
    {
      // return ' 0 minute ago';
      return ' ' + S + ' Sec';
    }

    return D + ' ' +H + ' ' +M + ' ';
  
  },

  getWaitTimeSec: (date) => {
    const waitEndTime = moment(date).add(global.pay.WAIT_TIME_MIN, 'm');
    let gapMiliSecTime = moment(waitEndTime).diff(moment());
    gapMiliSecTime = gapMiliSecTime / 1000;

    // let D = Math.floor(gapMiliSecTime / 86400);
    // let H = Math.floor((gapMiliSecTime - D * 86400) / 3600 % 3600);
    // let M = Math.floor((gapMiliSecTime - H * 3600) / 60 % 60);
    // let S = Math.floor((gapMiliSecTime - M * 60) % 60);

    return gapMiliSecTime;
  },

  getWaitTimeMinWithText: (date) => {
    const waitEndTime = moment(date).add(global.pay.WAIT_TIME_MIN, 'm');
    let gapMiliSecTime = moment(waitEndTime).diff(moment());
    gapMiliSecTime = gapMiliSecTime / 1000;

    let D = Math.floor(gapMiliSecTime / 86400);
    let H = Math.floor((gapMiliSecTime - D * 86400) / 3600 % 3600);
    let M = Math.floor((gapMiliSecTime - H * 3600) / 60 % 60);
    let S = Math.floor((gapMiliSecTime - M * 60) % 60);

    console.log(gapMiliSecTime);
    console.log(M+"분"+S+"초");
    if(M > 0){
      return M+"분";
    }else if(M === 0 && S >= 0){
      return S+"초";
    }else{
      return -1;
    }
    // if(gapMiliSecTime >= 0){
    //   //시간 남음
    //   return M;
    // }else{
    //   //시간 지남
    //   return -1;
    // }
  },

  getShowTimePassByNow: (target_date) => {
    // const waitEndTime = moment(date);
    let gapMiliSecTime = moment(target_date).diff(moment());
    gapMiliSecTime = gapMiliSecTime / 1000;

    // let D = Math.floor(gapMiliSecTime / 86400);
    // let H = Math.floor((gapMiliSecTime - D * 86400) / 3600 % 3600);
    // let M = Math.floor((gapMiliSecTime - H * 3600) / 60 % 60);
    // let S = Math.floor((gapMiliSecTime - M * 60) % 60);

    return gapMiliSecTime;
  },

  getTimeSec: () => {
    var timestamp = Math.floor(new Date().getTime() / 1000)
    return timestamp;
  },

  getPayNewCustom_uid: function(user_id){
    let _appType = '';
    if(process.env.APP_TYPE !== ''){
      _appType = '_'+process.env.APP_TYPE;
    }

    return 'user_'+user_id+_appType;
  },
  getPayNewMerchant_uid: function(project_id, user_id){
    let _appType = '';
    if(process.env.APP_TYPE !== ''){
      _appType = '_'+process.env.APP_TYPE;
    }

    return 'p_'+project_id+'_u_'+user_id+'_'+this.getTimeSec()+_appType;
  },
  getPayNewCustom_uid: function(user_id){
    let _appType = '';
    if(process.env.APP_TYPE !== ''){
      _appType = '_'+process.env.APP_TYPE;
    }

    return 'user_'+user_id+_appType;
  },
  getCardExpire: function(yy, mm){
    return yy+'-'+mm;
  },
  addDays: function(date, days){
    //moment 사용
    return;
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  getSchedulePayDay: function(date){
    //moment 사용
    return;
    let result = new Date(date);
    result.setDate(result.getDate() + 1);

    var dd = result.getDate();
    var mm = result.getMonth() + 1;
    if(mm < 10){
      mm = '0'+mm;
    }
    var yyyy = result.getFullYear();

    return yyyy+"-"+mm+"-"+dd+" "+"13:00:00";
    // console.log(result.getTime());
    // let newDate = new Date("Y-m-d", result.getTime()/1000);
    // return newDate.toTimeString();
  },

  isPrjectFinished: function(funding_closing_at){

    let gapMiliSecTime = moment(funding_closing_at).diff(moment());
    gapMiliSecTime = gapMiliSecTime / 1000;
    
    return gapMiliSecTime < 0;
  },

  isTicketShowFinished: function(show_date){

    let gapMiliSecTime = moment(show_date).diff(moment());
    gapMiliSecTime = gapMiliSecTime / 1000;
    
    return gapMiliSecTime < 0;
  }
};