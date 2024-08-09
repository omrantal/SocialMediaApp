module.exports = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      //console.log(req.user)
      //console.log(role)
      
      throw new Error('Not allowed' )
    }
  
    next()
  }
};
