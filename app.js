

// import the express library
const express = require('express');
// import the pool cls from the node-postgres library 
const { Pool } = require('pg');
// import and configure the dotenv library to load environment variables
require('dotenv').config();



// create an express applications
const app = express();
// define the port number on which the server will run
const port = 5001;

// middleware to parse JSON bodies of incoming requests
app.use(express.json());

// postgreSQL pool setup
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// test database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.stack);
        }
        console.log('Connected to PostgreSQL at:', result.rows[0].now);
    });
});

// define a route to handle the root URL('/')
app.get('/', (req, res) => {
    res.send('Welcome to the RFID Database Application');
});

// Users CRUD operations

// crate a new user
app.post('/users', async (req, res) => {
    const { name, age, rank, address, rfid_number } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (name, age, rank, address, rfid_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, age, rank, address, rfid_number]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// get all users
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Weapons CRUD operations

// create a new weapon
app.post('/weapons', async (req, res) => {
    const { user_id, weapon_rfid } = req.body;
    
    // validate that weapon_rfid is provided
    if (!weapon_rfid) {
        return res.status(400).json({ error: 'weapon_rfid is required' });
    }
    
    try {
        //   check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        if (userResult.rowCount === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

    //   insert weapon
        const result = await pool.query(
            'INSERT INTO weapons (user_id, weapon_rfid) VALUES ($1, $2) RETURNING *',
            [user_id, weapon_rfid]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// get all weapons
app.get('/weapons', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM weapons');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Access Log CRUD oprations

// create a new access log entry
app.post('/access_log', async (req, res) => {
    const { user_id, action } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO access_log (user_id, action) VALUES ($1, $2) RETURNING *',
            [user_id, action]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// get all access_log entries
app.get('/access_log', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM access_log');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

