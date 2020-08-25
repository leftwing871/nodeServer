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
    
    res.render('join.ejs', {'message': msg})
})

passport.serializeUser(function(user, done) {
    console.log('passport session save', user.id)
    done(null, user);
});
  
passport.deserializeUser(function(id, done) {

    console.log('passport session get id: ', id)
    done(null, id);
});

passport.use('local-join', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done){
    var query = connection.query('select * from user where email=?', [email], function(err, rows){
        if(err) return done(err);

        if(rows.length) {
            console.log('existed user')
            return done(null, false, {message : 'your email is already used'})
        } else 
        {
            var sql = {email: email, pw:password, name:''};
            var query = connection.query('insert into user set ?', sql, function(err, rows){
                if(err) throw err
                return done(null, {'email': email, 'id': rows.insertId})
            })
        }
    })
    console.log('local-join callback called')
}))

router.post('/', passport.authenticate('local-join', {
    successRedirect: '/main',
    failureRedirect: '/join',
    failureFlash: true
}))

module.exports = router;

