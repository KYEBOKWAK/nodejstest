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

    console.log(get_day + " 일 " + get_hour + " 시 " + gap_min + " 분 " + gap_sec + ' 초');
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
  
  }
};