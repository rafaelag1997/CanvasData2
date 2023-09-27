
// Palabras reservadas de SQL server en caso de que aparezcan como nombre de una columna quitarlas

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
    const primaryKey = 'id INT PRIMARY KEY'; 
  
    const createTableSQL = `CREATE TABLE ${tableName} ( ${primaryKey}, ${columns.join(', ')} );`;
  
    return createTableSQL;
  }

  // crea el codigo INSERT de nuestra tabla

  const generateInsertTableSQL = (tableName, properties ) => {
    // TODO
    // Ahora el Insert debe de contener todas la columnas del Schema de la tabla y si la misma
    // no tiene valores en el valor actual, se debe de Agregar al insert con el value NULL
    let claves = Object.keys(properties.value.properties);
    let id = Object.keys(properties.key.properties);
    const lcInsert = `INSERT INTO ${tableName} (${id.join(', ')}, ${claves.join(', ')}) 
    `;
    // Se crea el SELECT del JSON 
    let arrayProperties = Object.keys(properties.value.properties).map((key) => {
      return `ISNULL(j2.[${key}], NULL) [${key}]`;
    });

    let arrayPropertiesType = Object.keys(properties.value.properties).map((key) => {
      const property = properties.value.properties[key];
      const columnType = varTypeProperty(property);
      return `[${key}] ${columnType} ''$.${key}''`;
    });
    
    let lcSelect = `SELECT ISNULL(j1.[id],NULL)  id, 
    ${arrayProperties.join(`,
    `)} FROM OPENJSON(@json) 
    WITH (
      [key] NVARCHAR(MAX) '$.key' AS JSON,
      [value] NVARCHAR(MAX) '$.value' AS JSON
    )
    CROSS APPLY OPENJSON([key])
    WITH (
      [id] INT '$.id'
    ) j1
    CROSS APPLY OPENJSON([value])
    WITH (
      ${arrayPropertiesType.join(`,
    `)}
    ) j2;`;

    // let claves = Object.keys(jsonData[0].value); 
    // // estructura del insert principal 
    // const lcInsert = `INSERT INTO ${tableName} (id, ${claves.join(', ')}) VALUES `;
    // let filas = [];
    // let inserts = [];
    // const lnCant = 1000 // es el limite de registros por insert
    // let cuenta = 0 ;  // es el valor incremental de los registros 
    //   for (let x = 0; x < jsonData.length ;x++ ){

    //      const lnId = ` ${jsonData[x].key.id} `;
    //      const valores = [];
    //       for(const [key, value] of Object.entries(jsonData[x].value)){
    //         let valor = ""
    //         switch(typeof(value)){
    //           case "number":
    //             valor = value;
    //           break;
    //           case "string":
    //             valor = "'" + value + "'"
    //           break;
    //           case "boolean":
    //             valor = value ? 1 : 0 ;
    //           break;
    //           case "object":
    //             valor = JSON.stringify(value);
    //           break;
    //         }
    //         valores.push(valor);
    //       }

    //       filas.push(`( ${lnId}, ${valores.join(', ')} )`);
    //       cuenta++;
    //       // se crea un INSERT cada 1000 registros para que pueda insertarse en la base de datos

    //       if(cuenta === lnCant || cuenta === jsonData.length){
    //         // se reinicia el insert
    //         inserts.push(lcInsert +  ` ${filas.join(', ')}`);
    //         filas = [];
    //         cuenta = 0;
    //       }
    //   }
     return [lcInsert,lcSelect].join(" ");  ;
  }

  export {
    generateCreateTableSQL,
    generateInsertTableSQL
  }

const properties = {
  "schema": {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
          "meta": {
              "type": "object",
              "properties": {
                  "ts": {
                      "type": "string",
                      "format": "date-time"
                  },
                  "action": {
                      "type": "string",
                      "enum": [
                          "U",
                          "D"
                      ],
                      "title": "Identifies if a record is to be upserted (inserted or updated) or (hard) deleted."
                  }
              },
              "additionalProperties": false,
              "required": [
                  "ts"
              ],
              "title": "Meta-information associated with the record."
          },
          "key": {
              "type": "object",
              "properties": {
                  "id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The unique identifier for the course."
                  }
              },
              "additionalProperties": false,
              "required": [
                  "id"
              ],
              "title": "Stores attributes for a course."
          },
          "value": {
              "type": "object",
              "properties": {
                  "storage_quota": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The total amount of storage space (in bytes) allowed to be used by files in the course."
                  },
                  "integration_id": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "the integration identifier for the course, if defined."
                  },
                  "lti_context_id": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "UUID of the Canvas context in LTI standard. secondary ID for this context, could be used in API to identify resource as well."
                  },
                  "sis_batch_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The unique identifier for the SIS import."
                  },
                  "created_at": {
                      "type": "string",
                      "format": "date-time",
                      "description": "The date the course was created."
                  },
                  "updated_at": {
                      "type": "string",
                      "format": "date-time",
                      "description": "The time the course was last updated."
                  },
                  "workflow_state": {
                      "type": "string",
                      "enum": [
                          "created",
                          "claimed",
                          "available",
                          "completed",
                          "deleted",
                          "__dap_unspecified__"
                      ],
                      "description": "Life-cycle state for the course."
                  },
                  "account_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "Points to the account associated with the course."
                  },
                  "grading_standard_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The grading standard associated with the course."
                  },
                  "start_at": {
                      "type": "string",
                      "format": "date-time",
                      "description": "The start date for the course, if applicable. If NULL, then use `start_at` value from `enrollment_terms` table. Enrollment term dates, course dates, and course section dates flow together in all aspects of Canvas. Various dates allow different users to participate in the course. The hierarchy of dates are: course section dates override course dates, course dates override term dates."
                  },
                  "sis_source_id": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The SIS identifier for the course, if defined."
                  },
                  "group_weighting_scheme": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "Whether final grades will be weighted based on the `group_weight` value of assignment groups `percent` if weighted `equal` or NULL otherwise."
                  },
                  "conclude_at": {
                      "type": "string",
                      "format": "date-time",
                      "description": "The end date for the course, if applicable. If NULL, then use `start_at` value from `enrollment_terms` table."
                  },
                  "is_public": {
                      "type": "boolean",
                      "description": "True if the course is publicly visible."
                  },
                  "allow_student_wiki_edits": {
                      "type": "boolean",
                      "description": "Whether Pages in the course can be created and are editable by students."
                  },
                  "syllabus_body": {
                      "oneOf": [
                          {
                              "type": "string",
                              "const": "__dap_oversized_truncated__"
                          },
                          {
                              "type": "string"
                          }
                      ],
                      "description": "User-generated HTML for the course syllabus."
                  },
                  "default_wiki_editing_roles": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "Comma-separated list used as the default `editing_roles` value for new `wiki_pages` in the course."
                  },
                  "wiki_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "Foreign key to the `wikis` dataset."
                  },
                  "allow_student_organized_groups": {
                      "type": "boolean",
                      "description": "Whether students are able to organize their own groups."
                  },
                  "course_code": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The course code."
                  },
                  "default_view": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "the type of page that users will see when they first visit the course - `feed`: Recent Activity Dashboard - `wiki`: Wiki Front Page - `modules`: Course Modules/Sections Page - `assignments`: Course Assignments List - `syllabus`: Course Syllabus Page other types may be added in the future."
                  },
                  "abstract_course_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "Foreign key to the `abstract_courses` table."
                  },
                  "enrollment_term_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The enrollment term associated with the course."
                  },
                  "open_enrollment": {
                      "type": "boolean",
                      "description": "Whether the course has enabled open enrollment."
                  },
                  "tab_configuration": {
                      "type": "string",
                      "description": "A YAML serialized list detailing the order and visibility status of tabs in the left-hand navigation for the course."
                  },
                  "turnitin_comments": {
                      "oneOf": [
                          {
                              "type": "string",
                              "const": "__dap_oversized_truncated__"
                          },
                          {
                              "type": "string"
                          }
                      ],
                      "description": "Comments to be shown to students when submitting a Turnitin-enabled assignment."
                  },
                  "self_enrollment": {
                      "type": "boolean",
                      "description": "Whether the course has enabled self enrollment."
                  },
                  "license": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The default license for content in the course; `private`: Private (Copyrighted), `public_domain`: Public Domain, `cc_by`: CC Attribution, `cc_by_sa`: CC Attribution Share Alike, `cc_by_nc`: CC Attribution Noncommercial, `cc_by_nc_sa`: CC Attribution Noncommercial Share Alike, `cc_by_nd`: CC Attribution No Derivatives, `cc_by_nc_nd`: CC Attribution Noncommercial No Derivatives."
                  },
                  "indexed": {
                      "type": "boolean",
                      "description": "Whether the course is included in the public course index."
                  },
                  "restrict_enrollments_to_course_dates": {
                      "type": "boolean",
                      "description": "Whether the course's start and end dates will override dates from the term when determining user access."
                  },
                  "template_course_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "If set, this course was originally created via SIS when a section was marked to be cross listed to a non-existent course, using attributes from the original section's course and setting that course ID here."
                  },
                  "replacement_course_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The ID of the course created to replace this one when it had its content reset."
                  },
                  "public_description": {
                      "oneOf": [
                          {
                              "type": "string",
                              "const": "__dap_oversized_truncated__"
                          },
                          {
                              "type": "string"
                          }
                      ],
                      "description": "The public description of the course."
                  },
                  "self_enrollment_code": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The alpha-numeric code students can use to enroll in the course through self enrollment."
                  },
                  "self_enrollment_limit": {
                      "type": "integer",
                      "format": "int32",
                      "description": "The number of students that can enroll in the course through self enrollment."
                  },
                  "turnitin_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "A unique identifier for use with Turnitin."
                  },
                  "show_announcements_on_home_page": {
                      "type": "boolean",
                      "description": "Whether announcements will be shown on the course home page."
                  },
                  "home_page_announcement_limit": {
                      "type": "integer",
                      "format": "int32",
                      "description": "The maximum number of announcements to show on the course home page."
                  },
                  "latest_outcome_import_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The ID of the most recent Outcome Import for the course."
                  },
                  "grade_passback_setting": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The grade_passback_setting set on the course."
                  },
                  "template": {
                      "type": "boolean",
                      "description": "Course is marked as a template for accounts to use."
                  },
                  "homeroom_course": {
                      "type": "boolean",
                      "description": "Course is marked as a homeroom course."
                  },
                  "sync_enrollments_from_homeroom": {
                      "type": "boolean",
                      "description": "Enrollments for this course will be synced from the associated homeroom."
                  },
                  "homeroom_course_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": "Points to the homeroom course from which this course receives its enrollments."
                  },
                  "locale": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The course-set locale, if applicable."
                  },
                  "name": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The full name of the course."
                  },
                  "time_zone": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The course's IANA time zone name."
                  },
                  "uuid": {
                      "type": "string",
                      "maxLength": 255,
                      "description": "The UUID of the course."
                  },
                  "settings": {
                      "type": "object",
                      "properties": {
                          "allow_student_discussion_editing": {
                              "type": "string",
                              "description": "Let students edit or delete their own discussion posts."
                          },
                          "allow_student_discussion_topics": {
                              "type": "string",
                              "description": "Let students create discussion topics."
                          },
                          "course_format": {
                              "type": "string",
                              "description": "Format of a course, values include `blended`, `on_campus`, `online`."
                          },
                          "filter_speed_grader_by_student_group": {
                              "type": "string"
                          },
                          "hide_distribution_graphs": {
                              "type": "string",
                              "description": "Hide grade distribution graphs from students."
                          },
                          "hide_final_grade": {
                              "type": "string",
                              "description": "Hide totals in student grades summary."
                          },
                          "is_public_to_auth_users": {
                              "type": "string",
                              "description": "Set to true if course is public only to authenticated users."
                          },
                          "lock_all_announcements": {
                              "type": "string",
                              "description": "Disable comments on announcements."
                          },
                          "public_syllabus": {
                              "type": "string",
                              "description": "Set to true to make the course syllabus public. Values include true, false."
                          },
                          "public_syllabus_to_auth": {
                              "type": "string",
                              "description": "Set to true to make the course syllabus public for authenticated users."
                          },
                          "restrict_student_future_view": {
                              "type": "string",
                              "description": "Restrict students from viewing courses before start date."
                          },
                          "restrict_student_past_view": {
                              "type": "string",
                              "description": "Restrict students from viewing courses after end date."
                          },
                          "syllabus_updated_at": {
                              "type": "string",
                              "description": "Timestamp when syllabus was updated in a course."
                          },
                          "usage_rights_required": {
                              "type": "string",
                              "description": "Copyright and license information must be provided for files before they are published."
                          },
                          "allow_student_forum_attachments": {
                              "type": "string",
                              "description": "Whether students can attach files to discussions."
                          }
                      },
                      "additionalProperties": false,
                      "title": "Type extracted from column `courses.settings`."
                  }
              },
              "additionalProperties": false,
              "required": [
                  "created_at",
                  "updated_at",
                  "workflow_state",
                  "account_id",
                  "allow_student_organized_groups",
                  "enrollment_term_id",
                  "template",
                  "homeroom_course",
                  "sync_enrollments_from_homeroom"
              ],
              "title": "Stores attributes for a course."
          }
      },
      "additionalProperties": false,
      "required": [
          "key"
      ]
  },
  "version": 1
}.schema.properties
  console.log(generateInsertTableSQL("courses",properties));


 