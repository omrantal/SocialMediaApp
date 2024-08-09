const User = require('../models/User')
const Post = require('../models/Post')
const Comment = require('../models/Comment')
const Reply = require('../models/Reply')
const Notification = require('../models/Notification')

const { v2: cloudinary } = require('cloudinary');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
} = require('graphql')
const { Kind } = require('graphql/language')

// User Type
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    fullname: { type: GraphQLString },
    username: { type: GraphQLString },
    email: { type: GraphQLString },
    role: { type: GraphQLString },
    token: { type: GraphQLString },
    followers: {
      type: new GraphQLList(UserType),
      resolve: async (parent, args, context) => {
        const users = await User.findById(parent.id).populate({
          path: 'followers',
          select: 'id fullname username'
        })

        return users.followers
      }
    },
    following: {
      type: new GraphQLList(UserType),
      resolve: async (parent, args, context) => {
        const users = await User.findById(parent.id).populate({
          path: 'following',
          select: 'id fullname username'
        })

        return users.following
      }
    },
    savedPosts: { type: new GraphQLList(GraphQLID) },
    likedPosts: { type: new GraphQLList(GraphQLID) },
    link: { type: GraphQLString },
    profileImg: { type: GraphQLString },
    coverImg: { type: GraphQLString },
    createdAt: {
      type: new GraphQLScalarType({
        name: 'UserDate',
        description: 'Date custom scalar type',
        parseValue(value) {
          return new Date(value)
        },
        serialize(value) {
          return new Date(value)
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return new Date(ast.value)
          }
          return null
        }
      })
    }
  })
})

// Reply Type
const ReplyType = new GraphQLObjectType({
  name: 'Reply',
  fields: () => ({
    id: { type: GraphQLID },
    username: { type: GraphQLString },
    content: { type: GraphQLString },
    postId: { type: GraphQLID },
    commentId: { type: GraphQLID },
    userId: { type: GraphQLID },
    createdAt: {
      type: new GraphQLScalarType({
        name: 'ReplyDate',
        description: 'Date custom scalar type',
        parseValue(value) {
          return new Date(value)
        },
        serialize(value) {
          return new Date(value)
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return new Date(ast.value)
          }
          return null
        }
      })
    }
  })
})

// Comment Type
const CommentType = new GraphQLObjectType({
  name: 'Comment',
  fields: () => ({
    id: { type: GraphQLID },
    username: { type: GraphQLString },
    content: { type: GraphQLString },
    postId: { type: GraphQLID },
    userId: { type: GraphQLID },
    replies: {
      type: new GraphQLList(ReplyType),
      resolve(parent, args) {
        return Reply.find({ commentId: parent.id })
      }
    },
    createdAt: {
      type: new GraphQLScalarType({
        name: 'CommentDate',
        description: 'Date custom scalar type',
        parseValue(value) {
          return new Date(value)
        },
        serialize(value) {
          return new Date(value)
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return new Date(ast.value)
          }
          return null
        }
      })
    }
  })
})

// Post Type
const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLID },
    username: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLID },
    likes: { type: new GraphQLList(GraphQLID) },
    comments: {
      type: new GraphQLList(CommentType),
      resolve(parent, args) {
        return Comment.find({ postId: parent.id }).sort({ createdAt: -1 })
      }
    },
    createdAt: {
      type: new GraphQLScalarType({
        name: 'PostDate',
        description: 'Date custom scalar type',
        parseValue(value) {
          return new Date(value)
        },
        serialize(value) {
          return new Date(value)
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return new Date(ast.value)
          }
          return null
        }
      })
    },
    imageUrl: { type: GraphQLString }
  }),
})

// Notification Type
const NotificationType = new GraphQLObjectType({
  name: 'Notification',
  fields: () => ({
    id: { type: GraphQLID },
    from: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.from)
      }
    },
    to: { type: GraphQLID },
    type: { type: GraphQLString },
    read: { type: GraphQLBoolean },
    createdAt: {
      type: new GraphQLScalarType({
        name: 'NotificationDate',
        description: 'Date custom scalar type',
        parseValue(value) {
          return new Date(value)
        },
        serialize(value) {
          return new Date(value)
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return new Date(ast.value)
          }
          return null
        }
      })
    }
  })
})

// Queries
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {

    // isAuthenticated
    isAuthenticated: {
      type: GraphQLBoolean,
      resolve(parent, args, { req, res }) {
        return req.isAuth
      }
    },

    // Get me
    me: {
      type: UserType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          return User.findById(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get user profile
    userProfile: {
      type: UserType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          return User.findById(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get users
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args, context) {
        if (context.req.isAuth && context.req.isAdmin) {
          return User.find()
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get followers
    followers: {
      type: new GraphQLList(UserType),
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { id }, context) => {
        if (context.req.isAuth) {
          const users = await User.findById(id).populate({
            path: 'followers',
            select: 'id fullname username'
          })

          return users.followers
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get following
    following: {
      type: new GraphQLList(UserType),
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { id }, context) => {
        if (context.req.isAuth) {
          const users = await User.findById(id).populate({
            path: 'following',
            select: 'id fullname username'
          })

          return users.following
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get suggested users
    suggestedUsers: {
      type: new GraphQLList(UserType),
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { id }, context) => {
        if (context.req.isAuth) {
          const usersFollowedByMe = await User.findById(id).select("following")
          const users = await User.aggregate([
            {
              $match: {
                _id: { $ne: id },
              },
            },
            { $sample: { size: 10 } },
          ])

          // 1,2
          let filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id))
          filteredUsers = filteredUsers.filter((user) => user._id.toString() !== id)
          const suggestedUsers = filteredUsers.slice(0, 2)

          suggestedUsers.forEach((user) => {
            user.id = user._id
            user.password = null
          })

          return suggestedUsers
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get posts
    posts: {
      type: new GraphQLList(PostType),
      args: {
        id: { type: GraphQLID },
        feedType: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, { id, feedType }, context) => {
        if (context.req.isAuth) {
          switch (feedType) {
            case "forYou":
              return Post.find({ userId: id }).sort({ createdAt: -1 })
            case "following":
              let posts = []

              const following = (await User.findById(id).sort({ createdAt: -1 }).populate({
                path: 'following',
                select: 'id fullname username'
              })).following
              const ids = following.map((follow) => {
                return follow.id
              })

              const postPromises = ids.map((id) => {
                return Post.find({ userId: id }).sort({ createdAt: -1 })
              })
              posts = await Promise.all(postPromises)
              posts = posts.flat()

              return posts
            case "posts":
              return Post.find().sort({ createdAt: -1 })
            case "likes":
              const likedPosts = (await User.findById(id).sort({ createdAt: -1 }).select('likedPosts').populate('likedPosts')).likedPosts

              return likedPosts
            case "saved":
              const savedPosts = (await User.findById(id).sort({ createdAt: -1 }).select('savedPosts').populate('savedPosts')).savedPosts

              return savedPosts
            default:
              return null
          }
        } else {
          throw new Error('You are not Authenticated')
        }
      },
    },

    // Get user posts
    userPosts: {
      type: new GraphQLList(PostType),
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          return Post.find({ userId: id })
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get a post
    post: {
      type: PostType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          return Post.findById(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get likes
    likes: {
      type: new GraphQLList(UserType),
      args: {
        postId: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { postId }, context) => {
        if (context.req.isAuth) {
          const posts = await Post.findById(postId).select("likes").populate("likes")

          return posts.likes
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get comments
    comments: {
      type: new GraphQLList(CommentType),
      args: {
        postId: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { postId }, context) {
        if (context.req.isAuth) {
          return Comment.find({ postId }).sort({ createdAt: -1 })
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get a comment
    comment: {
      type: CommentType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          return Comment.findById(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get replies
    replies: {
      type: new GraphQLList(ReplyType),
      args: {
        commentId: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { commentId }, context) {
        if (context.req.isAuth) {
          return Reply.find({ commentId })
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get notifications
    notifications: {
      type: new GraphQLList(NotificationType),
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { id }, context) => {
        if (context.req.isAuth) {
          const notifications = await Notification.find({ to: id }).sort({ createdAt: -1 }).populate("from")
          await Notification.updateMany({ to: id }, { read: true })

          return notifications
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    }
  },
})

// Mutations
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {

    // Signup
    signup: {
      type: UserType,
      args: {
        fullname: { type: GraphQLNonNull(GraphQLString) },
        username: { type: GraphQLNonNull(GraphQLString) },
        email: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { fullname, username, email, password }, context) => {
        try {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new Error('Invalid email format')
          }

          let existingUser = await User.findOne({ email })
          if (existingUser) {
            throw new Error('Email is already taken')
          }

          existingUser = await User.findOne({ username })
          if (existingUser) {
            throw new Error('Username is already taken')
          }

          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long!')
          }

          const salt = await bcrypt.genSalt(10)
          const hashedPassword = await bcrypt.hash(password, salt)

          let newUser = new User({ fullname, username, email, password: hashedPassword })
          await newUser.save()

          const token = jwt.sign(
            { userId: newUser.id, email },
            'somesupersecretkey',
            { expiresIn: '1d' }
          )

          newUser.token = token

          return newUser
        } catch (err) {
          throw err;
        }
      }
    },

    // Login
    login: {
      type: UserType,
      args: {
        email: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, { email, password }, context) => {
        let user = await User.findOne({ email })
        if (!user) {
          throw new Error('User does not exist!')
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new Error('Password is incorrect!');
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          'somesupersecretkey',
          { expiresIn: '1d' }
        )

        user.token = token

        return user
      }
    },

    // Follow or Unfollow a user
    followUnfollowUser: {
      type: UserType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        toId: { type: GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, { id, toId }, context) => {
        if (context.req.isAuth) {
          const userToModify = await User.findById(toId)
          const currentUser = await User.findById(id)

          if (id === toId) {
            return null
          }
          if (!userToModify || !currentUser) return null

          const isFollowing = currentUser.following.includes(toId)

          if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(toId, { $pull: { followers: id } })
            const user = await User.findByIdAndUpdate(id, { $pull: { following: toId } })

            return user
          } else {
            // Follow the user
            await User.findByIdAndUpdate(toId, { $push: { followers: id } })
            const user = await User.findByIdAndUpdate(id, { $push: { following: toId } })

            // Send notification to the user
            const newNotification = new Notification({
              type: "follow",
              from: id,
              to: toId,
            })

            await newNotification.save()

            return user
          }
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Get a user
    userProfile: {
      type: UserType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          return User.findById(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Update a user
    updateUser: {
      type: UserType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        fullname: { type: GraphQLString },
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        currentPassword: { type: GraphQLString },
        newPassword: { type: GraphQLString },
        profileImg: { type: GraphQLString },
        coverImg: { type: GraphQLString },
        link: { type: GraphQLString },
      },
      resolve: async (parent, { id, fullname, username, email, currentPassword, newPassword, profileImg, coverImg, link }, context) => {
        if (context.req.isAuth) {
          let user = await User.findById(id)
          if (!user) throw new Error('User not found')

          if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            throw new Error("Please provide both current password and new password")
          }

          if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password)
            if (!isMatch) throw new Error("Current password is incorrect")
            if (newPassword.length < 6) {
              throw new Error("Password must be at least 6 characters long")
            }

            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
          }

          if (profileImg) {
            if (user.profileImg) {
              // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
              await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
          }

          if (coverImg) {
            if (user.coverImg) {
              await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
          }

          user.email = email || user.email
          user.fullname = fullname || user.fullname
          user.username = username || user.username
          user.link = link || user.link
          user.profileImg = profileImg || user.profileImg
          user.coverImg = coverImg || user.coverImg

          user = await user.save()

          // password should be null in response
          user.password = null

          return user
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Delete a user
    deleteUser: {
      type: UserType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth && context.req.isAdmin) {
          Post.find({ userId: id }).then((posts) => {
            posts.forEach((post) => {
              post.deleteOne()
            })
          })

          Comment.find({ userId: id }).then((comments) => {
            comments.forEach((comment) => {
              comment.deleteOne()
            })
          })

          Reply.find({ userId: id }).then((replies) => {
            replies.forEach((reply) => {
              reply.deleteOne()
            })
          })

          // Unfollow every followed user

          return User.findByIdAndRemove(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Save a post
    savePost: {
      type: GraphQLBoolean,
      args: {
        userId: { type: GraphQLNonNull(GraphQLID) },
        postId: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { userId, postId }, context) => {
        if (context.req.isAuth) {
          const user = await User.findById(userId)
          const post = await Post.findById(postId)

          if (!user || !post) return null

          const isSaved = user.savedPosts.includes(postId)

          if (isSaved) {
            // Unsave post
            await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postId } })

            return false
          } else {
            // Save post
            await User.findByIdAndUpdate(userId, { $push: { savedPosts: postId } })

            return true
          }
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Add a post
    addPost: {
      type: PostType,
      args: {
        content: { type: GraphQLNonNull(GraphQLString) },
        userId: { type: GraphQLNonNull(GraphQLID) },
        image: { type: GraphQLString }
      },
      resolve: async (parent, { content, userId, image }, context) => {
        if (context.req.isAuth) {
          let imageUrl = ''

          if (image) {
            const uploadedResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadedResponse.secure_url
          }
          
          const post = new Post({ content, userId, imageUrl })
          
          return post.save()
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Delete a post
    deletePost: {
      type: PostType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          Comment.find({ postId: id }).then((comments) => {
            comments.forEach((comment) => {
              comment.deleteOne()
            })
          })

          Reply.find({ postId: id }).then((replies) => {
            replies.forEach((reply) => {
              reply.deleteOne()
            })
          })

          return Post.findByIdAndRemove(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      },
    },

    // Update a post
    updatePost: {
      type: PostType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        content: { type: GraphQLString },
        imageUrl: { type: GraphQLString }
      },
      resolve(parent, { id, content, imageUrl }, context) {
        if (context.req.isAuth) {
          return Post.findByIdAndUpdate(
            id,
            {
              $set: { content, imageUrl },
            },
            { new: true }
          )
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Add a like
    addLike: {
      type: GraphQLString,
      args: {
        userId: { type: GraphQLNonNull(GraphQLID) },
        postId: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { userId, postId }, context) => {
        if (context.req.isAuth) {
          if (userId === postId) return null
          if (!userId || !postId) return null

          const user = await User.findById(userId)
          const toId = (await Post.findById(postId)).userId.toString()

          const isLiked = user.likedPosts.some((likedPost) => {
            return likedPost.toString() === postId
          })

          if (isLiked) {
            // Unlike the post
            await User.findByIdAndUpdate(userId, { $pull: { likedPosts: postId } })
            await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } })

            return "Unlike the post"
          } else {
            // Like the post
            await User.findByIdAndUpdate(userId, { $push: { likedPosts: postId } })
            await Post.findByIdAndUpdate(postId, { $push: { likes: userId } })

            if (userId !== toId) {
              // Send notification to the user
              const notification = new Notification({
                from: userId,
                to: toId,
                type: "like",
              })
              await notification.save()
            }

            return "Like the post"
          }
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Add a comment
    addComment: {
      type: CommentType,
      args: {
        content: { type: GraphQLNonNull(GraphQLString) },
        userId: { type: GraphQLNonNull(GraphQLID) },
        postId: { type: GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, { content, userId, postId }, context) => {
        if (context.req.isAuth) {
          const toId = (await Post.findById(postId)).userId.toString()

          const comment = new Comment({ content, userId, postId })

          const notification = new Notification({
            from: userId,
            to: toId,
            type: "comment",
          })
          await notification.save()

          return comment.save()
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Delete a comment
    deleteComment: {
      type: CommentType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, { id }, context) {
        if (context.req.isAuth) {
          Reply.find({ commentId: id }).then((replies) => {
            replies.forEach((reply) => {
              reply.deleteOne()
            })
          })

          return Comment.findByIdAndRemove(id)
        } else {
          throw new Error('You are not Authenticated')
        }
      },
    },

    // Update a comment
    updateComment: {
      type: CommentType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        content: { type: GraphQLString }
      },
      resolve(parent, { id, content }, context) {
        if (context.req.isAuth) {
          return Comment.findByIdAndUpdate(
            id,
            {
              $set: { content },
            },
            { new: true }
          )
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Add a reply
    addReply: {
      type: ReplyType,
      args: {
        content: { type: GraphQLNonNull(GraphQLString) },
        postId: { type: GraphQLNonNull(GraphQLID) },
        userId: { type: GraphQLNonNull(GraphQLID) },
        commentId: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { content, postId, userId, commentId }, context) => {
        if (context.req.isAuth) {
          let reply = new Reply({ content, postId, userId, commentId })
          reply = await reply.save()

          await Comment.findByIdAndUpdate(commentId, { $push: { replies: reply.id } })
          return reply
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Update a reply
    updateReply: {
      type: ReplyType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        content: { type: GraphQLString }
      },
      resolve(parent, { id, content }, context) {
        if (context.req.isAuth) {
          return Reply.findByIdAndUpdate(
            id,
            {
              $set: { content },
            },
            { new: true }
          )
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    },

    // Delete a reply
    deleteReply: {
      type: ReplyType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { id }, context) => {
        if (context.req.isAuth) {
          const reply = await Reply.findByIdAndRemove(id)
          await Comment.findByIdAndUpdate(reply.commentId, { $pull: { replies: id } })

          return reply
        } else {
          throw new Error('You are not Authenticated')
        }
      },
    },

    // Delete notifications
    deleteNotifications: {
      type: GraphQLBoolean,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, { id }, context) => {
        if (context.req.isAuth) {
          const { acknowledged, deletedCount } = await Notification.deleteMany({ to: id })

          if (acknowledged && deletedCount > 0) {
            return true
          } else {
            return false
          }
        } else {
          throw new Error('You are not Authenticated')
        }
      }
    }
  },
})

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation,
})
