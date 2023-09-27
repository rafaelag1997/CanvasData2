
import sql from 'mssql';
import {config} from './config.js';

const executeQuery = async (query) => {

  try {
    // Crear un pool de conexiones
    const pool = await sql.connect(config);

    // Realizar consultas aquí
     const resultado = await pool.request().query(query);

    // Cerrar la conexión
    await sql.close();

    return resultado;

  } catch (error) {
    console.error('Error al conectar con SQL Server:', error.message);
    throw error;
  }
}

export {
  executeQuery
}

