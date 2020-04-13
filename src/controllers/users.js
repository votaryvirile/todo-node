const bcrypt = require('bcryptjs');
const redis = require('redis');
const crypto = require('crypto');

const isDev = process.env.NODE_ENV === 'dev';
const isProd = process.env.NODE_ENV === 'prod';

if(isDev || isProd) {
var redisClient = redis.createClient({
                port: 6379,
                host: 'redis',
              });
}  else {
  var redisClient = redis.createClient();
}

User = require('../models/users');

var sendMail = require('../utils/mailer');
const uuid = require('../utils/uuidGenerator');

exports.new = function (req, res) {
  try {
    let lastAtPos = req.body.email.lastIndexOf('@');
    let lastDotPos = req.body.email.lastIndexOf('.');
    // Check to email and name field input is available or not
    if(req.body.email.length === 0 || req.body.name.length <=3 || 
      // !req.body.name.match(/^[a-zA-Z0-9]+$/) || 
    //Check phone Number and number of digits (Set to 10)
    !req.body.phone.match(/^[0][1-9]\d{9}$|^[1-9]\d{9}$/g) ||
    //Check password for uppercase, lowercase, number and minimum 6characters
     !req.body.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/) ||
     //Check email format
    !(lastAtPos < lastDotPos && lastAtPos > 0 && req.body.email.indexOf('@@') == -1 && req.body.email.indexOf('..') == -1&& lastDotPos > 2 && (req.body.email.length - lastDotPos) > 2)) {
      res.status(422).json({
        status: 'missing_field',
        message: 'Enter all the required field, and check the format',
      })
    }
    else {
      User.find({email: req.body.email}, function(err, user) {
        if (err) res.status(404).send(err);
        else if((user[0] !== undefined) && (user[0].email === req.body.email)) {
          res.status(409).json({
            status: 'duplicate',
            message: 'The user with the email address is already present, choose another',
          })
        }
        else if(user[0] === undefined) {
          var user = new User();
          user.name =  req.body.name;
          user.email = req.body.email;
          user.phone = req.body.phone;
          user.createDate = new Date(Date.now()).toLocaleString();
          bcrypt.hash(req.body.password, 10, function(err, hash) {
            user.password = hash;
            user.save(async function (err, userDetails) {
              if (err) res.status(404).send(err);
              else {
                //This mailer requires a AWS SES Service, for which environment variable is neccessary
                //Set your .env file with aws access key and secret key, with a minimum sandbox configuration

                // var subject = 'Welcome Email';
                // var body = `<b>Dear ${req.body.name},</b>\n\n` + 
                //         `<p>Your Account is successfully created with us</p>\n\n` +
                //         `<p>Hold your clutch and create your first task</p>\n\n` +
                //         `<p>We are proud to invite you to our community</p>`;
                // var mailNewUser = await sendMail(req.body.email, subject, null, body);
                res.status(200).json({
                  status: 'success',
                  message: 'Signup successful!',
                }); 
              }
            });
          });
        }
      });
    }
  } catch (e) {
    res.send(e);
  }
};

exports.login = function (req, res) {
  try {
    User.find({ email: req.body.email }, function (err, user) {
        if (err) res.status(404).send(err);
        else if (user[0] === undefined) {
          res.status(404).json ({
            status: 'duplicate',
            message: 'User with the provided email is not in our records. Check for valid email',
          });
        }
        else if(user && user[0] !== undefined){
          bcrypt.compare(req.body.password, user[0].password, function(err, loginSuccess) {
              if (loginSuccess && (req.body.password !== user[0].temporaryPassword)) {
                const token = uuid();
                redisClient.hset(
                  token, [ 
                    "user_id" , user[0].id , 
                    "user_name" , user[0].name,
                    "user_email" , user[0].email,
                    "user_phone" , user[0].phone,
                    "user_token", token,
                  ], function(err, res) {
                });
                res.cookie('electron', user[0].id);
                res.status(200).json({
                    status: 'success',
                    message: 'Login successful',
                    data: {
                      name: user[0].name,
                      email: user[0].email,
                      id: user[0].id,
                    },
                    token: token
                });
              } else if (loginSuccess && (req.body.password === user[0].temporaryPassword)) {
                  var resetDate = Date.now();
                  if(resetDate >= user[0].temporaryPasswordExpiry) {
                    res.json({
                      status: 'expired',
                      message: 'Your Temporary Password is Expired. Work on the Forget Password Link again',
                    });
                  }
                  else if(resetDate <= user[0].temporaryPasswordExpiry) {
                    res.json({
                      status: 'reset',
                      message: 'The User Supplied a temporary password and need to reset the account',
                    });
                  }
              } else {
                res.json({
                    status: 'wrong_pwd',
                    message: 'Login Failed, Wrong password.If you tried resetting your account, please use the temporary password',
                });
              }
          });
        }
    });
  } catch (e) {
    res.send(e);
  }
};

exports.profile = function (req, res) {
  const accessKey = req.headers["x-api-key"];
  const user = req.cookies["electron"];
  redisClient.hmget(accessKey, "user_token", "user_id", "user_name" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      try {
        User.findById(activeUser[1], function(err, user) {
          if(err) res.status(404).send(err);
          else {
            res.json({
              message: 'User details fetched',
              data: {
                name: user.name,
                id: user.id,
                email: user.email
              }
            });
          }
        });
      } catch (e) {
        res.send(e);
      }
    }
  });
}

//Not integrated with UI since it requires email service. 
// (If needed I could configure for specific email ids alone, because of SES Sandbox limitation)
exports.reset = function (req, res) {
 try {
    User.find({ email: req.body.email }, function (err, user) {
      if (err) res.send(err);
      else if (user[0] === undefined) {
        res.json ({
          message: 'We are sorry to say that we do not find you with us. If you feel so, then try other options or contact administrator',
        });
      } else  {
        const resetToken = crypto.randomBytes(6).toString('hex');
        user[0].temporaryPassword = resetToken;
        user[0].temporaryPasswordExpiry = Date.now() + 3600000;
        bcrypt.hash(resetToken, 10, function(err, hash) {
          user[0].password = hash;
          user[0].save(async function (err) {
            if (err) res.send(err);
            else {
              var subject = 'Todo Task app Password Reset';
              var body = `<b>Dear ${user[0].name},</b>\n\n` + 
                          `<p>You have made a password reset</p>\n\n` +
                          `<p>Your Temporary Password is <b>${resetToken}</b></p>`;
              var mailTempPwd = await sendMail(req.body.email, subject, null, body);
              if (mailTempPwd && mailTempPwd.status === 'failed') {
                res.json({
                  message: 'Sorry. We are facing certain problems with our E-Mail servers. Try after sometime'
                })
              } else if (mailTempPwd && mailTempPwd.status === 'success') {
                res.json({
                  message: 'A Temporary Password has been sent to the Registered email',
                }); 
              }
            }
          });
        });
      }
    });
  } catch (e) {
    res.send(e);
  } 
}

exports.updateResetPassword = function(req, res) {
  try {
    User.find({email: req.query.email}, function(err, user) {
      if (err) res.send(err);
      var resetDate = Date.now();
      if (user[0] !== undefined && resetDate >= user[0].temporaryPasswordExpiry) {
        res.json({
          message: 'Howdy! Your temporary password is expired. Please work on resetting again',
        });
      } 
      else if (user[0] !== undefined && resetDate <= user[0].temporaryPasswordExpiry && (user[0].temporaryPassword === req.query.temporary_password)) {
        bcrypt.hash(req.body.password, 10, function(err, hash) {
          user[0].password = hash;
          user[0].temporaryPassword = undefined,
          user[0].temporaryPasswordExpiry = undefined
          user[0].save(function (err) {
            if (err) res.send(err);
            res.json({
              message: 'The Password has been reset successfully',
            });
          });
        });
      } else if (user[0] !== undefined && resetDate <= user[0].temporaryPasswordExpiry && (user[0].temporaryPassword !== req.query.temporary_password)) {
        res.json({
          message: 'The Temporary password supplied by you is wrong!'
        });        
      } else {
        res.json({
          message: 'Something is wrong with us. Please contact the administrator',
        });
      }
    });
  } catch (e) {
    res.send(e);
  }
}

exports.index = function (req, res) {
  const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_role" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      try {
        var pageLimit = 50;
        var pageCount = pageLimit * req.query.page;
        User.find({}, {}, {skip: pageCount, limit:pageLimit}, function (err, users) {
            if (err) {
                res.json({
                    status: "error",
                    message: err,
                });
            } else {
              filteredData = (users, user) => {
                var data = [];
                users.forEach((user) => {
                  data.push(individualUserData(user));
                });
                return data;
              }
              individualUserData = (user) => {
                return {
                  id: user._id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                }
              }
              res.json({
                status: "success",
                message: "Users retrieved successfully",
                data: filteredData(users)
              });
            }
        }).lean({ virtuals: true });
      } catch (e) {
        res.send(e);
      }
    }
  });
};


//This api is used to remove user from the redis thread, since session is managed in redis Session Storage
exports.logout = function(req, res) {
  const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_id" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      redisClient.del(activeUser[0], function(err) {
        res.status(200).json({
          status: 'success',
          message: 'Logged out successfully',
        });
      });
    }
  });
}
