const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")
const fs = require('fs')
const morgan = require('morgan')
const PORT = 3000
const path = require('path')
const schedule = require('node-schedule');
const { generateToken, authenticateToken, CHECK } = require('./middlewares/auth')

let accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(morgan('combined', { stream: accessLog }))

app.get('/', (req, res) => {
  res.sendStatus(200)
})

app.post('/users/new', (req, res) => {
  let rawData = fs.readFileSync('./users.json')
  let usersData = JSON.parse(rawData);
  let users = usersData.data;

  const { username, age } = req.body
  if (!username || !age) {
    return res.sendStatus(400)
  }
  const found = users.find(x => x.username === username)
  if (!found) {
    let newUser = { id: uuidv4(), ...req.body }
    users.push(newUser)

    let data = JSON.stringify({ data: users })
    fs.writeFileSync('users.json', data)

    return res.sendStatus(200)
  }
  res.send('User already exists.')

})

app.get('/users/get', authenticateToken, (req, res) => {
  res.json(require('./users.json'))
})

app.get('/secret', CHECK, (req, res) => {
  res.send('This route is secret! If you access here, you are allowed to see this message.')
})

app.post('/login', (req, res) => {
  const { username } = req.body
  if (!username) {
    return res.sendStatus(400)
  }

  let rawData = fs.readFileSync('./users.json')
  let usersData = JSON.parse(rawData);
  let users = usersData.data;

  const found = users.find(x => x.username === username)
  if (!found) {
    return res.send('No user was found.')
  }
  const token = generateToken({ username })
  res.json({
    token
  })
})

const saveUsersEveryday = schedule.scheduleJob('0 0 3 * * *', function () {
  fs.copyFile('./users.json', `./backups/users-${new Date().toISOString()}.json`, (err) => {
    if (err) throw err;
    console.log("Backup: users.json was copied to backups.")
  })
});

app.listen(PORT, () => {
  console.log("Server launched on http://localhost:" + PORT)
})