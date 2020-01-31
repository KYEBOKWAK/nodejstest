const redis = require('redis');
//redis 세션관리
//var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);

module.exports = {
  save: function(key_main, value1, expire, callback){
    console.log(value1);
    new Promise(function(resolve, reject){
      const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
      //client.hmset(key_main, key1, value1, 'EX', 10);
      if(expire === 0)
      {
        client.set(key_main, value1);
      }
      else
      {
        client.set(key_main, value1, 'EX', expire);
      }
      
      client.quit();
      return resolve({
        key_main: key_main,
        value: value1,
        expire: expire
      });
    }).then(function(result){
      console.log('redis save success');
      return callback({
        state:'success',
        ...result,
        error: ''
      });
    }).catch(function(error){
      console.log('redis save error');
      return callback({
        state:'error',
        ...error
      });
    });
  },

  load: function(key_main, callback){
    new Promise(function(resolve, reject){

      const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
      client.get(key_main, function(error, reply){
        if(error)
        {
          return resolve({
            state: 'error',
            ...error
          });
        }
        else
        {
          if(reply){
            return resolve({
              state: 'success',
              data: reply,
              error: ''
            });
          }
          else{
            return resolve({
              state: 'error',
              error: 'noData'
            });
          }
          
        }
      });

      client.quit();
    }).then(function(result){
      console.log('promise success : ' + result);
      return callback(result);
    }).catch(function(error){
      console.log('redis load promise error : ' + error);
      return callback({
        state: 'error',
        result: '',
        error: error
      })
    });
  },

  delete: function(key_main, callback){
    new Promise(function(resolve, reject){
      const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
      client.del(key_main);
      client.quit();

      return resolve;
    }).then(function(result){
      return callback({
        state: 'success',
        result: result,
        error: ''
      });
    }).catch(function(error){
      return callback({
        state: 'error',
        result: '',
        error: error
      });
    });
  }
};

/*
module.exports = {
  save: function(key_main, value1, expire, callback){
    console.log(value1);
    new Promise(function(resolve, reject){
      const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
      //client.hmset(key_main, key1, value1, 'EX', 10);
      if(expire === 0)
      {
        client.set(key_main, value1);
      }
      else
      {
        client.set(key_main, value1, 'EX', expire);
      }
      
      client.quit();
      return resolve({
        key_main: key_main,
        value: value1,
        expire: expire
      });
    }).then(function(result){
      console.log('redis save success');
      return callback({
        state:'success',
        ...result,
        error: ''
      });
    }).catch(function(error){
      console.log('redis save error');
      return callback({
        state:'error',
        ...error
      });
    });
  },

  load: function(key_main, callback){
    new Promise(function(resolve, reject){

      const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
      client.get(key_main, function(error, reply){
        if(error)
        {
          return resolve({
            state: 'error',
            ...error
          });
        }
        else
        {
          if(reply){
            return resolve({
              state: 'success',
              data: reply,
              error: ''
            });
          }
          else{
            return resolve({
              state: 'error',
              error: 'noData'
            });
          }
          
        }
      });

      client.quit();
    }).then(function(result){
      console.log('promise success : ' + result);
      return callback(result);
    }).catch(function(error){
      console.log('redis load promise error : ' + error);
      return callback({
        state: 'error',
        result: '',
        error: error
      })
    });
  },

  delete: function(key_main, callback){
    new Promise(function(resolve, reject){
      const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
      client.del(key_main);
      client.quit();

      return resolve;
    }).then(function(result){
      return callback({
        state: 'success',
        result: result,
        error: ''
      });
    }).catch(function(error){
      return callback({
        state: 'error',
        result: '',
        error: error
      });
    });
  }
};
*/