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
  res.sendFile(path.join(dirname,'public/index.html'));
});

app.post('/TTSubmit', (req, res) => {
  const {evenodd, classnm, lecpr} = req.body;
  if (lecpr === 'lec') {
    res.render(path.join(dirname, 'public/page2'), {evenodd: evenodd, classnm: classnm, lecpr: lecpr, getConnection: getConnection});
  } else {
    res.render(path.join(dirname,'public/page2pr'), {evenodd: evenodd, classnm: classnm, lecpr: lecpr});
  }
});

app.post('/page2_sub', (req, res) => {
  const { classnm, subject, time, day } = req.body;
  let sl = [];
  let freestaff = [];
  let freeclass = [];

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
  function checkClassAvailability(cl) {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM ${cl} WHERE timing = ? AND ${connection.escapeId(day)} IS NULL`, [time], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        if (rows.length === 1) {
          freeclass.push(cl);
        }
        resolve();
      });
    });
  }

  fetchStaffList()
    .then(() => {
      const staffPromises = sl.map(abr => checkAvailability(abr));
      const classPromises = ['cm1', 'cm2', 'cm3', 'cm4', 'cm5', 'cm6'].map(cl => checkClassAvailability(cl));
      return Promise.all([...staffPromises, ...classPromises]);
    })
    .then(() => {
      res.render(path.join(dirname, 'public/lec'), { freestaff: freestaff, time: time, day: day, freeclass: freeclass, classnm: classnm, subject: subject});
    })
    .catch(err => {
      console.error('Error:', err);
      res.status(500).send('An error occurred');
    });
});

app.post('/lec_submit', (req, res) => {
  const {staff, classroom_a, classroom_b, classroom_c, staff_a, staff_b, staff_c, time1, time2, time, day, classnm, subject} = req.body;
  connection.query(`update ${classroom} set ${day} = '${subject} ${classnm}'  where timing = ?`, [time], (err, rows) => {
  });
  connection.query(`update ${staff} set ${day} = '${subject} ${classnm} ${classroom}'  where timing = ?`, [time], (err, rows) => {
  });
  connection.query(`update ${classnm} set ${day} = '${subject} ${classroom} ${staff}'  where timing = ?`, [time], (err, rows) => {
  })
  res.sendFile(path.join(dirname,'public/index.html'));
});

app.post('/pr_submit', (req, res) => {
  const {classroom_a, classroom_b, classroom_c, sub_a, sub_b, sub_c, staff_a, staff_b, staff_c, time1, time2, time, day, classnm} = req.body;
  connection.query(`update ${classroom_a} set ${day} = '${sub_a} ${classnm}'  where timing = ?`, [time], (err, rows) => {
  });
  connection.query(`update ${classroom_b} set ${day} = '${sub_b} ${classnm}'  where timing = ?`, [time], (err, rows) => {
  });
  connection.query(`update ${classroom_c} set ${day} = '${sub_c} ${classnm}'  where timing = ?`, [time], (err, rows) => {
  });
  connection.query(`update ${staff_a} set ${day} = '${sub_a} ${classnm} ${classroom_a}'  where timing = ?`, [time1], (err, rows) => {
  });
  connection.query(`update ${staff_a} set ${day} = '${sub_a} ${classnm} ${classroom_a}'  where timing = ?`, [time2], (err, rows) => {
  });
  connection.query(`update ${staff_b} set ${day} = '${sub_b} ${classnm} ${classroom_b}'  where timing = ?`, [time1], (err, rows) => {
  });
  connection.query(`update ${staff_b} set ${day} = '${sub_b} ${classnm} ${classroom_b}'  where timing = ?`, [time2], (err, rows) => {
  });
  connection.query(`update ${staff_c} set ${day} = '${sub_c} ${classnm} ${classroom_c}'  where timing = ?`, [time1], (err, rows) => {
  });
  connection.query(`update ${staff_c} set ${day} = '${sub_c} ${classnm} ${classroom_c}'  where timing = ?`, [time2], (err, rows) => {
  });
  connection.query(`update ${classnm} set ${day} = '${sub_a} ${classroom_a} ${staff_a} ${sub_b} ${classroom_b} ${staff_b} ${sub_c} ${classroom_c} ${staff_c}'  where timing = ?`, [time1], (err, rows) => {
  })
  connection.query(`update ${classnm} set ${day} = '${sub_a} ${classroom_a} ${staff_a} ${sub_b} ${classroom_b} ${staff_b} ${sub_c} ${classroom_c} ${staff_c}'  where timing = ?`, [time2], (err, rows) => {
  })
  res.sendFile(path.join(dirname,'public/index.html'));
});

app.post('/page2pr_sub', (req, res) => {
  const { classnm, batch_a, batch_b, batch_c, time, day } = req.body;
  const timeRange = time.split('-'); // Split the time range
  const startTime = timeRange[0];
  const endTime = timeRange[1];
  
  // Generate time slots
  const timeSlots = generateTimeSlots(startTime, endTime);
  let sl = [];
  let freestaff = [];
  let freeclass = [];

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

  function checkAvailability(abr, time) {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM ${abr} WHERE timing = ? AND ${day} IS NULL`, [time], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        if (rows.length > 0) {
          freestaff.push(abr);
          freestaff = freestaff.filter((item, index) => freestaff.indexOf(item) === index);
        }
        resolve();
      });
    });
  }
  function checkLabAvailability(cl) {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM ${cl} WHERE timing = ? AND ${connection.escapeId(day)} IS NULL`, [time], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        if (rows.length === 1) {
          freeclass.push(cl);
        }
        resolve();
      });
    });
  }

  function generateTimeSlots(startTime, endTime) {
    const timeSlots = [];
    let currentHour = parseInt(startTime.split(':')[0]);
  
    while (currentHour < parseInt(endTime.split(':')[0])) {
      const nextHour = currentHour + 1;
      timeSlots.push(`${currentHour}:00-${nextHour}:00`);
      currentHour = nextHour;
    }
  
    return timeSlots;
  }
  

  fetchStaffList()
    .then(() => {
      const staffPromises = sl.map(abr => {timeSlots.map(time => checkAvailability(abr, time ))});
      const classPromises = ['lab1', 'lab2', 'lab3', 'lab4', 'lab5', 'lab6'].map(cl => checkLabAvailability(cl));
      return Promise.all([...staffPromises, ...classPromises]);
    })
    .then(() => {
      res.render(path.join(dirname, 'public/pr'), { freestaff: freestaff, time: time, time1: timeSlots[0], time2: timeSlots[1], day: day, freeclass: freeclass, classnm: classnm, batch_a: batch_a, batch_b: batch_b, batch_c: batch_c});
    })
    .catch(err => {
      console.error('Error:', err);
      res.status(500).send('An error occurred');
    });
    

});

app.get('/showCreateTT', (req, res) => {
  res.sendFile(path.join(dirname,'public/createTT.html'));
});

app.get('/ViewTT', (req, res) => {
  res.render(path.join(dirname, 'public/viewTimeTable' ))
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

app.post('/submit_classroom', async (req, res) => {
  const {classroom} = req.body;
  function executeQuery(query) {
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
  }

  // Async function to fetch data and populate 'data' array
  async function fetchData() {
      try {
          let results = await executeQuery(`SELECT * FROM ${classroom}`);
          let data = [];
          for (let i = 0; i < results.length; i++) {
              let row = results[i];
              data.push([row.mon || '-', row.tue || '-', row.wed || '-', row.thu || '-', row.fri || '-', row.sat || '-']);
          }
          return data;
      } catch (error) {
          console.error('Error fetching data: ' + error);
          return [];
      }
  }

  // Call async function to fetch data and wait for the result
  let data = await fetchData();
  res.render(path.join(dirname, 'public/ViewClassroomTT'), {data: data});
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
