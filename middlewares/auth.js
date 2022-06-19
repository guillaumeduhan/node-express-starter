require('dotenv').config()
const KEY = process.env.API_KEY
const jwt = require('jsonwebtoken')

const CHECK = (req, res, next) => {
  const { API_KEY } = req.body
  if (!API_KEY || API_KEY !== KEY) {
    res.send(400)
  }
  next()
}

const generateToken = (username) => {
  return jwt.sign(username, process.env.SECRET, { expiresIn: '1800s' })
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token || !token === null) return res.send('You have no available token.')

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    console.log(user)
    next()
  })
}

module.exports = {
  authenticateToken,
  generateToken,
  CHECK
}