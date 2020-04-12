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

Task = require('../models/tasks');

var sendMail = require('../utils/mailer');
const uuid = require('../utils/uuidGenerator');

exports.new = function (req, res) {
	const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_id", "user_name" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
			try {
				var task = new Task({
					...req.body,
		    	created_by: activeUser[1],
		    	created_by_name: activeUser[2],
		    	create_date: new Date(Date.now()).toLocaleString(),
		    	last_update_date: new Date(Date.now()).toLocaleString(),
		    });
		    task.save(function (err, taskDetails) {
			    if (err) res.status(404).send(err);
			    else {
			      // var subject = 'Task has been Created';
			      // var body = `<b>Dear ${req.body.name},</b>\n\n` + 
			      //         `<p>You have created a task Just now</p>\n\n` +
			      //         `<p>The task is now listed in your dashboard</p>\n\n` +
			      //         `<p>You can access it anytime</p>`;
			      // sendMail(req.body.email, subject, null, body);
			      res.status(200).json({
              status: 'success',
			        message: 'Task has been created Successfully!',
			      }); 
			    }
			  });
			} catch (e) {
		    res.send(e);
		  }
		}
	});
}

exports.delete = function (req, res) {
	const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_id", "user_name" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
    	Task.findById(req.params.task_id, function(err, task) {
    		if(err) res.send(err);
    		else if(task.created_by !== activeUser[1]) {
    			res.json({
            status: 'warning',
    				message: 'You can only delete those tasks created by you'
    			})
    		}
    		else if(task.created_by === activeUser[1]) {
    			Task.deleteOne({_id: req.params.task_id}, function(err, deleted) {
    				if(err) res.send(err);
    				else {
    					res.json({
                status: 'success',
    						message: 'The task has been deleted Successfully'
    					});
    				}
    			})
    		}
    	});
    }
  });
}

exports.update = function (req, res) {
  const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_id", "user_name" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      var task = {}
      for (field in req.body) {
        task[field] = req.body[field]  
      }
      var options = {new: true};
      Task.findByIdAndUpdate(req.params.task_id, task, options, function (err, task) {
        if (err) res.send(err);
        else {
          res.json({
            status: 'success',
            message: 'Task Info updated',
          });
        }
      });
    }
  });
};

exports.index = function (req, res) {
  const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_role" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      try {
        var pageLimit = 50;
        var pageCount = pageLimit * req.query.page;
        Task.find({}, {}, {skip: pageCount, limit:pageLimit}, function (err, tasks) {
            if (err) {
                res.json({
                    status: "error",
                    message: err,
                });
            } else {
              res.json({
                status: "success",
                message: "Users retrieved successfully",
                data: tasks
              });
            }
        }).lean({ virtuals: true });
      } catch (e) {
        res.send(e);
      }
    }
  });
};

exports.usertask = function (req, res) {
  const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_id" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      try {
        Task.find({created_by: activeUser[1]}, function(err, tasks) {
          if(err) res.status(404).send(err);
          else {
            filteredData = (tasks, task) => {
                var data = [];
                tasks.forEach((task) => {
                  var now = Date.now();
                  var expiry =Date.parse(task.expiry_date);
                  if(now >= expiry) {
                    task.isExpired = true
                  }
                  data.push(individualFilterData(task));
                });
                return data;
              }
              individualFilterData = (task) => {
                return {
                  id: task._id,
                  task_name: task.task_name,
                  task_desc: task.task_desc,
                  status: task.status,
                  expiry_date: task.expiry_date,
                  isExpired: task.isExpired,
                }
              }
              res.json({
                status: "success",
                message: "Users retrieved successfully",
                data: filteredData(tasks)
              });
          }
        });
      } catch(e) {
        console.log(e);
      }
    }
  });
}

exports.view = function (req, res) {
  const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_id" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      try {
        Task.findById(req.params.task_id, function(err, task) {
          if(err) res.status(404).send(err);
          else {
            var now = Date.now();
            var expiry =Date.parse(task.expiry_date);
            if (now >= expiry) {
              var status = true;
            } else {
              var status = false;
            }
            res.status(200).json({
              status: 'success',
              message: 'task retrived successfully',
              data: task,
              isExpired: status,
            });
          }
        });
      } catch(e) {
        console.log(e);
      }
    }
  });
}

exports.indexexpiry = function (req, res) {
  const accessKey = req.headers["x-api-key"];
  redisClient.hmget(accessKey, "user_token", "user_role" , function (err, activeUser) {
    if (!accessKey || accessKey !== activeUser[0]) return res.status(401).send("Access Denied. Authentication Failure");
    else {
      try {
        Task.find({}, function (err, tasks) {
            if (err) {
                res.json({
                    status: "error",
                    message: err,
                });
            } else {
              filteredData = (tasks, task) => {
                var data = [];
                tasks.forEach((task) => {
                  var now = Date.now();
                  var expiry =Date.parse(task.expiry_date);
                  if(now >= expiry) {
                    task.isExpired = true
                  }
                  data.push(individualFilterData(task));
                });
                return data;
              }
              individualFilterData = (task) => {
                return {
                  id: task._id,
                  task_name: task.task_name,
                  task_desc: task.task_desc,
                  status: task.status,
                  expiry_date: task.expiry_date,
                  isExpired: task.isExpired,
                }
              }
              res.json({
                status: "success",
                message: "Users retrieved successfully",
                data: filteredData(tasks)
              });
            }
        }).lean({ virtuals: true });
      } catch (e) {
        res.send(e);
      }
    }
  });
};