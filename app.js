import colors from "colors";
import { getAccessToken, getJsonAxios, loadTable , setConfig} from "./helpers/axioshelper.js";
import { createDirectory, saveErrorLog } from "./helpers/fileshelper.js";


// listado de tablas que necesitamos importar
let ListTables = [
    'users',
    'roles',
    'pseudonyms',
    'courses',
    'submissions',
    'enrollments',   
    'assignment_groups',
    'assignments',
    'scores',
]

// Verifica si las tablas que pretendemos exportar existen en la base
const buscaTabla  = (tablas,tabla) =>{
        if(!tablas.includes(tabla)) 
            console.log(`La tabla ${tabla.yellow} no se encuentra en el schema de la BD de CanvasData2 `);
    return tablas.includes(tabla);
}

// funcion principal 
const main = async () =>{
    console.clear();
    console.time('Tiempo de ejecución'.cyan);
    console.log('----------------------------------------'.green);
    console.log('   Canvas Data 2 - descarga de datos '.cyan);
    console.log('----------------------------------------'.green);

    let llError = false;
    createDirectory("./downloads/")

    try{        
       //  const ListTables =  await setConfig();
       // Consultamos las tablas de la base e identificar cuales necesitamos
        let axiosConfig = {
            headers: {
                'x-instauth': await getAccessToken(),
            }
        }
        // consultamos API para verificar que existan las tablas que necesitamos exportar
        const tables = await getJsonAxios('/dap/query/canvas/table',axiosConfig);

        // vamos importar la informacion de cada una de las tablas

        for(let x = 0 ; x < ListTables.length  ; x++){
          // verificamos que existan las tablas que necesitamos en el listado de tablas
            try{
                // Consultamos las tablas de la base e identificar cuales necesitamos
                let axiosConfig = {
                    headers: {
                        'x-instauth': await getAccessToken(),
                    }
                }
                if (buscaTabla(tables.tables,ListTables[x])){
                    console.log(`${"----------------------------------".cyan}`);
                    console.log(`Consultar Schema : ${ListTables[x].green} `);
                    // consultamos el schema de la tabla que si existe 
                    const schema = await getJsonAxios(`/dap/query/canvas/table/${ListTables[x]}/schema`,axiosConfig);

                    // Creamos la tabla e iniciamos con el proceso de inserción de datos 
                    await loadTable(schema, ListTables[x] ); 
                }
            }catch(error){
                console.log(`Error con la tabla ${ListTables[x].green} `, error.name,":",error.message);
                // Guardar los errores en error .log
                const errorMsg = `Error con la tabla ${ListTables[x]} -- ${error.name} : ${error.message} `;
                saveErrorLog(errorMsg);
                llError = true;
            }   
        }

        // Actualizar la ultima fecha de actualización 
        // if(!llError) await executeQuery(`UPDATE TblConfigCanvasData2 SET last_update = GETDATE()`);

    }catch (error) {
        console.error('Ha ocurrido un error: '+ error.message);
        saveErrorLog('Ha ocurrido un error: '+ error.message);
        process.exit(1);
    }
    console.timeEnd('Tiempo de ejecución'.cyan);
    process.exit(1);

}

main();