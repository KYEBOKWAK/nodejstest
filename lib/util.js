const moment = require('moment');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

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
    const waitEndTime = moment_timezone(date).add(global.pay.WAIT_TIME_MIN, 'm');
    let gapMiliSecTime = moment_timezone(waitEndTime).diff(moment_timezone(), 'milliseconds');
    gapMiliSecTime = gapMiliSecTime / 1000;

    return gapMiliSecTime;

    /*
    const waitEndTime = moment(date).add(global.pay.WAIT_TIME_MIN, 'm');
    let gapMiliSecTime = moment(waitEndTime).diff(moment());
    gapMiliSecTime = gapMiliSecTime / 1000;

    return gapMiliSecTime;
    */
  },

  isExpireTime: (time) => {
    if(!time || time === ''){
      return false;
    }
    
    let expireGap = moment(time).diff(moment());
    if(expireGap < 0){
      return true;
    }

    return false;
  },

  isSaling: (sale_start_at) => {
    if(!sale_start_at || sale_start_at === ''){
      return true;
    }

    let isSaling = moment(sale_start_at).diff(moment());
    if(isSaling < 0){
      return true;
    }

    return false;
  },

  isFinishedAndPickingFinished(picking_closing_at, funding_closing_at){    
    if(!this.isExpireTime(funding_closing_at)){
      return false;
    }

    if(!picking_closing_at || picking_closing_at === ''){
      return false;
    }

    if(this.isExpireTime(picking_closing_at)){
      return true;
    }

    return false;    
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
  },

  replaceEmail: function(str){
    //return str;

    var strLength = str.length;
    var resultStr = "";
    var atSignIdx = str.indexOf("@");
    if(atSignIdx > 0)
    {
      //str = str.substr(0, atSignIdx+3);
      //strLength = str.length;
    }

    for(var i = 0 ; i < strLength ; i++)
    {
      if(atSignIdx <= 0)
      {
        if(i == strLength-1)
        {
          resultStr += "*";
        }
        else
        {
          resultStr += str[i];
        }
      }
      else
      {
        if(i == atSignIdx - 1)
        {
          resultStr += "*";
        }
        else if(i == atSignIdx - 2)
        {
          resultStr += "*";
        }
        else if(i == atSignIdx - 3)
        {
          resultStr += "*";
        }
        else
        {
          resultStr += str[i];
        }
      }
    }

    return resultStr;
    //for()
  },
  getReplaceBRTagToEnter: function(str){
    return str.replace(/(\n|\r\n)/g, '<br>');
  },
  getNumberWithCommas: (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  isNoShowDate: (show_date) => {
    if(show_date === '0000-00-00 00:00:00'){
      return true;
    }

    return false;
  },

  getDayKorLableWithDay: (day) => {
    let week = new Array('일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일');
    // let _day = new Date(day).getDay();
    let dayLabel = week[day];
    return dayLabel;
  },

  getDetailShowDateText(show_date){
    if(show_date === '0000-00-00 00:00:00'){
      return ''
    }

    show_date = moment_timezone(show_date).format('YYYY-MM-DD HH:mm:ss');

    let date = show_date.toString();

    var rawDate = date.split(" ");
    var d = rawDate[0].split("-");
    var t = rawDate[1].split(":");

    var targetDate = new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);

    var nowDate = new Date();

    let nowYYYY = nowDate.getFullYear();

    var yyyy = targetDate.getFullYear();
    var mm = targetDate.getMonth() + 1;
    var dd = targetDate.getDate();
    var H = targetDate.getHours();
    var min = targetDate.getMinutes();

    let am_pm = " 오전 ";
    if(H >= 12){
      am_pm = " 오후 ";
    }

    if(H >= 13 ){
      H = H - 12;
    }

    if(mm < 10)
    {
      mm = "0"+mm;
    }

    if(dd < 10)
    {
      dd = "0"+dd;
    }

    if(H < 10){
      // H = "0" + H;
    }

    let minString = '';
    if(min === 0){
      minString = '';
    }else if (min < 10) {
      min = "0" + min;
      minString = " "+min+"분";
    }else{
      minString = " "+min+"분";
    }

    // var ticketCategory = ticketsCategoryText;

    //var ticketCount = $('#ticket_count').val();

    // getShortDayKorLableWithDay


    let timeInfo = am_pm + H + '시' + minString;
    
    var fullTimeInfo = "";
    if(nowYYYY !== yyyy){
      fullTimeInfo = yyyy+". "+mm+". "+dd+" "+this.getDayKorLableWithDay(targetDate.getDay()) + timeInfo;
    }else{
      fullTimeInfo = mm+". "+dd+" "+this.getDayKorLableWithDay(targetDate.getDay()) + timeInfo;
    }

    // var fullTimeInfo = mm+"월"+""+dd+"일"+Util.getShortDayKorLableWithDay(targetDate.getDay());
    // var fullTimeInfo = am_pm + H+':'+min + ' ';

    return fullTimeInfo;
    // return targetDate.getDay();
  },
  getDetailCloseExplainText(date){
    //표시를 위한 남은 날 일 수 계산.
    //00:00:00 기준으로 체크 해야함.

    let resetDate = moment_timezone(date).format('YYYY-MM-DD 00:00:00');

    let closeDate = moment_timezone(resetDate);
    let nowDate = moment_timezone().format('YYYY-MM-DD 00:00:00');;

    let diffDay = closeDate.diff(nowDate, 'days');

    return diffDay;
  },
  getDiffSaleTime(sale_start_at){
    let resetDate = moment_timezone(sale_start_at).format('YYYY-MM-DD HH:mm:00');

    let closeDate = moment_timezone(resetDate);
    let nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:00');;

    let diffMilliSec = closeDate.diff(nowDate, 'milliseconds');
    console.log(diffMilliSec);
    return diffMilliSec;
  }

};