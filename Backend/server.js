const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
// const router = express.Router();

const app = express();
const port = 3001; // or any other port you prefer

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(cors());
app.use(cors({
    origin: 'http://localhost:3000',  // Replace with your React app's URL
    credentials: true,  // Enable credentials (cookies)
}));

// MySQL connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'restaurent_sc',
});

connection.connect();


app.post('/signup', (req, res) => {
    const { name, email, password, phone } = req.body;

    // Insert user data into the 'users' table, excluding the 'data' field
    const insertQuery = 'INSERT INTO User_table (name, email, password, phone) VALUES (?, ?, ?, ?)';
    connection.query(insertQuery, [name, email, password, phone], (err, result) => {
        if (err) {
            console.error('Signup error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log('User signed up successfully');
            res.status(200).json({ message: 'User signed up successfully' });
        }
    });
});



// Define API endpoint to handle form submissions
app.post('/submit-form', (req, res) => {
    const formData = req.body;

    // Insert data into MySQL database
    const sql = 'INSERT INTO Table_Booking SET ?';

    connection.query(sql, formData, (err, result) => {
        if (err) {
            console.error('Error inserting data into MySQL:', err);
            res.status(500).send('Internal Server Error', err);
        } else {
            console.log('Data inserted successfully:', result);
            res.status(200).send('Form submitted successfully');
        }
    });
});

app.get('/get-data', (req, res) => {
    const sql = 'SELECT * FROM Table_Booking';

    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Error retrieving data from MySQL:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Data retrieved successfully:', result);
            res.status(200).json(result);
        }
    });
});


app.get('/get-Userdata', (req, res) => {
    const sql = 'SELECT * FROM User_table';

    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Error retrieving data from MySQL:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Data retrieved successfully:', result);
            res.status(200).json(result);
        }
    });
});



app.use(cookieParser());


const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.userId = decoded.userId;
        next();
    });
};

// Example protected route
app.get('/protected', verifyToken, (req, res) => {
    const userId = req.userId;

    connection.query('SELECT * FROM User_table WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];
        res.json({ user });
    });
});



// app.post('/login', (req, res) => {
//     const { name, password } = req.body;

//     // Find user in the dummy database
//     const user = users.find(u => u.name === name);
//     if (!user || user.password !== password) {
//         return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // User authenticated successfully, generate JWT
//     const token = jwt.sign({ userId: user.id, userName: user.name }, jwtSecret, { expiresIn: '1d' });

//     // Set the token as an HTTP cookie
//     res.cookie('token', token, { httpOnly: true, maxAge: 86400000 }); // Max age is set to 1 day (in milliseconds)

//     // Respond with user information and token
//     res.status(200).json({
//         message: 'Login successful',
//         user: { id: user.id, name: user.name, email: user.email },
//         token,
//     });
// });

// // Protected route
// app.get('/user', authenticateToken, (req, res) => {
//     // Access user-specific information using req.user
//     res.status(200).json({
//         message: 'User data accessed successfully',
//         user: { id: req.user.userId, name: req.user.userName },
//     });
// });

app.post('/login', (req, res) => {
    const { name, password } = req.body;

    // Fetch user from database
    connection.query('SELECT * FROM User_table WHERE name = ? AND password = ?', [name, password], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
        } else {
            const user = results[0];

            // Generate JWT token
            const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1h' });

            // Set user data in the response
            const responseData = {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    data: JSON.parse(user.data),
                    // Add other user properties as needed
                },
            };

            // Set the token in a cookie
            // res.cookie('token', token, { httpOnly: true, path: '/' });
            res.cookie('token', token, { path: '/', domain: 'localhost', secure: false });
            // console.log('Cookies set:', document.cookie);

            // Send the response with user data
            res.json(responseData);
        }
    });
});



// app.post('/verify-token', (req, res) => {
//     const { token } = req.body;
//     // console.log(token);
//     jwt.verify(token, 'your_secret_key', (err, decoded) => {
//         if (err) {
//             res.status(401).json({ error: 'Invalid token' });
//         } else {
//             // Fetch user data based on the user ID from the decoded token
//             const userId = decoded.userId;
//             console.log(userId)

//             connection.query('SELECT * FROM User_table WHERE id = ?', [userId], (err, results) => {
//                 if (err || results.length === 0) {
//                     res.status(401).json({ error: 'User not found' });
//                 } else {
//                     const user = results[0];
//                     console.log(user)
//                     res.json({ user });
//                 }
//                 // res.json(results[0]);
//                 console.log(results[0])
//             });
//         }
//     });
//     // res.json(results[0]);
// });


const getUserById = (userId) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM User_table WHERE id = ?', [userId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results[0]);
            }
        });
    });
};

// Middleware to verify the provided token
app.post('/verify-token', async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        const userId = decoded.userId;

        const user = await getUserById(userId);

        if (user) {
            // User found, return user data
            res.json(user);
        } else {
            // User not found
            res.status(401).json({ error: 'User not found' });
        }
    } catch (err) {
        // Invalid token or other errors
        res.status(401).json({ error: 'Invalid token' });
    }
});




app.post('/update-database', (req, res) => {
    const { userId, cart } = req.body;

    // Assuming 'User_table' has a column named 'data' for storing cart data
    connection.query('UPDATE User_table SET data = ? WHERE id = ?', [JSON.stringify(cart), userId], (err, result) => {
        if (err) {
            console.error('Error updating database:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ message: 'Database updated successfully' });
            // console.log(user);
        }
    });
});

// app.get('/get-user-cart', (req, res) => {
//     const userId = req.query.userId;
//     console.log(userId)

//     // Assuming 'User_table' has a column named 'data' for storing cart data
//     connection.query('SELECT data FROM User_table WHERE id = ?', [userId], (err, results) => {
//         if (err) {
//             console.error('Error retrieving user cart:', err);
//             res.status(500).json({ error: 'Internal Server Error' });
//         } else {
//             if (results.length === 0) {
//                 // User not found or no data in the 'data' field
//                 res.status(404).json({ error: 'User cart not found' });
//             } else {
//                 const userData = results[0];
//                 const userCart = JSON.parse(userData.data);

//                 res.json({ userCart });
//             }
//         }
//     });
// });






// app.use('/', protectedRoute);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
