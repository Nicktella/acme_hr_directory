//Lines 2-4 are going to be our database URL that is connecting to our javascript file from the .env (enviroment)
require("dotenv").config();
const pg = require("pg"); //3.)
const client = new pg.Client(process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`);
//1.) Our packages we rely on in our app #'s: 1-3.
const express = require("express");
const app = express();
//2.) 
app.use(express.json());
app.use(require("morgan")("dev"));

//READ employees (GET /api/employees - returns array of employees)
app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `SELECT * from employees`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

//READ departments (GET /api/departments - returns an array of departments)
app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `SELECT * from departments`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

//CREATE employee (POST /api/employees - payload: the employee to create, returns the created employee)
app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = /* sql */ `
        INSERT INTO employees (name, department_id)
        VALUES($1, $2)
        RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id,
        ]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

//DELETE employee (DELETE /api/employees/:id - the id of the employee to delete is passed in the URL, returns nothing)
app.delete("/api/employees/:id", async (req, res, next) => {
    try {
        const SQL = `DELETE from employees WHERE id = $1`;
        await client.query(SQL, [req.params.id])
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

//UPDATE employee (PUT /api/employees/:id - payload: the updated employee returns the updated employee)
app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = /* sql */ `
        UPDATE employees 
        SET name=$1, department_id=$2, updated_at=now()
        WHERE id=$3
        RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id,
            req.params.id,
        ]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

//Creation of a Table
const init = async () => {
    await client.connect();

    let SQL = /* sql */ `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    
    CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
    );

    CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now (),
    updated_at TIMESTAMP DEFAULT now(),
    name VARCHAR(225) NOT NULL,
    department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    `;
    //tables seeded statement in your terminal to let you know your table is created
    await client.query(SQL);
    console.log("tables created");

    SQL = /* sql */ `
    INSERT INTO departments(name) VALUES('Human Resources');
    INSERT INTO departments(name) VALUES('Information Technology');
    INSERT INTO departments(name) VALUES('Marketing');

    INSERT INTO employees(name, department_id) VALUES('John Doe',
    (SELECT id FROM departments WHERE name='Human Resources'));

    INSERT INTO employees(name, department_id) VALUES('Jane Smith',
    (SELECT id FROM departments WHERE name='Information Technology'));
    
    INSERT INTO employees(name, department_id) VALUES('Bob Johnson',
    (SELECT id FROM departments WHERE name='Marketing'));
    `;

    //Awaiting SQL query and showing that the data is seeded along with listening on 3000 in your terminal
    await client.query(SQL);
    console.log("data seeded");

    //Listening to the port in the .env file 
    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`listening on ${port}`);
    });
};

//add an error handling route which returns an object with an error property.
app.use((error, req, res, next) => {
    res.status(res.status || 500).send({ error: error });
});

init();
