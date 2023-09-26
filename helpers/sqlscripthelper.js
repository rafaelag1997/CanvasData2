
// Palabras reservadas de SQL server en caso de que aparezcan como nombre de una columna quitarlas

const ReservadasSQLServer = [
  "ADD","PROCEDURE","ALL","FETCH","ALTER","FILE","RAISERROR","FILLFACTOR","READ", "WRITETEXT",
  "ANY","FOR","READTEXT","AS","FOREIGN","RECONFIGURE","ASC","FREETEXT","REFERENCES", "EXIT",
  "AUTHORIZATION","FREETEXTTABLE","REPLICACIÓN","BACKUP","FROM","RESTORE","BEGIN","PROC",
  "FULL","RESTRICT","BETWEEN","FUNCTION","RETURN","BREAK","GOTO","REVERT","BROWSE","OPENDATASOURCE",
  "GRANT","REVOKE","BULK","GROUP","RIGHT","BY","HAVING","ROLLBACK","CASCADE","HOLDLOCK","ROWCOUNT",
  "CASE","IDENTITY","ROWGUIDCOL","CHECK","IDENTITY_INSERT","RULE","CHECKPOINT","IDENTITYCOL","SAVE",
  "CLOSE","IF","SCHEMA","CLUSTERED","IN","SECURITYAUDIT","COALESCE","INDEX","SELECT","COLLATE","INNER",
  "SEMANTICKEYPHRASETABLE","COLUMN","INSERT","SEMANTICSIMILARITYDETAILSTABLE","COMMIT","INTO","SESSION_USER",
  "CONSTRAINT","IS","SET","CONTAINS","JOIN","SETUSER","CONTAINSTABLE","KEY","SHUTDOWN","CONTINUE","KILL","SOME",
  "CONVERT","LEFT","STATISTICS","CREATE","LIKE","SYSTEM_USER","CROSS","LINENO","TABLE","CURRENT","LOAD","TABLESAMPLE",
  "CURRENT_DATE","MERGE","TEXTSIZE","CURRENT_TIME","NATIONAL","THEN","CURRENT_TIMESTAMP","NOCHECK","TO","CURRENT_USER",
  "NONCLUSTERED","TOP","CURSOR","NOT","TRAN","DATABASE","NULL","TRANSACTION", "DBCC","NULLIF","TRIGGER","DEALLOCATE","OF",
  "TRUNCATE", "DECLARE","TRY_CONVERT","DEFAULT","OFFSET","TSEQUAL","DELETE","UNION","DENEGAR","OPEN","UNIQUE","DESC",
  "UPDATE","DISTINCT","OPENQUERY","UPDATETEXT","DISTRIBUTED","OPENROWSET","UNPIVOT","DISK","OPENXML","USE","DOUBLE","OPTION",
  "USER","DROP","VALUES","DUMP","ORDER","VARYING","ELSE","OUTER","VIEW","FIN","OVER","WAITFOR","ERRLVL","PERCENT","WHEN",
  "ESCAPE","PIVOT","WHERE","EXCEPT","PLAN","WHILE","EXEC","PRECISION","WITH","Ejecute","PRIMARY","EXISTS","PRINT","PUBLIC",
];

// funcion que nos retorna el valor del tipo de dato de la columna 

const varTypeProperty = (property) =>{
  let type = property.type;
  return type === "integer" ? "INT":
         type === "number"  ? "FLOAT":
         type === "boolean" ? "BIT" :
         type === "string"  ? `NVARCHAR(${property.maxLength || 255})` :
         type === "object"  ? 'NVARCHAR(MAX)':
         'NVARCHAR(MAX)';
}


// Función para generar la sentencia SQL de creación de tabla
const generateCreateTableSQL = (jsonSchema,tableName) => {
  
    const columns = [];
    for (const key in jsonSchema.properties.value.properties) {
      const property = jsonSchema.properties.value.properties[key];
      const columnName = !ReservadasSQLServer.includes(key.toUpperCase()) ? key : "["+ key + "]" ;
      
      // Buscamos la propiedad en la funcion 
      let columnType = varTypeProperty(property);

      columns.push(`${columnName} ${columnType}`);
    }
    const primaryKey = 'id INT PRIMARY KEY'; // Reemplaza con tu clave primaria
  
    const createTableSQL = `CREATE TABLE ${tableName} ( ${primaryKey}, ${columns.join(', ')} );`;
  
    return createTableSQL;
  }

  // crea el codigo INSERT de nuestra tabla

  const generateInsertTableSQL = (jsonData,tableName) => {

    let claves = Object.keys(jsonData[0].value); 
    // estructura del insert principal 
    const lcInsert = `INSERT INTO ${tableName} (id, ${claves.join(', ')}) VALUES `;
    let filas = [];
    let inserts = [];
    const lnCant = 1000 // es el limite de registros por insert
    let cuenta = 0 ;  // es el valor incremental de los registros 
      for (let x = 0; x < jsonData.length ;x++ ){

         const lnId = ` ${jsonData[x].key.id} `;
         const valores = [];
          for(const [key, value] of Object.entries(jsonData[x].value)){
            let valor = ""
            switch(typeof(value)){
              case "number":
                valor = value;
              break;
              case "string":
                valor = "'" + value + "'"
              break;
              case "boolean":
                valor = value ? 1 : 0 ;
              break;
              case "object":
                valor = JSON.stringify(value);
              break;
            }
            valores.push(valor);
          }

          filas.push(`( ${lnId}, ${valores.join(', ')} )`);
          cuenta++;
          // se crea un INSERT cada 1000 registros para que pueda insertarse en la base de datos

          if(cuenta === lnCant || cuenta === jsonData.length){
            // se reinicia el insert
            inserts.push(lcInsert +  ` ${filas.join(', ')}`);
            filas = [];
            cuenta = 0;
          }
      }
    return inserts ;
  }

  export {
    generateCreateTableSQL,
    generateInsertTableSQL
  }


 