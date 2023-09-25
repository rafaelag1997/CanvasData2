
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


// Función para generar la sentencia SQL de creación de tabla
const generateCreateTableSQL = (jsonSchema,tableName) => {
  
    const columns = [];

    for (const key in jsonSchema.properties.value.properties) {
      const property = jsonSchema.properties.value.properties[key];
      const columnName = !ReservadasSQLServer.includes(key.toUpperCase()) ? key : key + "_c" ;
      let columnType = '';
  
      switch (property.type) {
        case 'integer':
          columnType = 'INT';
          break;
        case 'number':
          columnType = 'FLOAT';
          break;
        case 'boolean':
          columnType = 'BIT';
          break;
        case 'string':
          columnType = `NVARCHAR(${property.maxLength || 255})`;
          break;
        case 'object':
          columnType = 'NVARCHAR(MAX)';
          break;
        default:
          columnType = 'NVARCHAR(MAX)';
      }
      
    columns.push(`${columnName} ${columnType}`);
     
      
    }
  
    const primaryKey = 'id INT PRIMARY KEY'; // Reemplaza con tu clave primaria
  
    const createTableSQL = `CREATE TABLE ${tableName} (${columns.join(', ')}, ${primaryKey});`;
  
    return createTableSQL;
  }

  export {
    generateCreateTableSQL,
  }


 