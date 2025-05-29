# Proyecto Restaurante

## Descripción del Proyecto

Este es un proyecto full-stack para la gestión de **clientes**, **pedidos** y **menú de platos**. Permite a los usuarios administrar clientes, realizar pedidos, y gestionar el menú de un restaurante. Está dividido en dos partes principales:

- **Backend**: Hecho con **Spring Boot** en Java, se encarga de gestionar las operaciones de la base de datos y servir los endpoints de la API.
- **Frontend**: Hecho con **Htmls, css y js**, proporciona una interfaz de usuario interactiva para interactuar con el backend.

El proyecto incluye funcionalidades como:
- CRUD de clientes, pedidos y platos.
- Búsquedas y filtrados.
- Actualización de estados de pedidos.
  
---

## Estructura del Proyecto

1. [Backend](https://github.com/DiegoArias32/SpringBoot-Restaurant/tree/main/BackEnd/crud_basic)
2. [Frontend](https://github.com/DiegoArias32/SpringBoot-Restaurant/tree/main/FrontEnd)
3. [Extra](https://github.com/DiegoArias32/SpringBoot-Restaurant/tree/main/extra)
   - [Base de datos](https://github.com/DiegoArias32/SpringBoot-Restaurant/tree/main/extra/SQL)
   - [Diseños de Figma](https://github.com/DiegoArias32/SpringBoot-Restaurant/tree/main/extra/mackop%20(figma))
   - [MER](https://github.com/DiegoArias32/SpringBoot-Restaurant/tree/main/extra/MER)

---

## Backend

El **Backend** está desarrollado usando **Spring Boot** y se encarga de gestionar la lógica de negocio y las interacciones con la base de datos.

### Instrucciones para configurar el backend

1. **Clona el repositorio**: En primer lugar, clona el repositorio del proyecto usando el siguiente comando:

   ```bash
   git clone https://github.com/DiegoArias32/SpringBoot-Restaurant.git

Esto clonara el proyecto en tu máquina local.

2. **Abre el proyecto en tu IDE**:
- Si estás utilizando IntelliJ IDEA o Eclipse, abre el proyecto como un proyecto Spring Boot.

- Si estás utilizando VS Code o cualquier otro editor, asegúrate de tener configurado Java y Spring Boot correctamente.

3. **Configura el archivo de configuración (application.properties o application.yml)**:
- Asegúrate de que el archivo application.properties o application.yml esté configurado correctamente para conectarse a tu base de datos.

- Si estás utilizando una base de datos como MySQL o PostgreSQL, necesitarás tener la base de datos en funcionamiento y configurar las credenciales en tu archivo de configuración.

- Ejemplo de configuración para MySQL:
   ```bash
   spring.datasource.url=jdbc:mysql://localhost:3306/restaurant_db
   spring.datasource.username=root
   spring.datasource.password=rootpassword

## Authors

- [@DiegoArias32](https://github.com/DiegoArias32)

