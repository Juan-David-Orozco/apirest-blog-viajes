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

app.get('/api/v1/autores', function(peticion, respuesta) {
  
  pool.getConnection(function(err, connection) {
    const query = `SELECT email, pseudonimo FROM autores`
    connection.query(query, function(error, filas, campos) {
      if(filas.length > 0){
        respuesta.status(200)
        respuesta.json({data: filas})
      }
      else{
        respuesta.status(404)
        respuesta.send({errors: ["No se obtuvo ningun elemento"]})
      }
    })
    connection.release()
  })

})

app.get('/api/v1/autores/:id', function(peticion, respuesta) {
  
  pool.getConnection(function(err, connection) {
    const query = `
      SELECT autores.id id, email, pseudonimo, publicaciones.id publicacion_id, titulo, resumen, votos
      FROM autores
      LEFT JOIN
      publicaciones ON
      autores.id = publicaciones.autor_id
      WHERE autores.id = ${connection.escape(peticion.params.id)}
      ORDER BY autores.id DESC, publicaciones.fecha_hora DESC
    `
    connection.query(query, function(error, filas, campos) {
      autor = []
      AutorId = undefined
      filas.forEach(registro => {
        if (registro.id != AutorId){
          AutorId = registro.id
          autor.push({
            id: registro.id,
            pseudonimo: registro.pseudonimo,
            email: registro.email,
            publicaciones: []
          })
        }
        autor[0].publicaciones.push({
          id: registro.publicacion_id,
          titulo: registro.titulo,
          resumen: registro.resumen,
          votos: registro.votos
        })
      });
      if(autor.length > 0){
        respuesta.status(200)
        respuesta.json({data: autor})
      }
      else{
        respuesta.status(404)
        respuesta.send({errors: ["No se encuentra ese autor"]})
      }
    })
    connection.release()
  })
  
})

app.post('/api/v1/autores/', function(peticion, respuesta) {
  
  pool.getConnection(function(err, connection) {

    const email = peticion.body.email
    const pseudonimo = peticion.body.pseudonimo
    const contrasena = peticion.body.contrasena

    const consultaEmail = `
      SELECT * FROM autores
      WHERE email = ${connection.escape(email)}
    `
    connection.query(consultaEmail, function (error, filas, campos) {
      if (filas.length > 0) {
        respuesta.send({errors: ["Email de usuario duplicado"]})
      }
      else {
        const consultaPseudonimo = `
          SELECT * FROM autores
          WHERE pseudonimo = ${connection.escape(pseudonimo)}
        `
        connection.query(consultaPseudonimo, function (error, filas, campos) {
          if (filas.length > 0) {
            respuesta.send({errors: ["Pseudonimo de usuario duplicado"]})
          }
          else {
            const consulta = `
              INSERT INTO autores
              (email, contrasena, pseudonimo)
              VALUES (
                ${connection.escape(email)},
                ${connection.escape(contrasena)},
                ${connection.escape(pseudonimo)}
              )
            `
            connection.query(consulta, function (error, filas, campos) {
              const nuevoId = filas.insertId
              const queryConsulta = `SELECT * FROM autores WHERE id = ${connection.escape(nuevoId)}`
              connection.query(queryConsulta, function(error, filas, campos) {
                respuesta.status(201)
                respuesta.json({data: filas[0]})
              })
            })
          }
        })
      }
    })
    connection.release()

  })
  
})

app.post('/api/v1/publicaciones/', function(peticion, respuesta) {

  const email = peticion.query.email
  const contrasena = peticion.query.contrasena
  const titulo = peticion.body.titulo
  const resumen = peticion.body.resumen
  const contenido = peticion.body.contenido

  pool.getConnection((err, connection) => {
    const date = new Date()
    const fecha = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
    const consultaAccesoUsuario = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(email)} AND
      contrasena = ${connection.escape(contrasena)}
    `
    connection.query(consultaAccesoUsuario, (error, filas, campos) => {
      if (filas.length <= 0) {
        respuesta.status(404)
        respuesta.send({ errors: ["Credenciales invalidas"] })
      } else {
        let usuario = filas[0]
        const consulta = `
          INSERT INTO
          publicaciones
          (titulo, resumen, contenido, autor_id, fecha_hora)
          VALUES (
            ${connection.escape(titulo)},
            ${connection.escape(resumen)},
            ${connection.escape(contenido)},
            ${connection.escape(usuario.id)},
            ${connection.escape(fecha)}
          )
        `
        connection.query(consulta, (error, filas, campos) => {
          const nuevoId = filas.insertId
          const queryConsulta = `SELECT * FROM publicaciones WHERE id=${connection.escape(nuevoId)}`
          connection.query(queryConsulta, function(error, filas, campos) {
            respuesta.status(201)
            respuesta.json({data: filas[0]})
          })
        })
      }
    })
    connection.release()
  })

})

app.listen(8000, function(){
  console.log("Servidor iniciado");
})
