var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const moment = require('moment');

var mysql = require('mysql');
const Util = use('lib/util.js');

const global = use('lib/global_const.js');

getCommentableType = (commentType) => {
  let commentData = types.comment.commentable_type.find((value) => {return value.key === commentType});
  return commentData.value;
}

getCommentableSecondTargetType = (commentSecondTargetType) => {
  let commentData = types.comment.second_target_type.find((value) => {return value.key === commentSecondTargetType});
  return commentData.value;
}

router.post("/", function(req, res){
  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  let commentable_type = this.getCommentableType(commentType);
  
  let call_count = req.body.data.call_comment_count;
  let commentsQueyr = '';

  if(call_count > 0){
    commentsQueyr = mysql.format("SELECT comment.user_id, comment.created_at, comment.id AS comment_id, nick_name, name, profile_photo_url, commentscomment.commentable_id, comment.contents FROM comments AS comment LEFT JOIN users AS user ON comment.user_id=user.id LEFT JOIN comments AS commentscomment ON comment.id=commentscomment.commentable_id WHERE comment.commentable_id=? AND comment.commentable_type=? GROUP BY comment.id ORDER BY comment.id DESC LIMIT "+call_count, [target_id, commentable_type]);
  }else{
    commentsQueyr = mysql.format("SELECT comment.user_id, comment.created_at, comment.id AS comment_id, nick_name, name, profile_photo_url, commentscomment.commentable_id, comment.contents FROM comments AS comment LEFT JOIN users AS user ON comment.user_id=user.id LEFT JOIN comments AS commentscomment ON comment.id=commentscomment.commentable_id WHERE comment.commentable_id=? AND comment.commentable_type=? GROUP BY comment.id ORDER BY comment.id DESC", [target_id, commentable_type]);
  }
  
  db.SELECT(commentsQueyr, [], function(result){
    res.json({
      result: {
        state: res_state.success,
        comments: result
      }
    });
  });    
});

router.post("/detail", function(req, res){
  const comment_id = req.body.data.comment_id;

  db.SELECT("SELECT comment.user_id, comment.created_at, comment.id AS comment_id, nick_name, profile_photo_url, commentscomment.commentable_id, comment.contents, count(commentscomment.id) AS comments_comment_count FROM comments AS comment" + 
            " LEFT JOIN users AS user" +
            " ON comment.user_id=user.id" +
            " LEFT JOIN comments AS commentscomment" +
            " ON comment.id=commentscomment.commentable_id" +
            " WHERE comment.id=?",[comment_id], function(result){
              res.json({
                result: {
                  state: res_state.success,
                  ...result[0]
                }
              });
            });
});

router.post("/edit", function(req, res){
  const comment_id = req.body.data.comment_id;
  const commentValue = req.body.data.comment_value;

  db.UPDATE("UPDATE comments AS comment SET contents=? WHERE comment.id=?", [commentValue, comment_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success,
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '코멘트 수정 에러'
    })
  })
});

router.post("/allcount", function(req, res){
  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  let commentable_type = this.getCommentableType(commentType);

  let commentsQuery = mysql.format("SELECT _comment.created_at, _comment.id FROM comments AS _comment WHERE _comment.commentable_id=? AND _comment.commentable_type=?", [target_id, commentable_type]);
  db.SELECT(commentsQuery, [], function(result_comments){
    let commentIDs = "";
    if(result_comments.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          commentsTotalCount: 0
        }
      })
    }
    
    for(let i = 0 ; i < result_comments.length ; i++){
      const commentData = result_comments[i];
      if(i === result_comments.length - 1){
        commentIDs+=commentData.id.toString();
      }else{
        commentIDs+=commentData.id.toString()+", ";
      }
    }
    commentIDs = "("+commentIDs+")";
    
    const commentType = this.getCommentableType('comment');
    const commentsCommentQuery = mysql.format("SELECT count(commentsComment.id) AS commentsComment_count FROM comments AS commentsComment WHERE commentable_type=? AND commentable_id IN "+commentIDs, [commentType])
    // const commentsCommentQuery = "SELECT count(commentsComment.id) AS commentsComment_count FROM comments AS commentsComment WHERE commentable_id IN "+commentIDs;
    db.SELECT(commentsCommentQuery, [], function(result_commentsComment){
      return res.json({
        result: {
          state: res_state.success,
          commentsTotalCount: result_commentsComment[0].commentsComment_count + result_comments.length
        }
      })
    })
  });
});

//대댓글
router.post('/comment', function(req, res) {
  // let comment_id = req.params.id;
  let comment_id = req.body.data.comment_id;

  db.SELECT("SELECT comment.user_id, comment.created_at, comment.id AS comment_id, nick_name, profile_photo_url, commentable_id, contents FROM comments AS comment" + 
            " LEFT JOIN users AS user" +
            " ON comment.user_id=user.id" +
            " WHERE comment.commentable_id=?" +
            " AND comment.commentable_type='App\\\\Models\\\\Comment'" + 
            " ORDER BY comment.id DESC", [comment_id], function(result){
              res.json({
                result
              });
            });
});

router.post("/add", function(req, res){
  
  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  let commentable_type = this.getCommentableType(commentType);
  const user_id = req.body.data.user_id;
  const commentValue = req.body.data.comment_value;

  // let commentData = types.comment.commentable_type.find((value) => {return value.key === commentable_type});

  var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let commentObject = {
    commentable_id: target_id,
    commentable_type: commentable_type,
    user_id: user_id,
    contents: commentValue,
    created_at: date,
    updated_at: date
  }
  db.INSERT("INSERT INTO comments SET ?", commentObject, function(result_insert_comments){
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: error,
      result:{}
    })
  })
});

router.post("/second/add", function(req, res){
  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  let commentable_type = this.getCommentableType(commentType);
  const user_id = req.body.data.user_id;
  const commentValue = req.body.data.comment_value;

  const second_target_id = req.body.data.second_target_id;
  const second_target_type = this.getCommentableSecondTargetType(req.body.data.second_target_type);

  // let commentData = types.comment.commentable_type.find((value) => {return value.key === commentable_type});

  var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let commentObject = {
    commentable_id: target_id,
    commentable_type: commentable_type,
    user_id: user_id,
    contents: commentValue,

    second_target_id: second_target_id,
    second_target_type: second_target_type,
    created_at: date,
    updated_at: date
  }
  db.INSERT("INSERT INTO comments SET ?", commentObject, function(result_insert_comments){
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: error,
      result:{}
    })
  })
});

router.post("/second/get", function(req, res){
  const second_target_id = req.body.data.second_target_id;
  const second_target_type = this.getCommentableSecondTargetType(req.body.data.second_target_type);

  const querySelect = mysql.format("SELECT id, contents FROM comments WHERE second_target_id=? AND second_target_type=? ORDER BY id DESC", [second_target_id, second_target_type]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          comment_id: null,
          contents: ''
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        comment_id: data.id,
        contents: data.contents
      }
    })
  })
});

router.post("/remove", function(req, res){
  const comment_id = req.body.data.comment_id;
  const user_id = req.body.data.user_id;

  db.SELECT("SELECT user_id FROM comments WHERE id=?", [comment_id], function(result_comment_select){
    if(user_id !== result_comment_select[0].user_id){
      console.log(result_comment_select[0].user_id);
      return res.json({
        state: res_state.error,
        message: "댓글 삭제 불가. 유저 정보가 일치하지 않습니다.",
        result: {}
      })
    }

    //대댓글이 있으면 우선 삭제
    db.DELETE("DELETE FROM comments WHERE commentable_id=? AND commentable_type='App\\\\Models\\\\Comment'", [comment_id], function(result_commentsComment_delete){
      db.DELETE("DELETE FROM comments WHERE id=? AND user_id=?", [comment_id, user_id], function(result_comment_delete){
        return res.json({
          result: {
            state: res_state.success
          }
        });
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: error,
          result:{}
        })
      });
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: error,
        result:{}
      })
    });
  });
});

router.post('/any/list', function(req, res){
  
  // let querySelect = mysql.format("SELECT * FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id ORDER BY item.id DESC LIMIT ? OFFSET ?", [limit, skip]);

  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  let limit = req.body.data.limit;
  let skip = req.body.data.skip

  let commentable_type = this.getCommentableType(commentType);
  
  let querySelect = mysql.format("SELECT comment.user_id, comment.created_at, comment.id AS comment_id, nick_name, name, profile_photo_url, commentscomment.commentable_id, comment.contents, comment.second_target_id FROM comments AS comment LEFT JOIN users AS user ON comment.user_id=user.id LEFT JOIN comments AS commentscomment ON comment.id=commentscomment.commentable_id WHERE comment.commentable_id=? AND comment.commentable_type=? GROUP BY comment.id ORDER BY comment.id DESC LIMIT ? OFFSET ?", [target_id, commentable_type, limit, skip]);

  
  db.SELECT(querySelect, [], function(result){
    res.json({
      result: {
        state: res_state.success,
        list: result
      }
    });
  });    
})

router.post('/any/list/buyer', function(req, res){
  
  // let querySelect = mysql.format("SELECT * FROM items AS item LEFT JOIN stores AS store ON item.store_id=store.id LEFT JOIN users AS user ON store.user_id=user.id ORDER BY item.id DESC LIMIT ? OFFSET ?", [limit, skip]);

  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  let limit = req.body.data.limit;
  let skip = req.body.data.skip

  let commentable_type = this.getCommentableType(commentType);
  
  let querySelect = mysql.format("SELECT comment.user_id, comment.created_at, comment.id AS comment_id, nick_name, name, profile_photo_url, commentscomment.commentable_id, comment.contents, comment.second_target_id FROM comments AS comment LEFT JOIN users AS user ON comment.user_id=user.id LEFT JOIN comments AS commentscomment ON comment.id=commentscomment.commentable_id WHERE comment.commentable_id=? AND comment.commentable_type=? AND comment.second_target_id IS NOT NULL GROUP BY comment.id ORDER BY comment.id DESC LIMIT ? OFFSET ?", [target_id, commentable_type, limit, skip]);

  
  db.SELECT(querySelect, [], function(result){
    res.json({
      result: {
        state: res_state.success,
        list: result
      }
    });
  });    
})

router.post('/any/list/buyer/v1', function(req, res){

  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  const item_id = req.body.data.item_id;
  let limit = req.body.data.limit;
  let skip = req.body.data.skip

  let commentable_type = this.getCommentableType(commentType);
  
  let querySelect = mysql.format("SELECT comment.user_id, comment.created_at, comment.id AS comment_id, user.nick_name, user.name, user.profile_photo_url, comment.contents, comment.second_target_id FROM comments AS comment LEFT JOIN orders_items AS orders_item ON orders_item.id=comment.second_target_id LEFT JOIN users AS user ON comment.user_id=user.id WHERE orders_item.item_id=? AND comment.commentable_id=? AND comment.commentable_type=? AND comment.second_target_id IS NOT NULL GROUP BY comment.id ORDER BY comment.id DESC LIMIT ? OFFSET ?", [item_id, target_id, commentable_type, limit, skip]);

  
  db.SELECT(querySelect, [], function(result){
    res.json({
      result: {
        state: res_state.success,
        list: result
      }
    });
  });    
})

router.post("/any/allcount", function(req, res){
  let commentType = req.body.data.commentType;
  let target_id = req.body.data.target_id;
  let commentable_type = this.getCommentableType(commentType);

  let commentsQuery = mysql.format("SELECT _comment.created_at, _comment.id FROM comments AS _comment WHERE _comment.commentable_id=? AND _comment.commentable_type=?", [target_id, commentable_type]);
  db.SELECT(commentsQuery, [], function(result_comments){
    let commentIDs = "";
    if(result_comments.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          commentsTotalCount: 0
        }
      })
    }
    
    for(let i = 0 ; i < result_comments.length ; i++){
      const commentData = result_comments[i];
      if(i === result_comments.length - 1){
        commentIDs+=commentData.id.toString();
      }else{
        commentIDs+=commentData.id.toString()+", ";
      }
    }
    commentIDs = "("+commentIDs+")";
    
    const commentType = this.getCommentableType('comment');
    const commentsCommentQuery = mysql.format("SELECT count(commentsComment.id) AS commentsComment_count FROM comments AS commentsComment WHERE commentable_type=? AND commentable_id IN "+commentIDs, [commentType])
    // const commentsCommentQuery = "SELECT count(commentsComment.id) AS commentsComment_count FROM comments AS commentsComment WHERE commentable_id IN "+commentIDs;
    db.SELECT(commentsCommentQuery, [], function(result_commentsComment){
      return res.json({
        result: {
          state: res_state.success,
          commentsTotalCount: result_commentsComment[0].commentsComment_count + result_comments.length
        }
      })
    })
  });
});

router.post("/any/second/get", function(req, res){
  const second_target_id = req.body.data.second_target_id;
  const second_target_type = this.getCommentableSecondTargetType(req.body.data.second_target_type);

  const querySelect = mysql.format("SELECT id, contents FROM comments WHERE second_target_id=? AND second_target_type=? ORDER BY id DESC", [second_target_id, second_target_type]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          comment_id: null,
          contents: ''
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        comment_id: data.id,
        contents: data.contents
      }
    })
  })
});

router.post("/second/add/check", function(req, res){
  const user_id = req.body.data.user_id;
  if(user_id === undefined || user_id === null || user_id === ''){
    return res.json({
      state: res_state.error,
      message: '유저 ID가 없습니다.',
      result: {}
    })
  }


  const second_target_id = req.body.data.second_target_id;
  const second_target_type = this.getCommentableSecondTargetType(req.body.data.second_target_type);

  const querySelect = mysql.format("SELECT id, contents FROM comments WHERE second_target_id=? AND second_target_type=? AND user_id=? ORDER BY id DESC", [second_target_id, second_target_type, user_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }

    return res.json({
      state: res_state.error,
      message: '이미 해당 상품의 후기를 작성했습니다.',
      result: {}
    })
  })
})

router.post("/order/item/check", function(req, res){
  const user_id = req.body.data.user_id;
  const item_id = req.body.data.item_id;

  const querySelect = mysql.format("SELECT id FROM orders_items WHERE user_id=? AND item_id=? AND state>=? AND state<?", [user_id, item_id, types.order.ORDER_STATE_APP_PAY_COMPLITE, types.order.ORDER_STATE_PAY_END]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.error,
          store_order_id: null
        }
      })
      // return res.json({
      //   state: res_state.error,
      //   message: '상품을 구매해야 후기 작성이 가능합니다.'
      // })
    }

    const data = result[0];

    return res.json({
      result: {
        state: res_state.success,
        store_order_id: data.id
      }
    })
  })
})

module.exports = router;