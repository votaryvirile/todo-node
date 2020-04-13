var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  temporaryPassword: { type: String, default: undefined },
  temporaryPasswordExpiry: { type: String, default: undefined },
  createDate: { type: String },
},
{
  //since validation is handled in the code, this is set to false to reduce process time
  //Validation is handled in code, since node v8 engine is faster than the native mongoose engine

  //For testing purpose you may comment it
  validateBeforeSave: false,
});

var User = module.exports = mongoose.model('user', userSchema);
module.exports.get = function (callback, limit) {
    User.find(callback).limit(limit);
}
