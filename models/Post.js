const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: [],
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    default: ""
  }
})

module.exports = mongoose.model('Post', PostSchema)
