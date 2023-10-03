// Configuración de la conexión con autenticación de usuario local
const config = {
    user: 'canvasdata',
    password: 'canvasdata',
    server: 'localhost', 
    database: 'dbCanvasData',
    options: { 
      trustServerCertificate: true,
      connectTimeout: 30000, // Aumenta el tiempo de conexión a 30 segundos
      },
    requestTimeout: 1200000 // Aumentar el tiempo límite a 120 segundos
    };

export {config} ;