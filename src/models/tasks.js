var mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
  task_name: { type: String, required: true },
  task_desc: { type: String, required: true },
  status: {
    type: String, 
    enum: ['not_initiated', 'in_progress', 'completed'],
    default: 'not_initiated' 
  },
  isExpired: { type: Boolean, default: false },
  created_by: { type: String, default: null },
  created_by_name: { type: String, default: null },
  create_date: { type: String },
  expiry_date: { type: String },
  last_update_date: { type: String },
},
{
  validateBeforeSave: false,
});

var Task = module.exports = mongoose.model('task', taskSchema);
module.exports.get = function (callback, limit) {
    Task.find(callback).limit(limit);
}
