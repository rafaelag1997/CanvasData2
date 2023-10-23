// Configuración de la conexión con autenticación de usuario 
// importa las variables de entorno 

import { config as configServer} from "dotenv";
configServer();


// const config = {
//   server: 'localhost',
//   user: 'canvasdata',
//   password: 'canvasdata',
//   database: 'dbCanvasData',
//   options: {
//     encrypt: true, // Habilita la encriptación y validación del certificado
//     trustServerCertificate: true,
//     connectTimeout: 30000, // Aumenta el tiempo de conexión a 30 segundos
//   },
//   requestTimeout: 1200000 // Aumentar el tiempo límite a 120 segundos
// };


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

const config = {
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT),
  user: process.env.SQLSERVER_USER, // Usuario con permisos 
  password: process.env.SQLSERVER_PASSWORD,
  database: process.env.SQLSERVER_DB,
  options: {
    encrypt: true, // Habilita la encriptación y validación del certificado
    trustServerCertificate: true, // Opcional, para conexiones seguras
    connectTimeout: 30000, // Aumenta el tiempo de conexión a 30 segundos
  },
  requestTimeout: 1200000 // Aumentar el tiempo límite a 120 segundos
};

export {config} ;