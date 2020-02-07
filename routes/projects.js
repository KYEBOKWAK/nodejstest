var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');

router.get('/:id', function(req, res) {
  // console.log(req.params);
  // db.SELECT("SELECT channel.url as channelLink, categories_channel_id, user.name, user.profile_photo_url, user.introduce, project.title, project.poster_renew_url, project.poster_url, project.story FROM projects AS project" +
  //           " INNER JOIN users AS user" +
  //           " ON project.user_id=user.id" +
  //           " INNER JOIN channels AS channel" +
  //           " ON project.user_id=channel.user_id" +
  //           " WHERE project.id="+req.params.id, function(result){
  //             res.json({
  //               result
  //             });
  //           });
  db.SELECT("SELECT project.id AS project_id, user.id AS user_id, user.name, user.profile_photo_url, user.introduce, project.title, project.poster_renew_url, project.poster_url, project.story, detailed_address, concert_hall FROM projects AS project" +
            " INNER JOIN users AS user" +
            " ON project.user_id=user.id" +
            " WHERE project.id=?", [req.params.id], function(result){
              res.json({
                result
              });
            });

  /*
  db.SELECT("SELECT channel.url as channelLink, categories_channel_id, user.name, user.profile_photo_url, user.introduce, project.title, project.poster_renew_url, project.poster_url, project.story FROM projects AS project" +
            " INNER JOIN users AS user" +
            " ON project.user_id=user.id" +
            " INNER JOIN channels AS channel" +
            " ON project.user_id=channel.user_id" +
            " WHERE project.id="+req.params.id, function(result){
              res.json({
                result
              });
            });
            */
            //name, title, poster_renew_url, poster_url, story
  // db.SELECT("SELECT title, poster_renew_url, poster_url, story FROM projects" + 
  //           " WHERE id="+req.params.id, function(result){
  //             res.json({
  //               result
  //             });
  //           });
});

router.get('/:id/comments', function(req, res) {
  let project_id = req.params.id;

  db.SELECT("SELECT id, commentable_id, contents FROM comments" + 
            " WHERE commentable_id=?" +
            " AND commentable_type='App\\\\Models\\\\Project'", [project_id], function(result){
              res.json({
                result
              });
            });
});

router.get('/:id/comments/count/:count', function(req, res) {
  let project_id = req.params.id;
  let call_count = req.params.count;

  db.SELECT("SELECT comment.id AS comment_id, nick_name, profile_photo_url, commentable_id, contents FROM comments AS comment" + 
            " LEFT JOIN users AS user" +
            " ON comment.user_id=user.id" +
            " WHERE comment.commentable_id=?" +
            " AND comment.commentable_type='App\\\\Models\\\\Project'" + 
            " ORDER BY comment.id DESC LIMIT "+call_count, [project_id], function(result){
              res.json({
                result
              });
            });
  // db.SELECT("SELECT comment.id AS comment_id, nick_name, profile_photo_url, commentable_id, contents FROM comments AS comment" + 
  //           " LEFT JOIN users AS user" +
  //           " ON comment.user_id=user.id" +
  //           " WHERE comment.commentable_id=?" +
  //           " AND comment.commentable_type='App\\\\Models\\\\Project'" + 
  //           " ORDER BY id DESC LIMIT "+call_count, [project_id], function(result){
  //             res.json({
  //               result
  //             });
  //           });
});

module.exports = router;