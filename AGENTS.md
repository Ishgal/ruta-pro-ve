<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Arquitectura del Proyecto: Clean Architecture

**Obligatorio para todos los agentes de IA:** 
Este proyecto utiliza estrictamente los principios de **Clean Architecture**. Al escribir o refactorizar código, el agente DEBE seguir estas reglas de diseño:

1. **Separación de Capas (Separation of Concerns):**
   - **Capa de Dominio (Domain):** Entidades y reglas de negocio puras. Sin dependencias externas.
   - **Capa de Aplicación (Casos de Uso):** Lógica específica de la aplicación. Orquesta el flujo de datos usando interfaces (ports) hacia los repositorios.
   - **Capa de Adaptadores (Adapters/Repositories):** Implementación de acceso a datos (ej. usando Prisma) y comunicación con APIs externas.
   - **Capa de Presentación (UI/Framework):** Componentes de React/Next.js y controladores de rutas (Route Handlers). No deben contener lógica de negocio directa.

2. **Regla de Dependencia:**
   El código debe depender siempre *hacia adentro*. La lógica de negocio (Dominio/Casos de Uso) jamás debe importar o depender directamente del framework de UI (Next.js) ni del ORM (Prisma).

3. **Patrón Repositorio:**
   Todas las consultas a la base de datos deben aislarse en clases o funciones de tipo Repositorio. Los Casos de Uso llamarán a estos repositorios, nunca usarán `PrismaClient` directamente.

4. **Inversión de Dependencias (DIP):**
   Usa abstracciones e inyección de dependencias para conectar las capas, favoreciendo la testeabilidad y mantenibilidad.
