const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  name: {type: String, required: true},
  author: {type: Schema.Types.ObjectId, ref: 'User'},
  participants: [{type: Schema.Types.ObjectId, ref: 'User'}],
  status: {
    type: String,
    enum: ['In progress', 'Finished', 'Dropped'],
    default: 'In progress',
    required: true
  },
  link: String,
  deadline: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);