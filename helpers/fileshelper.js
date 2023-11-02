import fs from 'fs';
import  readline  from 'readline';
import zlib  from 'zlib';
import { pipeline } from 'stream/promises';
import colors from "colors";
import { insertToDatabase} from './axioshelper.js'

// leer archivo JSON linea por linea y crear fragmentos Json para leerlos desde la base de datos

const readFileJsonLineByLineFragments = async (filePath, batchSize, sqlInsert) => {

  const readStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: readStream,
    output: process.stdout,
    terminal: false,
  });

  let recordsNumber = 0; // numero de registros de todo el documento
  let batch = [];

  for await (const line of rl) {
    recordsNumber++;
    let jsonRaw = JSON.parse(line.replace(/[\u2028\u2029]/g, '').replace(/'/g, "''"));
    batch.push(jsonRaw);
    if (batch.length >= batchSize) {
      // Insertar lote (batch) de registros
      await insertToDatabase(batch,sqlInsert);
      batch = [];
      // Liberar la memoria del lote anterior
      batch.length = 0;
    }
  }
  // Insertar los registros restantes
  if (batch.length > 0) {
    await insertToDatabase(batch,sqlInsert);
    batch = [];
    batch.length = 0;

  }

  // Cerrar el archivo después de procesar
  readStream.close();
  return recordsNumber;

}

// Funcion para descomprimir el archivo 

const unZipFile = async (filePath) => {
  try {
      const archivoComprimido = filePath;
      const archivoDescomprimido = filePath.replace('.gz', ''); // Nombre del archivo descomprimido

      const readStream = fs.createReadStream(archivoComprimido);
      const writeStream = fs.createWriteStream(archivoDescomprimido);

      const gunzip = zlib.createGunzip();

      await pipeline(readStream, gunzip, writeStream);

      // Eliminamos el archivo gz
      await fs.promises.unlink(filePath);

      return archivoDescomprimido;
  } catch (error) {
      console.error('Error al descomprimir el archivo:', error);
      throw error;
  }
};

   const createDirectory = (ruta) =>{
    try {
      // Verificar si la carpeta ya existe
      // Si es un directorio, eliminarlo con todo su contenido
      if (fs.existsSync(ruta)) {
            fs.rmSync(ruta, { recursive: true });
      }
      // Crear la carpeta
      fs.mkdirSync(ruta);
      console.log(`Carpeta ${ruta} creada correctamente.`);

    } catch (error) {
      // La carpeta no existe o hubo un error al verificarla, lo ignoramos
      console.log("Error al crear la carpeta ",error.message);
      throw error ;
    }
  }
  
// Capturador de errores

const saveErrorLog = (msg) =>{
  try{
 // ruta de el archivo de errores 
    const filePath = './error.log';
    let errorLog = '';
    if( fs.existsSync(filePath)){
      // si existe , leemos el contenido
       errorLog = fs.readFileSync( filePath , { encoding: 'utf-8' });
    }
    const fechaActual = new Date();
    const opciones = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
    const fechaFormateada = fechaActual.toLocaleString('es-MX', opciones);
   
    const writeMsg = fechaFormateada + '\t' + msg  + '\n' + errorLog ;
    // Sobreescribir el archivo con un formato de JSON válido
    fs.writeFileSync( filePath , writeMsg ,  { encoding: 'utf-8' } )
  }catch(error){
    console.log(error.message)
  }
   
}

export{
    readFileJsonLineByLineFragments,
    unZipFile,
    createDirectory,
    saveErrorLog
}

