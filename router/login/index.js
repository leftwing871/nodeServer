var express = require('express')
var app = express()
var router = express.Router();
var path = require('path')
var mysql = require('mysql');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session')
var flash = require('connect-flash')

//DATABASE SETTING
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234567890',
  database: 'jsman'
})


connection.connect()

app.use(flash())

//Router !!
router.get('/', function(req, res) {
    //console.log(__dirname)
    //console.log(path.join(__dirname, '../../public/join.html'))
    // res.sendFile(path.join(__dirname, '../../public/join.html'))
    var msg;
    var errMsg = req.flash('error')
    if(errMsg) msg = errMsg;
    
    res.render('login.ejs', {'message': msg})
})

passport.serializeUser(function(user, done) {
    console.log('passport session save', user.id)
    done(null, user);
});
  
passport.deserializeUser(function(id, done) {

    console.log('passport session get id: ', id)
    done(null, id);
});

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done){
    var query = connection.query('select * from user where email=?', [email], function(err, rows){
        if(err) return done(err);

        if(rows.length) {
            return done(null, {'email' : email, 'id': rows[0].uid})
        } else 
        {
            return done(null, false, {'message' : 'your login info is not found'})
        }
    })
    console.log('local-login callback called')
}))

router.post('/', function(req, res, next) {
    // console.log('init');
    // console.log(req);
  passport.authenticate('local-login', function(err, user, info) {
    
    if (err) return res.status(500).json(err);
    if (!user) return res.status(401).json(info.message);
    
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.json(user);
    });
  })(req, res, next);
});

module.exports = router;

