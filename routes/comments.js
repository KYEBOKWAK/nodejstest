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

module.exports = router;