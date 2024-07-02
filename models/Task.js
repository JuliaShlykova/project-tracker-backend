const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const taskSchema = new Schema({
  name: {type: String, required: true},
  taskType: {
    type: String,
    enum: ['Issue', 'Task'],
    default: 'Task',
    required: true
  },
  project: {type: Schema.Types.ObjectId, ref: 'Project'},
  assignee: {type: Schema.Types.ObjectId, ref: 'User'},
  done: {type: Boolean, default: false},
  dueDate: {type: Date},
  description: String,
  completedDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);