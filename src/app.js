import express from 'express'
import pg from 'pg'
import cors from 'cors'
import joi from 'joi'
import dayjs from 'dayjs'

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
        const result = await connection.query('SELECT * FROM categories ORDER BY id ASC;')
        res.send(result.rows)
    } catch (error) {
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
    if (hasError) {
        return res.sendStatus(400)
    }
    try {
        const checkName = await connection.query('SELECT * FROM categories WHERE name = $1', [req.body.name])
        if (checkName.rows.length) {
            return res.sendStatus(409)
        }
        await connection.query('INSERT INTO categories (name) VALUES ($1)', [req.body.name])
        res.sendStatus(201)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.get('/games', async (req, res) => {
    const queryString = req.query.name ? req.query.name + "%" : "%";
    try {
        const result = await connection.query(`
            SELECT 
                games.*,
                categories.name AS "categoryName"
            FROM games
                JOIN categories 
                    ON games."categoryId" = categories.id
            WHERE games.name iLIKE $1;
        `, [queryString])
        res.send(result.rows)
    } catch (error) {
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
    if (hasError) {
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
        const checkName = await connection.query('SELECT * FROM games WHERE name = $1', [name])
        if (checkName.rows.length) {
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
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.get('/customers', async (req, res) => {
    const queryString = req.query.cpf ? req.query.cpf + "%" : "%";
    try {
        const result = await connection.query(`
            SELECT customers.*
            FROM customers
            WHERE customers.cpf iLIKE $1
            ORDER BY customers.id ASC;
        `, [queryString])
        res.send(result.rows.map(customer => {
            return {
                ...customer,
                birthday: dayjs(customer.birthday).format('YYYY-MM-DD')
            }
        }))
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.get('/customers/:id', async (req, res) => {
    const { id } = req.params
    if (joi.number().integer().greater(0).required().validate(id).error) {
        res.sendStatus(400)
    }
    try {
        const result = await connection.query(`
            SELECT customers.*
            FROM customers
            WHERE customers.id = $1;
        `, [id])
        if (result.rows.length) {
            return res.send({
                ...result.rows[0],
                birthday: dayjs(result.rows[0].birthday).format('YYYY-MM-DD')
            })
        }
        res.sendStatus(404)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/customers', async (req, res) => {
    const customerSchema = joi.object({
        name: joi.string()
            .required(),
        phone: joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .required(),
        cpf: joi.string()
            .pattern(/^[0-9]{11}$/)
            .required(),
        birthday: joi.date()
            .less('now')
            .required()
    })
    const hasError = customerSchema.validate(req.body).error
    if (hasError) {
        return res.sendStatus(400)
    }
    const {
        name,
        phone,
        cpf,
        birthday
    } = req.body;
    try {
        const checkCpf = await connection.query('SELECT * FROM customers WHERE cpf = $1', [cpf])
        if (checkCpf.rows.length) {
            return res.sendStatus(409)
        }
        await connection.query(`INSERT INTO customers (
                name,
                phone,
                cpf,
                birthday
            ) VALUES ($1, $2, $3, $4);`,
            [name, phone, cpf, birthday]
        )
        res.sendStatus(201)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.put('/customers/:id', async (req, res) => {
    const { id } = req.params;
    if (joi.number().integer().greater(0).required().validate(id).error) {
        res.sendStatus(400)
    }
    const customerSchema = joi.object({
        name: joi.string()
            .required(),
        phone: joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .required(),
        cpf: joi.string()
            .pattern(/^[0-9]{11}$/)
            .required(),
        birthday: joi.date()
            .less('now')
            .required()
    })
    const hasError = customerSchema.validate(req.body).error
    if (hasError) {
        return res.sendStatus(400)
    }
    const {
        name,
        phone,
        cpf,
        birthday
    } = req.body;
    try {
        const checkId = await connection.query('SELECT * FROM customers WHERE id = $1', [id])
        if (!checkId.rows.length) {
            return res.sendStatus(404)
        }
        const checkCpf = await connection.query('SELECT * FROM customers WHERE id != $1 AND cpf = $2', [id, cpf])
        if (checkCpf.rows.length) {
            return res.sendStatus(409)
        }
        await connection.query(`UPDATE customers 
            SET 
            name = $2,
            phone = $3,
            cpf = $4,
            birthday = $5
        WHERE id = $1;`,
            [id, name, phone, cpf, birthday]
        )
        res.sendStatus(200)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.listen(4000)
console.log('Listening to 4000...')
