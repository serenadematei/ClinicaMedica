# 🏥 Proyecto de Clínica Online

Bienvenido al **Proyecto de Clínica Online**. Esta aplicación web desarrollada en Angular versión 17.3.7 está diseñada para gestionar turnos, usuarios, historias clínicas y encuestas de satisfacción. Con una interfaz amigable, esta plataforma facilita la administración de las necesidades de una clínica médica moderna, ofreciendo funcionalidades específicas para pacientes, especialistas y administradores.

---

## 📜 Tabla de Contenidos
- [Descripción del Proyecto](#descripción-del-proyecto)
- [Características Principales](#características-principales)
- [Estructura de Pantallas](#estructura-de-pantallas)
  - [Página de Bienvenida](#página-de-bienvenida)
  - [Página de Registro](#página-de-registro)
  - [Página de Login](#página-de-login)
  - [Sección Usuarios](#sección-usuarios)
  - [Mis Turnos](#mis-turnos)
  - [Página Turnos](#página-turnos)
  - [Solicitar Turno](#solicitar-turno)
  - [Mi Perfil](#mi-perfil)

---

## 🌟 Descripción del Proyecto

La **Clínica Online** permite a los usuarios:
- Gestionar turnos médicos y acceder a sus detalles.
- Acceder y gestionar historias clínicas.
- Interactuar mediante encuestas y calificaciones de atención.
- Acceder a funcionalidades administrativas (para usuarios autorizados) como habilitación de cuentas y gestión de usuarios.

Este sistema busca mejorar la eficiencia en la organización y el servicio al cliente, automatizando la mayoría de los procesos administrativos.

---

## 🚀 Características Principales

- **Gestión de Usuarios**: Registro y acceso a perfiles de Pacientes, Especialistas y Administradores.
- **Control de Turnos**: Asignación y gestión de turnos con filtros personalizados.
- **Historia Clínica**: Acceso a historias clínicas con información relevante sobre cada consulta.
- **Encuestas de Satisfacción y Reseñas**: Calificaciones de atención y comentarios sobre cada turno.
- **Reportes y Exportación**: Generación de reportes en PDF y Excel para usuarios administradores y pacientes.

---

## 🖥️ Estructura de Pantallas

A continuación, se detalla cada pantalla de la aplicación con una descripción de sus funcionalidades.

### Página de Bienvenida
**Descripción**: Esta es la página principal de la clínica, donde los usuarios pueden acceder a las opciones de inicio de sesión y registro.
- **Acceso al Login**: Botón para iniciar sesión en la plataforma.
- **Acceso al Registro**: Opción para registrarse como paciente o especialista.

![Bienvenida](https://github.com/user-attachments/assets/edba9ac8-bfa3-40f6-8455-63257159f648)


### Página de Registro
**Descripción**: Permite registrar tanto a pacientes como a especialistas. Cada tipo de usuario tiene diferentes campos requeridos y se aplican validaciones.

![registro1](https://github.com/user-attachments/assets/a2281ef8-ce83-40f7-b003-316f4ca59ce7)
![registro2](https://github.com/user-attachments/assets/44e4a2d1-c864-4918-bd2a-b5af0c352dd4)

### Página de Login
**Descripción**: Permite a los usuarios acceder al sistema. Las restricciones de acceso dependen del rol del usuario:
- **Especialistas**: Solo pueden acceder si su cuenta ha sido aprobada por un administrador y su email ha sido verificado.
- **Pacientes**: Solo pueden acceder si han verificado su email.

![login](https://github.com/user-attachments/assets/69095afa-43dd-403d-b26f-98fc3252d619)

### Sección Usuarios (Solo Administradores)
**Descripción**: Accesible solo para administradores, permite la gestión y control de usuarios en el sistema.
- **Ver Información de Usuarios**: Lista de usuarios con sus roles y detalles de registro.
- **Habilitar/Inhabilitar Especialistas**: Control de acceso para cuentas de especialistas.
- **Crear Nuevos Usuarios**: Mismas opciones que en la página de registro, y permite también la creación de usuarios Administradores.

(foto)

### Mis Turnos
**Como Paciente**: Los pacientes pueden visualizar y gestionar sus turnos solicitados.
- **Filtros**: Permite filtrar por especialidad y especialista.
- **Acciones Disponibles**:
  - Cancelar turno 
  - Ver reseña 
  - Completar encuesta
  - Calificar atención
 
![misturnos_pac](https://github.com/user-attachments/assets/56affd02-c7e7-4f07-afce-75153281816c)
![msiturnos_reseña](https://github.com/user-attachments/assets/da166eda-2526-4023-b296-db6239827d08)

**Como Especialista**: Los especialistas pueden ver los turnos asignados y gestionarlos según su estado.
- **Filtros**: Permite filtrar por especialidad y paciente.
- **Acciones Disponibles**:
  - Cancelar turno 
  - Rechazar turno
  - Aceptar turno 
  - Finalizar turno (una vez terminado el turno, dando espacio para cargar una reseña del mismo)
  - Ver reseña

![misturnos_esp](https://github.com/user-attachments/assets/dc3baade-a918-4876-a32b-e5fb5805a0cf)
![historiaclinica](https://github.com/user-attachments/assets/34ef4114-cdd7-46cb-abec-38ef0e4209f1)

### Página Turnos (Solo Administradores)
**Descripción**: Muestra una lista completa de los turnos en la clínica, accesible únicamente para administradores.
- **Filtros**: Permite filtrar los turnos por especialidad y especialista.
- **Acción**: Cancelar turnos (solo si no han sido aceptados, realizados o rechazados). La cancelación requiere un comentario.

![turnosadmin](https://github.com/user-attachments/assets/447bb1cf-f349-472c-9bfe-58b590396bcc)

### Solicitar Turno
**Descripción**: Permite a pacientes y administradores solicitar un turno en la clínica.
- **Campos**:
  - Seleccionar especialidad
  - Seleccionar especialista
  - Día y horario
- **Restricciones**: Los pacientes solo pueden elegir turnos dentro de los próximos 15 días y acorde a la disponibilidad del especialista. Los administradores deben especificar el paciente para el turno.

(foto)

### Mi Perfil
**Descripción**: Página que muestra la información personal del usuario y opciones específicas según el rol.
- **Datos del Usuario**: Nombre, apellido, imágenes de perfil, etc.
- **Mis Horarios**: Disponible para especialistas, permite gestionar la disponibilidad horaria en sus especialidades.
- **Exportar Historia Clínica**: Los pacientes pueden descargar su historia clínica en formato PDF, que incluye el logo de la clínica, el título del informe y la fecha de emisión.

(foto)    




