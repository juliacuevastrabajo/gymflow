# Decisiones técnicas

## Sesiones concretas para clases recurrentes

Las reservas no apuntan directamente a una regla semanal. Las reglas se materializan en sesiones con fecha e ID estables. Esto permite cancelar o editar una fecha concreta, conservar el histórico y evitar interpretaciones distintas del calendario.

## Bloqueo de la última plaza

La sesión de clase se bloquea de forma pesimista durante la reserva. Capacidad, duplicidad y estado se verifican dentro de la misma transacción, por lo que dos clientes no pueden consumir simultáneamente la última plaza.

## Dos tipos de token

La sesión y la invitación de clientes usan secretos, formato y propósito diferentes. La base de datos conserva el identificador público de la invitación, pero no el token firmado completo.

## Destinatarios materializados

Los destinatarios de un comunicado se calculan al enviarlo o programarlo. Las cuentas creadas después no reciben por accidente mensajes puntuales anteriores, mientras que las automatizaciones periódicas pueden calcular su audiencia en cada ejecución prevista.

## Ciclo de vida de archivos

Una subida permanece temporal hasta que una operación de dominio la asocia. Esta separación evita que una URL inventada o un archivo de otro gimnasio pueda adjuntarse a una entidad y permite limpiar abandonos de forma segura.

## Manejo de errores en la app

Una respuesta vacía válida y un error de red son estados distintos. La aplicación conserva los últimos datos ante fallos recuperables, ofrece reintento y centraliza el cierre de sesión únicamente cuando el backend responde `401`.
