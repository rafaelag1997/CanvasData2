// Configuración de la conexión con autenticación de usuario local

const config = {
  server: 'localhost',
  user: 'canvasdata',
  password: 'canvasdata',
  database: 'dbCanvasData',
  options: {
    encrypt: true, // Habilita la encriptación y validación del certificado
    trustServerCertificate: true,
    connectTimeout: 30000, // Aumenta el tiempo de conexión a 30 segundos
  },
  requestTimeout: 1200000 // Aumentar el tiempo límite a 120 segundos
};


// const config = {
//   server: 'tstbdw04.uag.mx',
//   port: 51500,
//   domain:'UAG', // este campo es opcional
//   user: 'TU_USUARIO',
//   password: 'TU_CONTRASEÑA',
//   database: 'bdCanvasData',
//   options: {
//     encrypt: true, // Habilita la encriptación y validación del certificado
//     trustServerCertificate: true,
//     connectTimeout: 30000, // Aumenta el tiempo de conexión a 30 segundos
//   },
//   requestTimeout: 1200000 // Aumentar el tiempo límite a 120 segundos
// };

// Usuario de la Base de datos.

// const config = {
//   server: 'tstbdw04.uag.mx',
//   port: 51500,
//   user: 'usrCanvas', // Usuario con permisos 
//   password: 'C4nv45T35t!',
//   database: 'bdCanvasData',
//   options: {
//     encrypt: true, // Habilita la encriptación y validación del certificado
//     trustServerCertificate: true, // Opcional, para conexiones seguras
//     connectTimeout: 30000, // Aumenta el tiempo de conexión a 30 segundos
//   },
//   requestTimeout: 1200000 // Aumentar el tiempo límite a 120 segundos
// };


export {config} ;