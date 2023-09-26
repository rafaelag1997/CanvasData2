import colors from "colors";
import axios from "axios";
import { generateCreateTableSQL , generateInsertTableSQL } from "./sqlscripthelper.js";
import { executeQuery } from "../server/conexion.js";
import fs from 'fs';
import { leerFileJson, unZipFile } from "./fileshelper.js";
// import cmd from 'node-command-line';


// URL base de la API de Canvas Data2
const baseUrl = 'https://api-gateway.instructure.com';
// Client ID y Client Secret 
const clientId = 'us-east-1#af49ca6b-7ce8-4bb2-ac36-3a72d119518c';
const clientSecret = 'KS6yta-jnOlt18yP1XLwRPtD0a-hSbFNzeJhffPIaTU';

// Carpeta donde se guardan los archivos que se van a descargar GZ 
// const downloadFolder = './downloads';
const downloadFolder = 'C:/JsonData/';

const getFormatDate = (date = new Date() ) => {

    // Obtener los componentes de la fecha y hora
    const año = date.getFullYear();
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // Agrega ceros a la izquierda si es necesario
    const dia = date.getDate().toString().padStart(2, '0');
    const hora = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    const segundos = date.getSeconds().toString().padStart(2, '0');

    // Crear la cadena de fecha en el formato deseado
    const fechaFormateada = `${año}-${mes}-${dia}T${hora}:${minutos}:${segundos}Z`;

    return fechaFormateada ;
}

// Función para consultar el estado de forma recurrente

const consultState = async (endpoint, body, axiosConfig) => {
    try {
      let status = null;
      // seguimos consultando hasta que el status sea completo 
      // para inciar con la descarga de los documentos
      while (status === null || status.status !== 'complete') {
        status = await postJsonAxios(endpoint, body, axiosConfig);
        console.log(status.status + '...');
        if (status.status !== 'complete') {
          // Si el estado no está completo, espera 10 segundos antes de la siguiente consulta
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      return status; 
    }catch (error) {
      throw new Error('Error en la consulta de estado: ' + error);
    }
  };

// Función para obtener un token de acceso
const getAccessToken = async () =>{
    try {

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

        console.log("Token Adquirido!".green)

        return response.access_token;
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
        const response = await axios.post(`${baseUrl}${endpoint}`,body, axiosConfig );
        return response.data;
    }catch (error) {
        throw new Error('No se pudo acceder a la data solicitada '+ error);
    }
}

// Descargar los archivos que se generan desde la API 

const downloadFiles =  async (files) =>{
    const jsonFiles = [];
    // Accede a la propiedad "urls" del objeto y recorre las URLs
    for (const key in files.urls) {
        if (files.urls.hasOwnProperty(key)) {
            
        const url = files.urls[key].url;
        // formateamos el nombre del documento 
        const fileName =  key.slice(key.indexOf('/')+1,key.length) ;
        // TODO descargar archivos
        try {
            console.log(`Descargando archivo desde ${url}`);
            const filePath = `${downloadFolder}/${fileName}`;
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

const loadTable = async (schema, table) => {
    try{
        // creamos la Sentencia Create de la tabla que requerimos 
        const llDrop = await executeQuery(`DROP TABLE IF EXISTS ${table}`);
        const lcSql =  generateCreateTableSQL(schema.schema, table);
        const llCreate = await executeQuery(lcSql);

        // Una vez creada la tabla se tiene que empezar a consultar el proceso para extraer los 
        // archivos que genera la API

        // obtenemos el token para consumir el API, puede que el tiempo de expiracion 
        // caduque, por eso mismo se vuelve a generar por cada tabla que se requiera
        // generar los archivos

        const token = await getAccessToken();
        
        // Consultamos las tablas de la base e identificar cuales necesitamos
        let axiosConfig = {
            headers: {
                'x-instauth': token
            }
        }

        let currentDateObj = new Date();
        let numberOfMlSeconds = currentDateObj.getTime();
        let addMlSeconds = (60 * 60000) * 10; // el valor de 10 hrs 
        let newDateObj = new Date(numberOfMlSeconds - addMlSeconds);

        // Agregamos los valores al body
        let body = {
            format :"jsonl",
            since : getFormatDate(newDateObj)
        }

        // Esta función hace las peticiones necesarias cada 10 segundos , hasta que 
        // regrese el status de completo para la descarga de los documentos 

        const status = await consultState(`/dap/query/canvas/table/${table}/data`,body,axiosConfig);
        
        console.log(`El id de la consulta es  : ${status.objects[0].id.green}`);

        // Consultamos las URL de los documentos generados

        const files = await postJsonAxios(`/dap/object/url`,status.objects,axiosConfig);
        
        // se leen los archivos y regresamos el arreglo con los mismos

        const readFiles = await downloadFiles(files);
        
        //  Una ves que los archivos se descomprimen ,  
        //  estos mismos se trabajan para que sean insertados en la base
        await insertDataJson(readFiles,table);


    }catch (error) {
        throw new Error('Ocurrio un error inesperado: '+ error);
    } 
}

const insertDataJson = async (files = [],tableName) => {
    try{
      for(let x = 0;x < files.length ; x++){
          const jsonData = leerFileJson(files[x]);
          const sqlInsert = generateInsertTableSQL(jsonData,tableName);

          for (let value of sqlInsert){
            // const llInsert = await executeQuery(value);
            // console.log(llInsert);
            // console.log(value);
          }
          console.log(`Datos insertados para ${tableName.green} correctamente!`);
          return new Promise((resolve) => {}); ;
      }
    }catch(error){
      throw new Error('Ocurrio un error inesperado: '+ error);
    }
  
  }

export {
    getAccessToken,
    getJsonAxios,
    postJsonAxios,
    loadTable
}