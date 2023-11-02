# Importar datos de CanvasData2(JSON) a SQL SERVER 

1.- Iniciar la instalación con el comando `npm install` desde la carpeta raíz del proyecto


2.- Crear base de datos donde quieres almacenar la información y crear un usuario con los privilegios para escritura y lectura


3.- Crear procedimiento almacenado sp_LoadJsonData y la tabla de configuración tblConfigCanvasData2, que está en el documento scriptSQLPROC.txt


4.- Cambiar la configuración de la conexion a la base en el archivo server/config.js


5.- Identificar el client-id y client-secret para consumir la API 


