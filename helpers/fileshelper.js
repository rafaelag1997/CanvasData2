import fs from 'fs';
import zlib  from 'zlib';
import { promises as fsPromises } from 'fs';
import colors from "colors";

// leer archivo Json y retornar un objeto json de su valor 
const readFileJson = (route) => {

    if( !fs.existsSync( route ) ) return [] ;
        
    const info = fs.readFileSync( route , { encoding: 'utf-8' });

    // Se convierte el contenido a un Json Valido cambiando saltos de linea por comas 
    
    let json = '[' + info.replaceAll(/\n/g, ',').slice(0,info.length-1) +  ' ] ';

    // Sobreescribir el archivo con un formato de JSON válido

    fs.writeFileSync( route , json ,  { encoding: 'utf-8' } )

    return JSON.parse(json);
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

export{
    readFileJson,
    unZipFile,
    createDirectory,
    saveErrorLog
}