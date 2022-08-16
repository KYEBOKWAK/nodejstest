const env = require('dotenv');
require('dotenv').config();
var mysql = require('mysql2');


// const pool = mysql.createConnection({
//   host: process.env.DB_HOST_WRITE,
//   user: process.env.DB_USERNAME,
// 	password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   multipleStatements: true,
// 	charset: 'utf8mb4'
// });


const pool = mysql.createPool({
  host: process.env.DB_HOST_WRITE,
  user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
	charset: 'utf8mb4'
});


module.exports = pool;