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

app.get('/api/v1/publicaciones', function(peticion, respuesta) {
  
  pool.getConnection(function(err, connection) {
    let consulta
    let modificadorConsulta = ""
    const busqueda = ( peticion.query.busqueda ) ? peticion.query.busqueda : ""
    if (busqueda != ""){
      modificadorConsulta = `
        WHERE
        titulo LIKE '%${busqueda}%' OR
        resumen LIKE '%${busqueda}%' OR
        contenido LIKE '%${busqueda}%'
      `
    }
    consulta = `
      SELECT *
      FROM publicaciones
      ${modificadorConsulta}
      ORDER BY id
    `
    connection.query(consulta, function(error, filas, campos) {
      if(filas.length > 0){
        respuesta.status(200)
        respuesta.json({data: filas})
      }
      else{
        respuesta.status(404)
        respuesta.send({errors: ["No se encuentran publicaciones con ese criterio de busqueda"]})
      }
    })
    connection.release()
  })
  
})

app.get('/api/v1/publicaciones/:id', function(peticion, respuesta) {
  
  pool.getConnection(function(err, connection) {
    const query = `SELECT * FROM publicaciones WHERE id = ${connection.escape(peticion.params.id)}`
    connection.query(query, function(error, filas, campos) {
      if(filas.length > 0){
        respuesta.status(200)
        respuesta.json({data: filas[0]})
      }
      else{
        respuesta.status(404)
        respuesta.send({errors: ["No se encuentra esa publicación"]})
      }
    })
    connection.release()
  })
  
})

app.listen(8000, function(){
  console.log("Servidor iniciado");
})
