const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reply",
    default: [],
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Comment', CommentSchema)
