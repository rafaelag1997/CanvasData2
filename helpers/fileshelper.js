import fs from 'fs';
import  readline  from 'readline';
import zlib  from 'zlib';
import { promises as fsPromises } from 'fs';
import colors from "colors";

// leer archivo Json y retornar un objeto json de su valor 
// La siguiente función, trabaja de manera adecuada con archivos que no contengan gran cantidad de registros
// que superen la cantidad de caracteres permitidos por una cadena en sql server

const readFileJson = (route) => {

    if( !fs.existsSync( route ) ) return [] ;
        
    const info = fs.readFileSync( route , { encoding: 'utf-8' });

    // Se convierte el contenido a un Json Valido cambiando saltos de linea por comas 
    
    let json = `${'[' + info.replaceAll(/\n/g, ',').slice(0,info.length-1) +  ']'}`;

    // Sobreescribir el archivo con un formato de JSON válido

    fs.writeFileSync( route , json ,  { encoding: 'utf-8' } )

    return JSON.parse(json);
}

// leer archivo JSON linea por linea

const readFileJsonLineByLine = async (filePath, batchSize) => {

  const outputFolder = `${filePath}_fragments`;
  createDirectory(outputFolder);

  const readStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: readStream,
    output: process.stdout,
    terminal: false,
  });

  let recordsNumber = 0;
  let fragments = 1;
  let batch = [];
  let arrayFragments = [];

  for await (const line of rl) {

    // quitamos los separadores de linea y párrafo
    batch.push(JSON.parse(line.replace(/[\u2028\u2029]/g, ''))); 
    recordsNumber++;

    if (recordsNumber % batchSize === 0) {
      const outputFileName = `${fragments}.json`;
      const outputFilePath = `${filePath}_fragments/${outputFileName}`;
      fs.writeFileSync(outputFilePath, `${JSON.stringify(batch)}` );
      arrayFragments.push(outputFilePath);
      fragments++;
      batch = [];
    }
  }

  if (batch.length > 0) {
    const outputFileName = `${fragments}.json`;
    const outputFilePath = `${filePath}_fragments/${outputFileName}`;
    fs.writeFileSync(outputFilePath, `${JSON.stringify(batch)}` );
    arrayFragments.push(outputFilePath);

  }

  return { arrayFragments , recordsNumber  } // numero de fragmentos creados 
}



// Funcion para descomprimir el archivo 

const  unZipFile =  async (filePath) => {
    try {
      const archivoComprimido = filePath;
      const archivoDescomprimido = filePath.replace('.gz', ''); // Nombre del archivo descomprimido
  
      // Lee el archivo comprimido en memoria
      const contenidoComprimido = await fsPromises.readFile(archivoComprimido);
  
      // Descomprime el contenido
      const contenidoDescomprimido = zlib.gunzipSync(contenidoComprimido);
  
      // Escribe el contenido descomprimido en un archivo
      await fsPromises.writeFile(archivoDescomprimido, contenidoDescomprimido);
  
      return archivoDescomprimido;
    } catch (error) {
      console.error('Error al descomprimir el archivo:', error);
      throw error;
    }
  }

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


// Pruebas para formatear el archivo completo, dado caso que los archivos 
// Una cantidad menor de registros, pero que supere la cantidad de caracteres permitidos para una cadena en JS.

const  formatJsonFileLineByLine = async (inputFile,outputFile) => {

  const inputReadStream = fs.createReadStream(inputFile, 'utf-8');
  const outputWriteStream = fs.createWriteStream(outputFile, 'utf-8');
  const rl = readline.createInterface({
    input: inputReadStream,
    output: outputWriteStream,
    terminal: false,
  });

  for await (const line of rl) {
    // Realiza las modificaciones deseadas en 'line' de forma síncrona
    const lineaModificada = line.replace(/[\u2028\u2029]/g, '') + ',';
    outputWriteStream.write(lineaModificada);
  }

  // Esta promesa espera a que el archivo cierre completamente para que pueda continuar con 
  // El proceso

  await new Promise((resolve, reject) => {
    outputWriteStream.end((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  rl.close();

}


export{
    // readFileJson,
    readFileJsonLineByLine,
    formatJsonFileLineByLine,
    unZipFile,
    createDirectory,
    saveErrorLog
}

