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

![Bienvenida]([URL_de_la_imagen](https://github.com/user-attachments/assets/edba9ac8-bfa3-40f6-8455-63257159f648))


### Página de Registro
**Descripción**: Permite registrar tanto a pacientes como a especialistas. Cada tipo de usuario tiene diferentes campos requeridos y se aplican validaciones.

(foto)

### Página de Login
**Descripción**: Permite a los usuarios acceder al sistema. Las restricciones de acceso dependen del rol del usuario:
- **Especialistas**: Solo pueden acceder si su cuenta ha sido aprobada por un administrador y su email ha sido verificado.
- **Pacientes**: Solo pueden acceder si han verificado su email.

(foto)

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
 
(foto)

**Como Especialista**: Los especialistas pueden ver los turnos asignados y gestionarlos según su estado.
- **Filtros**: Permite filtrar por especialidad y paciente.
- **Acciones Disponibles**:
  - Cancelar turno 
  - Rechazar turno
  - Aceptar turno 
  - Finalizar turno (una vez terminado el turno, dando espacio para cargar una reseña del mismo)
  - Ver reseña

(foto)

### Página Turnos (Solo Administradores)
**Descripción**: Muestra una lista completa de los turnos en la clínica, accesible únicamente para administradores.
- **Filtros**: Permite filtrar los turnos por especialidad y especialista.
- **Acción**: Cancelar turnos (solo si no han sido aceptados, realizados o rechazados). La cancelación requiere un comentario.

(foto)

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




