const express = require('express');
const cors = require('cors');
const db = require('../config/config'); // Asegúrate de que la ruta sea correcta
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173'], // Asegúrate de ajustar esto según el dominio de tu frontend
  credentials: true // Permitir cookies
}));
app.use(cookieParser());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // En producción esto debería estar en true si estás usando HTTPS
    httpOnly: true,
    maxAge: 86400000 // Ejemplo: expira en 1 día
  }
}));

app.get('/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ isLoggedIn: true, username: req.session.username });
    } else {
        res.json({ isLoggedIn: false });
    }
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  const sql = `SELECT * FROM usuarios WHERE User_Name = ?`;
  db.query(sql, [username], (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      return res.status(401).send('Usuario o contraseña incorrectos');
    }

    const user = result[0];
    if (password === user.Password) {
      // Configura la sesión del usuario
      req.session.userId = user.ID_Usu;
      req.session.username = username;
      res.json({ message: 'Login successful', user: { id: user.ID_Usu, username } });
    } else {
      res.status(401).send('Usuario o contraseña incorrectos');
    }
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          // Manejar el error si la sesión no se puede destruir
          console.error('Failed to destroy session:', err);
          res.status(500).send('Could not log out');
      } else {
          // Si no hay error, la sesión se destruye correctamente
          res.clearCookie('connect.sid'); // Asegúrate de que el nombre de la cookie coincide con tu configuración
          res.send({ isLoggedIn: false });
      }
  });
});

module.exports = app;