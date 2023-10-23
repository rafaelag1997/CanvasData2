
// Palabras reservadas de SQL server en caso de que aparezcan como nombre de una columna agregar corchetes

const ReservadasSQLServer = [
  "ADD","PROCEDURE","ALL","FETCH","ALTER","FILE","RAISERROR","FILLFACTOR","READ", "WRITETEXT",
  "ANY","FOR","READTEXT","AS","FOREIGN","RECONFIGURE","ASC","FREETEXT","REFERENCES", "EXIT",
  "AUTHORIZATION","FREETEXTTABLE","REPLICATION","BACKUP","FROM","RESTORE","BEGIN","PROC",
  "FULL","RESTRICT","BETWEEN","FUNCTION","RETURN","BREAK","GOTO","REVERT","BROWSE","OPENDATASOURCE",
  "GRANT","REVOKE","BULK","GROUP","RIGHT","BY","HAVING","ROLLBACK","CASCADE","HOLDLOCK","ROWCOUNT",
  "CASE","IDENTITY","ROWGUIDCOL","CHECK","IDENTITY_INSERT","RULE","CHECKPOINT","IDENTITYCOL","SAVE",
  "CLOSE","IF","SCHEMA","CLUSTERED","IN","SECURITYAUDIT","COALESCE","INDEX","SELECT","COLLATE","INNER",
  "SEMANTICKEYPHRASETABLE","COLUMN","INSERT","SEMANTICSIMILARITYDETAILSTABLE","COMMIT","INTO","SESSION_USER",
  "CONSTRAINT","IS","SET","CONTAINS","JOIN","SETUSER","CONTAINSTABLE","KEY","SHUTDOWN","CONTINUE","KILL","SOME",
  "CONVERT","LEFT","STATISTICS","CREATE","LIKE","SYSTEM_USER","CROSS","LINENO","TABLE","CURRENT","LOAD","TABLESAMPLE",
  "CURRENT_DATE","MERGE","TEXTSIZE","CURRENT_TIME","NATIONAL","THEN","CURRENT_TIMESTAMP","NOCHECK","TO","CURRENT_USER",
  "NONCLUSTERED","TOP","CURSOR","NOT","TRAN","DATABASE","NULL","TRANSACTION", "DBCC","NULLIF","TRIGGER","DEALLOCATE","OF",
  "TRUNCATE", "DECLARE","TRY_CONVERT","DEFAULT","OFFSET","TSEQUAL","DELETE","UNION","OPEN","UNIQUE","DESC",
  "UPDATE","DISTINCT","OPENQUERY","UPDATETEXT","DISTRIBUTED","OPENROWSET","UNPIVOT","DISK","OPENXML","USE","DOUBLE","OPTION",
  "USER","DROP","VALUES","DUMP","ORDER","VARYING","ELSE","OUTER","VIEW","FIN","OVER","WAITFOR","ERRLVL","PERCENT","WHEN",
  "ESCAPE","PIVOT","WHERE","EXCEPT","PLAN","WHILE","EXEC","PRECISION","WITH","EXECUTE","PRIMARY","EXISTS","PRINT","PUBLIC",
];

// funcion que nos retorna el valor del tipo de dato de la columna 

const varTypeProperty = (property) =>{
  let type = property.type;
  let format = property.format ;
  return type === "integer" ? ( format === "int32" ? "INT" : "BIGINT" ):
         type === "number"  ? "FLOAT":
         type === "boolean" ? "BIT" :
         type === "string"  ? `NVARCHAR(${ (property.maxLength <= 4000 ? property.maxLength || 255 : 'MAX') })` :
         type === "object"  ? 'NVARCHAR(MAX)':
         'NVARCHAR(MAX)';
}

// Función para generar la sentencia SQL de creación de tabla
const generateCreateTableSQL = (jsonSchema,tableName) => {

    let columns = Object.keys(jsonSchema.properties.value.properties).map((key) => {
      const property = jsonSchema.properties.value.properties[key];
      const columnName = !ReservadasSQLServer.includes(key.toUpperCase()) ? key : "["+ key + "]" ;
      const columnType = varTypeProperty(property);
      return `${columnName} ${columnType}`;
    });

    let metaColumns =  Object.keys(jsonSchema.properties.meta.properties).map((key) => {
      const property = jsonSchema.properties.meta.properties[key];
      const columnName =  key ;
      const columnType = varTypeProperty(property);
      return `${columnName} ${columnType}`;
    });


    const primaryKey = 'id BIGINT , CONSTRAINT PK_'+ tableName +' PRIMARY KEY (id)'; 
  
    const createTableSQL = `CREATE TABLE ${tableName} ( ${primaryKey}, ${columns.join(', ')}, ${metaColumns.join(', ')} );`;
  
    return createTableSQL;
  }

  // crea el codigo INSERT de nuestra tabla

  const generateInsertTableSQL = (tableName, properties ) => {
    // TODO
    // Ahora el Insert debe de contener todas la columnas del Schema de la tabla y si la misma
    // no tiene valores en el valor actual, se debe de Agregar al insert con el value NULL
    let claves = Object.keys(properties.value.properties);
    claves = claves.map( key =>{ return !ReservadasSQLServer.includes(key.toUpperCase()) ? key : "["+ key + "]" });
    let id = Object.keys(properties.key.properties);
    let meta = Object.keys(properties.meta.properties);
    const lcInsert = `INSERT INTO ${tableName} (${id.join(', ')}, ${claves.join(', ')} , ${meta.join(', ')}) 
    `;
    // Se crea el SELECT del JSON 
    let arrayProperties = Object.keys(properties.value.properties).map((key) => {
      return `ISNULL(j2.[${key}], NULL) [${key}]` ;
    });

    let arrayPropertiesType = Object.keys(properties.value.properties).map((key) => {
      const property = properties.value.properties[key];
      const type = property.type;
      const columnType = varTypeProperty(property);
      // Para que pueda almacenar al JSON se asigna el Alias JSON a la columna 
      // para saber más visita la página 
      // https://www.sqlshack.com/es/como-importar-exportar-datos-json-usando-sql-server-2016/

      return `[${key}] ${columnType} ''$.${key}'' ${type === "object" ? 'AS JSON' : '' }`;
    });
    
    // las cadenas de texto que se envíen desde parámetro , deben de estar entre comilla doble
    // y hacer el reemplazo en el SP

    // https://learn.microsoft.com/es-es/sql/t-sql/functions/openjson-transact-sql?view=sql-server-ver16
    
    let lcSelect = `SELECT ISNULL(j1.[id],NULL)  id, 
    ${arrayProperties.join(',')},
    ISNULL(j3.[ts], NULL) [ts] ,
    ISNULL(j3.[action], NULL) [action]  
    FROM OPENJSON(@json) 
    WITH (
      [key] NVARCHAR(MAX) ''$.key'' AS JSON,
      [value] NVARCHAR(MAX) ''$.value'' AS JSON,
      [meta] NVARCHAR(MAX) ''$.meta'' AS JSON
    )
    CROSS APPLY OPENJSON([key])
    WITH (
      [id] BIGINT ''$.id''
    ) j1
    CROSS APPLY OPENJSON([value])
    WITH (
      ${arrayPropertiesType.join(',')}
    ) j2
    CROSS APPLY OPENJSON([meta])
    WITH (
      [ts] NVARCHAR(255) ''$.ts'',
      [action] NVARCHAR(255) ''$.action''
    ) j3 ;`;

    return [lcInsert,lcSelect].join(" ");  

    //  return lcInsert;
  }

  // Esta funcion genera el Values de un grupo de registros 
  const generateInsertStatmentSQL = (properties,jsonData) => {
    
    // es el orden en el que se leen para el acomodo en la tabla
    let properOrder = ['key','value','meta'];
    
    let valores = [];

    properOrder.map(key =>{
        for(const column in properties[key].properties){
          if(jsonData[key][column]){
            let valor = jsonData[key][column];
            switch(typeof(valor)){
              case "number":
                valor = valor;
              break;
              case "string":
                valor = "'" + valor.replace(/'/g, "''") + "'"
              break;
              case "boolean":
                valor = valor ? 1 : 0 ;
              break;
              case "object":
                valor = JSON.stringify(valor).replace(/'/g, "''");
              break;
            }
            valores.push(valor);
          }else{
            valores.push('NULL');
          }
        }
    });

    return `(${valores.join(', ')})`;

  }


  export {
    generateCreateTableSQL,
    generateInsertTableSQL,
    generateInsertStatmentSQL
  }

 