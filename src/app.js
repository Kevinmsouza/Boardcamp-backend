import express from 'express'
import pg from 'pg'
import cors from 'cors'
import joi from 'joi'

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

app.get('/categories', async (req, res) => {
    try {
        const result = await connection.query('SELECT * FROM categories')
        res.send(result.rows)
    } catch (error){
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/categories', async (req, res) => {
    const categorySchema = joi.object({
        name: joi.string()
            .max(30)
            .required(),
    })
    const hasError = categorySchema.validate(req.body).error
    if(hasError){
        return res.sendStatus(400)
    }

    try {
        const checkName= await connection.query('SELECT * FROM categories WHERE name = $1', [req.body.name])
        if(checkName.rows.length){
            return res.sendStatus(409)
        }
        await connection.query('INSERT INTO categories (name) VALUES ($1)', [req.body.name])
        res.sendStatus(201)

    }catch (error){
        console.log(error)
        res.sendStatus(500)
    }
})

app.get('/games', async (req, res) => {
    const queryString = req.query.name ? req.query.name+"%" : "%";
    console.log(queryString)
    try {
        const result = await connection.query(`
            SELECT 
                games.*,
                categories.name AS "categoryName"
            FROM games
                JOIN categories 
                    ON games."categoryId" = categories.id
            WHERE games.name iLIKE '${queryString}';
        `)
        res.send(result.rows)
    } catch (error){
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/games', async (req, res) => {
    const gameSchema = joi.object({
        name: joi.string()
            .max(50)
            .required(),
        image: joi.string()
            .pattern(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg)/)
            .required(),
        stockTotal: joi.number()
            .integer()
            .greater(0)
            .required(),
        categoryId: joi.number()
            .integer()
            .greater(0)
            .required(),
        pricePerDay: joi.number()
            .integer()
            .greater(0)
            .required(),
    })
    const hasError = gameSchema.validate(req.body).error
    if(hasError){
        return res.sendStatus(400)
    }

    const {
        name,
        image,
        stockTotal,
        categoryId,
        pricePerDay
    } = req.body;

    try {
        const checkName= await connection.query('SELECT * FROM games WHERE name = $1', [name])
        if(checkName.rows.length){
            return res.sendStatus(409)
        }
        await connection.query(`INSERT INTO games (
                name,
                image,
                "stockTotal",
                "categoryId",
                "pricePerDay"
            ) VALUES ($1, $2, $3, $4, $5);`,
            [name, image, stockTotal, categoryId, pricePerDay]
        )
        res.sendStatus(201)

    }catch (error){
        console.log(error)
        res.sendStatus(500)
    }
})

app.listen(4000)
console.log('Listening to 4000...')
