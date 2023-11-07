import colors from "colors";
import axios from "axios";
import { generateCreateTableSQL , generateInsertTableSQL } from "./sqlscripthelper.js";
import { executeQuery } from "../server/conexion.js";
import fs from 'fs';
import { readFileJsonLineByLineFragments, unZipFile, createDirectory,saveErrorLog } from "./fileshelper.js";
import {config as configServer} from 'dotenv';
configServer();

// import cmd from 'node-command-line';


// URL base de la API de Canvas Data2
const baseUrl = 'https://api-gateway.instructure.com';

// Client ID y Client Secret 
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// Carpeta donde se guardan los archivos que se van a descargar GZ 

const downloadFolder = './downloads/';

const bachtFragments = 50000 ;

// variables de configuracion

let _ACCESS_TOKEN = null ;

let _SNAPSHOT = null;

let _LAST_UPDATE = null ;

let _TOKEN_ISSUED_AT = null;


const getFormatDate = (date = new Date() ) => {

    // Obtener los componentes de la fecha y hora
    const año = date.getFullYear();
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // Agrega ceros a la izquierda si es necesario
    const dia = date.getDate().toString().padStart(2, '0');
    const hora = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    const segundos = date.getSeconds().toString().padStart(2, '0');

    // Crear la cadena de fecha en el formato deseado
    const fechaFormateada = `${año}-${mes}-${dia} ${hora}:${minutos}:${segundos} `;

    return fechaFormateada ;
}

// Función para consultar el estado de forma recurrente

const consultState = async (endpoint, body) => {
      let status = null;
      let intentos = 0;
      // seguimos consultando hasta que el status sea completo 
      // para inciar con la descarga de los documentos
      while ( status === null || (status.status !== 'complete' && intentos <= 3) ) {
        try{
            status = await postJsonAxios(endpoint, body, await getAxiosConfig());
            console.log(`Status : ${status.status.green} , Hora de respuesta : ${getFormatDate()} `);
            if (status.status !== 'complete') {
            intentos = 0;
            // Si el estado no está completo, espera 10 segundos antes de la siguiente consulta
            await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }catch(error){
            intentos++;
            console.log("Ha ocurrido un error: "+ error.message + " - Se volverá a intentar ".bgCyan);
            saveErrorLog('Ha ocurrido un error: '+ error.message);
            if (intentos > 3){
                throw new Error(" No se pudo acceder a la información a la petición en Axios ")
            }
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      return status; 
  };

// Función para obtener un token de acceso  

const getAccessToken = async () =>{
    try {
         
        let llValido =  false ;
        
        if(_ACCESS_TOKEN != null ){
            const expiresIn = _ACCESS_TOKEN.expires_in; 

            // es el tiempo estimado de expiracion
            const expirationTime = _TOKEN_ISSUED_AT + expiresIn * 1000; 

            // Marca de tiempo actual
            const currentTime = new Date().getTime(); 

            // si se cumple , no será necesario volver a hacer la solicitud
            llValido = currentTime < expirationTime;
        }

        if( !llValido ){
            console.log("Generando Token...".yellow)
            const credentials = `${clientId}:${clientSecret}`;
            // Codifica las credenciales en Base64
            const base64Credentials = Buffer.from(credentials).toString('base64');
            const axiosConfig = {
                headers: {
                    'Authorization': `Basic ${base64Credentials}`,
                    'Content-Type' : `application/x-www-form-urlencoded`,
                }
            }
            // Agregamos los valores al body
            const body = new FormData();
            body.append("grant_type","client_credentials");

            const response = await postJsonAxios(`/ids/auth/login`,body,axiosConfig);

            console.log("Token Adquirido!".green);

            _ACCESS_TOKEN = response;
            // Se vuelve a identificar la fecha en la que se obtiene el token 
            _TOKEN_ISSUED_AT = new Date().getTime();
        }

         return _ACCESS_TOKEN.access_token

    } catch (error) {
        throw new Error('No se pudo obtener el token de acceso '+ error);
    }
}

const getJsonAxios = async (endpoint,axiosConfig) =>{
    try{
        const response = await axios.get(`${baseUrl}${endpoint}`, axiosConfig );
        return response.data;
    }catch (error) {
        throw new Error('No se pudo acceder a la data solicitada '+ error);
    }
}

const postJsonAxios = async (endpoint,body,axiosConfig) =>{
    try{
        const response = await axios.post(`${baseUrl}${endpoint}`,body ,axiosConfig);
        return response.data;
    }catch (error) {
        throw new Error('No se pudo acceder a la data solicitada '+ error);
    }
}

// Descargar los archivos que se generan desde la API 

const downloadFiles =  async (files, tableName ) =>{

    // Crea la carpeta ,si existe la elimina con todo y contenido
    createDirectory(`${downloadFolder}${tableName}`);

    const jsonFiles = [];
    // Accede a la propiedad "urls" del objeto y recorre las URLs
    for (const key in files.urls) {
        if (files.urls.hasOwnProperty(key)) {
        const url = files.urls[key].url;
        // formateamos el nombre del documento 
        const fileName =  key.slice(key.indexOf('/')+1,key.length) ;
        // TODO descargar archivos
        try {
            // desde ${url}
            console.log(`Descargando archivo...`);
            const filePath = `${downloadFolder}${tableName}/${fileName}`;

            const response = await axios.get(url, { responseType: 'stream' });
            if (response.status === 200) {
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
            console.log(`Archivo descargado y guardado en: ${filePath.green}`);
            // TODO  : descomprimir el archivo que se acaba de descargar 
            const jsonFile = await unZipFile(filePath);
            console.log(`Archivo descomprimido: ${jsonFile.green}`);
            jsonFiles.push(jsonFile);

            } else {
                console.error(`La solicitud a ${url} falló con el código de estado: ${response.status}`);
            }
        
        } catch (error) {
            console.error('Error al descargar el archivo:', error);
        }
        
        }
    }
return jsonFiles;

}

// Proceso para identificar la tabla que nos entan enviando por parámetro

const getAxiosConfig = async () => {
    return {
        headers: {
            'x-instauth': await getAccessToken()
        }
    }
}

const loadTable = async (schema, configTable ) => {
    try{
        // obtenemos el token para consumir el API, puede que el tiempo de expiracion 
        let currentDateObj = new Date();
        let numberOfMlSeconds = currentDateObj.getTime();
        let addMlSeconds = (60 * 60000) * 24; // el valor de 24 hrs antes de la petición
        let newDateObj = new Date(numberOfMlSeconds - addMlSeconds);

        // Agregamos los valores al body
        let body = {
            format :"jsonl",
        }

        // si no está activo descarga todo el histórico
        // if(!_SNAPSHOT ) {
        //     if(_LAST_UPDATE) body.since = _LAST_UPDATE ;
        // }

        // Esta función hace las peticiones necesarias cada 10 segundos , hasta que 
        // regrese el status de complete para la descarga de los documentos 

        const status = await consultState(`/dap/query/canvas/table/${configTable}/data`,body);
        
        console.log(`El id de la consulta es  : ${status.objects[0].id.green}`);

        // Consultamos las URL de los documentos generados

        const files = await postJsonAxios(`/dap/object/url`,status.objects, await getAxiosConfig());
        
        // se leen los archivos y regresamos el arreglo con los mismos

        const readFiles = await downloadFiles(files, configTable );

        // creamos la Sentencia Create de la tabla que requerimos 
        const llDrop = await executeQuery(`DROP TABLE IF EXISTS ${configTable}`);
        const lcSql =  generateCreateTableSQL(schema.schema, configTable);
        const llCreate = await executeQuery(lcSql);

        //  Una ves que los archivos se descomprimen ,  
        //  estos mismos se trabajan para que sean insertados en la base
        await insertDataJson(readFiles,configTable,schema.schema.properties );

        // Se actualiza la fecha de la ultima actualización

        await executeQuery(`UPDATE TblConfigCanvasData2 SET last_update = GETDATE() WHERE [TABLE] = '${configTable}' `);

    }catch (error) {
        throw new Error('Ocurrio un error inesperado: '+ error);
    } 
}

const insertDataJson = async (files = [], tableName, properties ) => {
    
    // se genera el query dinámicamente 
    // Solamente vamos a generar el insert con las columnas , despues de va a generar el values más adelante

    const sqlInsert = generateInsertTableSQL( tableName, properties );
    for(let x = 0;x < files.length ; x++){
        const fileName = files[x];
        try{
            console.log(`Hora de Inicio : ${getFormatDate()} ${"Insertando información...".yellow}`);
            const res = await readFileJsonLineByLineFragments(fileName,bachtFragments,sqlInsert);         
            console.log(`Hora de Fin :    ${getFormatDate()} ${res.toString().green} Registros insertados para ${tableName.green} correctamente!`);
        }catch(error){
            throw new Error(`Problemas con la inserción de datos de el archivo ${fileName}: `+ error);
          }
      }
  }
  const insertToDatabase = async (batch,sqlInsert) => {
    const query = `EXEC sp_LoadJsonData
                    @jsonArray = N'${JSON.stringify(batch)}' , 
                    @insertStatement = N'${sqlInsert}'`;
    const sqlResult = await executeQuery(query); 
    // await new Promise((resolve) => setTimeout(resolve, 5000));
  }


  const setConfig = async () =>{
    
        // En Guadalaraja son 6 horas menos quen en UTC por que se las sumamos en el formato
        const resp = await executeQuery(`SELECT 
                TRIM([TABLE]) id, 
                ISNULL([SNAPSHOT],0) snapshot,
                FORMAT(SWITCHOFFSET(LAST_UPDATE,'+06:00'), 'yyyy-MM-ddTHH:mm:ssZ') last_update,
                FORMAT(LAST_UPDATE, 'yyyy-MM-dd HH:mm:ss ') last_update_local
        FROM TblConfigCanvasData2 
        WHERE ACTIVE = 1`);

        return resp.recordset;
  }

export {
    getAccessToken,
    getJsonAxios,
    postJsonAxios,
    loadTable,
    setConfig,
    insertToDatabase
}