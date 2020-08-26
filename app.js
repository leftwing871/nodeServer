var express = require('express') //node_modules에서 express 관련 파일을 가져오고 함수를 사용할 수 있게 준비해준다
var app = express()
var bodyParser = require('body-parser')
var router = require('./router/index')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var session = require('express-session')
var MySQLStore = require('express-mysql-session')(session)
var db_config = require('./config/config_database.json');
var flash = require('connect-flash')

//mysql module사용을 선언합니다.
var mysql = require('mysql')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))





app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use(router)


passport.serializeUser(function(user, done) {
    console.log('passport session save', user.id)
    done(null, user);
});
  
passport.deserializeUser(function(id, done) {

    console.log('passport session get id: ', id)
    done(null, id);
});

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





//connection 객체를 생성합니다.
var connection = mysql.createConnection({
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database
})

//db에 연결합니다.
connection.connect()

app.use(session({
    secret: 'keyboard cat', 
    resave: false, //false는 바뀔때만 저장소에 값을 저장한다.
    saveUninitialized: true, //세션이 필요하기전 까지는 세션을 구동시키지 않는다.
    store: new MySQLStore(connection)
}))

// //db에 데이터를 요청합니다.
// connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
//   if (err) throw err

//   console.log('The solution is: ', rows[0].solution)
// })

// //db 연결을 해제합니다.
// connection.end()
  
