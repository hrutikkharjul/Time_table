import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import mysql from 'mysql'

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);
const app = express();
const port = 3000;
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'time_table'
});

app.set('views', path.join(dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(dirname,'public\\index.html'));
});

app.post('/TTSubmit', (req, res) => {
  const {evenodd, classnm, lecpr} = req.body;
  res.render(path.join(dirname, 'public\\page2'), {evenodd: evenodd, classnm: classnm, lecpr: lecpr, getConnection: getConnection});
});

app.post('/page2_sub', (req, res) => {
  const { subject, time, day } = req.body;
  let sl = [];
  let freestaff = [];

  // Function to fetch staff list
  function fetchStaffList() {
    return new Promise((resolve, reject) => {
      connection.query('SELECT * FROM staff_list', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        sl = rows.map(row => row.abr);
        resolve();
      });
    });
  }

  // Function to check availability for each staff member
  function checkAvailability(abr) {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM ${abr} WHERE timing = ? AND ${day} IS NULL`, [time], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        if (rows.length > 0) {
          freestaff.push(abr);
        }
        resolve();
      });
    });
  }

  // Fetch staff list and then check availability for each staff member
  fetchStaffList()
    .then(() => {
      const promises = sl.map(abr => checkAvailability(abr));
      return Promise.all(promises);
    })
    .then(() => {
      // All availability checks completed
      res.render(path.join(dirname, 'public\\lec'), { freestaff: freestaff });
    })
    .catch(err => {
      console.error('Error:', err);
      res.status(500).send('An error occurred');
    });
});


app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});


function getConnection() {
  return connection;
}


// Connect to the database
// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to database:', err);
//     return;
//   }
//   console.log('Connected to database');
// });

// Perform database operations
// Example: Select data from a table
// connection.query('SELECT * FROM paa', (err, rows) => {
//   if (err) {
//     console.error('Error querying database:', err);
//     return;
//   }
//   console.log('Data from the table:', rows);
// });

// // Close the connection
// connection.end((err) => {
//   if (err) {
//     console.error('Error closing database connection:', err);
//     return;
//   }
//   console.log('Connection closed');
// });
