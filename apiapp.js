const express = require('express')
const app = express()
const mysql = require('mysql2')
const bodyParser = require('body-parser')

var pool = mysql.createPool({
  connectionLimit : 20,
  host      : 'localhost',
  user      : 'root',
  password  : 'juan',
  database  : 'blog_viajes'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (peticion, respuesta) => {
  respuesta.send("Bienvenido")
})

app.listen(8000, function(){
  console.log("Servidor iniciado");
})
