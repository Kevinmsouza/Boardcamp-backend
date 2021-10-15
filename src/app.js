import express from 'express'
import pg from 'pg'
import cors from 'cors'

const app = express();
app.use(express.json())
app.use(cors())

const connection = new pg.Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
});

app.get('/check_status', (req, res) => {
    res.send('Online')
})

app.listen(4000)
console.log('Listening to 4000...')
