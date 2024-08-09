const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: [],
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: [],
  }],
  profileImg: {
    type: String,
    default: "",
  },
  coverImg: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    required: true,
    default: 'BASIC'  
  },
  link: {
    type: String,
    default: "",
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: [],
  }],
  likedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: [],
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: [],
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
})

module.exports = mongoose.model('User', UserSchema)
