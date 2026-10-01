# Job Applications REST API

Una API RESTful desarrollada con **Node.js** y **MySQL** para gestionar vacantes laborales y postulaciones de candidatos, calculando automáticamente puntajes de idoneidad y prioridades de revisión mediante reglas de negocio personalizadas.

---

## 📑 Tabla de Contenidos

- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Decisiones Técnicas Destacadas](#-decisiones-técnicas-destacadas)
- [Modelo de Base de Datos y Normalización](#-modelo-de-base-de-datos-y-normalización)
- [Reglas de Negocio Implementadas](#-reglas-de-negocio-implementadas)
  - [Cálculo de Puntaje y Prioridad](#cálculo-de-puntaje-y-prioridad)
  - [Restricción de Duplicidad y Re-postulación](#restricción-de-duplicidad-y-re-postulación)
- [Especificación de la API (Endpoints)](#-especificación-de-la-api-endpoints)
- [Configuración e Instalación](#-configuración-e-instalación)
- [Pruebas Automatizadas](#-pruebas-automatizadas)

---

## 🏗 Arquitectura del Proyecto

El proyecto sigue una arquitectura modular en capas basada en el patrón **Controller-Service-Repository**, garantizando alta cohesión, bajo acoplamiento y facilidad para realizar pruebas unitarias e integración.

```text
job-applications-api/
├── .env.example
├── package.json
├── schema.sql
├── server.js
├── src/
│   ├── config/
│   │   └── database.js            # Pool de conexiones a MySQL (mysql2/promise)
│   ├── controllers/
│   │   └── application.controller.js  # Manejo de entrada/salida HTTP
│   ├── middlewares/
│   │   └── error.middleware.js    # Manejador global de errores
│   ├── repositories/
│   │   ├── application.repository.js  # Consultas SQL para postulaciones
│   │   ├── candidate.repository.js    # Consultas SQL para candidatos
│   │   └── job.repository.js          # Consultas SQL para vacantes
│   ├── routes/
│   │   ├── application.routes.js # Definición de endpoints de postulaciones
│   │   └── index.js              # Enrutador principal Express
│   ├── services/
│   │   ├── application.service.js# Orquestador del flujo de postulaciones
│   │   └── priority.service.js   # Lógica pura de puntuación y prioridad
│   └── utils/
│       └── response.util.js      # Estandarizador de respuestas HTTP
└── tests/
    └── priority.service.test.js  # Pruebas unitarias
```

---

## 💡 Decisiones Técnicas Destacadas

1. **Sintaxis de Módulos ECMAScript (`ESM`)**: Se utiliza `"type": "module"` en `package.json` para emplear la sintaxis moderna `import`/`export` de JavaScript de forma nativa.
2. **Uso de `mysql2/promise`**: Promesas asíncronas (`async/await`) sobre un pool de conexiones a la base de datos MySQL, mejorando la escalabilidad ante peticiones concurrentes y previniendo inyecciones SQL mediante consultas preparadas.
3. **Desacoplamiento de la Lógica de Negocio (`PriorityService`)**: El cálculo de la puntuación y la asignación de prioridad está aislado de las capas de transporte HTTP y de la persistencia SQL. Esto permite ejecutar pruebas unitarias puras y reutilizar la lógica si la API evoluciona.
4. **Manejo Centralizado de Errores**: Se implementó un middleware global que captura errores asíncronos y asigna códigos de estado HTTP semánticos (p. ej., `400 Bad Request`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`).
5. **Estandarización de Respuestas HTTP**: Formato JSON uniforme en todas las respuestas (`success`, `message`, `data`/`errors`).

---

## 🗄 Modelo de Base de Datos y Normalización

La base de datos cumple estrictamente con la **Tercera Forma Normal (3FN)**:
- **1FN**: Todos los campos contienen valores atómicos y no existen grupos repetitivos.
- **2FN**: Todos los atributos no clave dependen de la totalidad de su clave primaria.
- **3FN**: No existen dependencias transitivas entre atributos no clave.

```
+-------------------+        +--------------------+        +-------------------+
|    candidatos     |        |    postulaciones   |        |     vacantes      |
+-------------------+        +--------------------+        +-------------------+
| PK id             |1      *| PK id              |*      1| PK id             |
|    nombre         |<-------| FK candidato_id    |------->|    titulo_cargo   |
|    correo_electro.|        | FK vacante_id      |        |    anos_minimos.. |
|    anos_experiencia|        |    carta_present.  |        |    estado (OPEN/  |
|    fecha_creacion |        |    fuente (ENUM)   |        |           CLOSED) |
+-------------------+        |    puntaje         |        +-------------------+
                             |    prioridad (ENUM)|
                             |    estado (ENUM)   |
                             |    fecha_creacion  |
                             |    fecha_ultima_.. |
                             +--------------------+
```

---

## ⚙️ Reglas de Negocio Implementadas

### Cálculo de Puntaje y Prioridad

Al registrar una postulación, el sistema calcula de forma automática un **puntaje** en base a los siguientes criterios:

| Criterio | Condición | Puntuación |
| :--- | :--- | :---: |
| Experiencia | Candidato tiene $\ge$ años mínimos requeridos por la vacante | **+4** |
| Fuente | `source` es igual a `REFERRAL` | **+3** |
| Fuente | `source` es igual a `INTERNAL` | **+2** |
| Contenido | Carta de presentación incluye "node", "sql" o "api" (case-insensitive, max. 1 vez) | **+2** |
| Extensión | Carta de presentación excede los 500 caracteres | **+1** |
| Carga de Trabajo | Candidato tiene $\ge 3$ postulaciones activas (`RECEIVED` o `IN_REVIEW`) en otras vacantes | **-2** |

*Nota: El puntaje mínimo final está limitado a **0** (no puede ser negativo).*

#### Mapeo de Prioridad según Puntaje Total:
- **0 a 2 puntos**: `LOW`
- **3 a 4 puntos**: `MEDIUM`
- **5 a 6 puntos**: `HIGH`
- **7 o más puntos**: `TOP`

---

### Restricción de Duplicidad y Re-postulación

1. **Estados Activos/Finales**:
   - Si el candidato tiene una postulación previa en estado `RECEIVED`, `IN_REVIEW` o `HIRED` para la misma vacante, la nueva solicitud se rechaza con un código **409 Conflict**.
2. **Re-postulación tras Rechazo (`REJECTED`)**:
   - Si la postulación previa fue en estado `REJECTED`, el candidato debe esperar **mínimo 30 días** desde la fecha en que fue rechazada para poder aplicar nuevamente. Si intenta aplicar antes, el sistema responde con un código **422 Unprocessable Entity** indicando los días restantes de espera.

---

## 📡 Especificación de la API (Endpoints)

### 1. Registrar Postulación
- **Ruta**: `POST /applications`
- **Cuerpo de Solicitud (JSON)**:
  ```json
  {
    "candidateId": 1,
    "vacancyId": 1,
    "source": "REFERRAL",
    "coverLetter": "Desarrollador backend con experiencia en Node.js, SQL y APIs RESTful."
  }
  ```
- **Respuesta Exitosa (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Postulación registrada exitosamente",
    "data": {
      "id": 7,
      "candidateId": 1,
      "vacancyId": 1,
      "source": "REFERRAL",
      "coverLetter": "Desarrollador backend con experiencia en Node.js, SQL y APIs RESTful.",
      "score": 9,
      "priority": "TOP",
      "status": "RECEIVED"
    }
  }
  ```

---

### 2. Consultar Postulaciones
- **Ruta**: `GET /applications`
- **Parámetros de Búsqueda (Query Params)**:
  - `status` (opcional): `RECEIVED`, `IN_REVIEW`, `REJECTED`, `HIRED`
  - `vacancyId` (opcional): Filtro por ID de vacante.
- **Ejemplos**:
  - `GET /applications?status=IN_REVIEW`
  - `GET /applications?status=RECEIVED&vacancyId=1`
- **Ordenamiento**: Resultados devueltos automáticamente ordenados por **Puntaje DESC** (mayor a menor) y **Fecha de Creación ASC** (más antigua primero).

---

### 3. Cambiar Estado de Postulación
- **Ruta**: `PUT /applications/:id/status`
- **Cuerpo de Solicitud (JSON)**:
  ```json
  {
    "status": "IN_REVIEW"
  }
  ```
- **Restricciones**: No permite modificar postulaciones en estados finales (`REJECTED` o `HIRED`).

---

## 🚀 Configuración e Instalación

### Requisitos Previos
- **Node.js**: `v18.x` o superior.
- **MySQL Server**: `v8.0` o superior.

### Pasos

1. **Clonar el repositorio e instalar dependencias**:
   ```bash
   git clone https://github.com/Anderson-Oloroso/evaluacion-henrik-anderson-oloroso-garcia.git
   cd job-applications-api
   npm install
   ```

2. **Configurar las variables de entorno**:
   Crear un archivo `.env` basado en `.env.example`:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_contraseña
   DB_NAME=recruitment_db
   ```

3. **Ejecutar Base de Datos y Seeds**:
   Importar el archivo `schema.sql` en MySQL:
   ```bash
   mysql -u root -p < schema.sql
   ```

4. **Iniciar Servidor**:
   ```bash
   # Modo desarrollo
   npm run dev

   # Modo producción
   npm start
   ```

---

## 🧪 Pruebas Automatizadas

Las pruebas unitarias del servicio de cálculo de prioridades pueden ejecutarse mediante:

```bash
npm test
```