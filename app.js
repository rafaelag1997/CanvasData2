import colors from "colors";
import { getAccessToken,getJsonAxios,postJsonAxios,loadTable} from "./helpers/axioshelper.js";
import { executeQuery } from "./server/conexion.js";


// listado de tablas que necesitamos importar
const ListTables = [
    'users',
    'courses',
    'assignment_groups',
    'assignments',
    'submissions',
    'scores'
]

// Verifica si las tablas que pretendemos exportar existen en la base
const buscaTabla  = (tablas,tabla) =>{
        if(!tablas.includes(tabla)) 
            console.log(`La tabla ${tabla.green} no se encuentra en el schema de la BD `);
    return tablas.includes(tabla);
}

// funcion principal 
const main = async () =>{
    console.time('Tiempo de ejecución'.cyan);
    try{
        // obtenemos el token para consumir el API
        const token = await getAccessToken();
        
        // Consultamos las tablas de la base e identificar cuales necesitamos
        let axiosConfig = {
            headers: {
                'x-instauth': token,
            }
        }
        // consultamos API para verificar que existan las tablas que necesitamos exportar
        const tables = await getJsonAxios('/dap/query/canvas/table',axiosConfig);

        // vamos importar la informacion de cada una de las tablas

        for(let x = 0 ; x < ListTables.length  ; x++){
          // verificamos que existan las tablas que necesitamos en el listado de tablas
            try{

                if (buscaTabla(tables.tables,ListTables[x])){
                    console.log(`Consultar Schema : ${ListTables[x].green} `);
                    // consultamos el schema de la tabla que si existe 
                    const schema = await getJsonAxios(`/dap/query/canvas/table/${ListTables[x]}/schema`,axiosConfig);

                    // Creamos la tabla e iniciamos con el proceso de inserción de datos 
                    await loadTable(schema,ListTables[x]);
                    
                }
            }catch(error){
                console.log(`Error con la tabla ${ListTables[x].green} `, error.name,":",error.message);
            }   
        }

    }catch (error) {
        console.error('Ha ocurrido un error: '+ error.message);
    }
    console.timeEnd('Tiempo de ejecución'.cyan);

}

main();