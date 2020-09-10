

const jwtType = require('./jwt_type.js');

var jwt = require('jsonwebtoken');

module.exports = {
  CREATE: function(type, data, expiresIn, callback){
    
    switch(type){
      case jwtType.TYPE_JWT_CREATE_UUID:
        break;
      default:
        break;
    }

    let jwtPromise = new Promise(function(resolve, reject){
      jwt.sign({
        ...data
      }, 
      process.env.TOKEN_SECRET, 
      { 
        expiresIn: expiresIn,
        issuer: process.env.JWT_TOKEN_ISSUER,
      }, function(err, token){
        if (err) 
        {
          return resolve({
            state : 'error',
            message : err,
            token : ''
          })
        }
        else
        {
          return resolve({
            state : 'success',
            message : '',
            token : token
          })
        }            
      });
    });

    jwtPromise.then(function(value){
      return callback({
        ...value
      });
    });
  },

  READ: function(token, callback){
    new Promise(function(resolve, reject){
      jwt.verify(token, process.env.TOKEN_SECRET, function(error, decoded){
        if(error)
        {
          return resolve({
            state: 'error',
            ...decoded,
            error: error
          });
        }
        else
        {
          return resolve({
            state: 'success',
            ...decoded,
            error: ''
          });
        }
      });
    }).then(function(result){
      return callback({
        ...result
      });
    }).catch(function(error){
      return callback({
        state: 'error',
        result: '',
        error: error
      });
    });
  },

  CHECK: function(token){
    /*
    jwt.verify(token, process.env.TOKEN_SECRET, function(error, decoded){
      console.log(error.name);
      if(error)
      {
        return {
          state: 'error',
          data: '',
          name: error.name,
          message: error.message
        }
      }
      else
      {
        return {
          state: 'success',
          data: decoded
        }
      }
      console.log(decoded);
    });
    
    */
  }
};