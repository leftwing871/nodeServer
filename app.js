var express = require('express') //node_modules에서 express 관련 파일을 가져오고 함수를 사용할 수 있게 준비해준다
var app = express()
var bodyParser = require('body-parser')
var router = require('./router/index')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var session = require('express-session')
var flash = require('connect-flash')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))


app.use(session({
  secret: 'keyboar cat',
  resave: false,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use(router)


//Static file 제공
app.use(express.static('public'))


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs')

app.listen(3000, function() {
    console.log("start!! express server on port 3000");
})

// app.get('/', function(req, res) {
//     //res.send("<h1>hi node!</h1>")
//     //res.sendFile("/home/ec2-user/environment/nodeServer/public/main.html")
//     res.sendFile(__dirname + "/public/main.html")
// })



//mysql module사용을 선언합니다.
var mysql = require('mysql')

//connection 객체를 생성합니다.
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234567890',
  database: 'jsman'
})

//db에 연결합니다.
connection.connect()

// //db에 데이터를 요청합니다.
// connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
//   if (err) throw err

//   console.log('The solution is: ', rows[0].solution)
// })

// //db 연결을 해제합니다.
// connection.end()

  
// app.use(session({
//     secret: 'keyboard cat', 
//     resave: false, 
//     saveUninitialized: true
// }))

