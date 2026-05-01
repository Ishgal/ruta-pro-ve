-- ============================================================
-- LECCIONES PARA 8 CURSOS PRINCIPALES — Ruta Pro-VE
-- Ejecutar en Supabase SQL Editor
-- ============================================================


-- ============================================================
-- CURSO 1: Fundamentos de Contabilidad Venezolana (Nivel 1)
-- L1: video | L2: article | L3: video+article | L4: quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  '¿Qué es la Contabilidad y para qué sirve?',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=BpurN5_a3WU',
  NULL, 1, '18m', true
FROM courses c WHERE c.title = 'Fundamentos de Contabilidad Venezolana';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'La Partida Doble y la Ecuación Contable',
  'article'::"LessonType",
  NULL,
  $md$## La Ecuación Contable

La base de toda la contabilidad moderna es una igualdad simple pero poderosa:

**Activo = Pasivo + Patrimonio**

- **Activo**: Todo lo que la empresa posee (efectivo, inventario, maquinaria, cuentas por cobrar).
- **Pasivo**: Todo lo que la empresa debe a terceros (préstamos bancarios, cuentas por pagar, impuestos).
- **Patrimonio**: La diferencia entre activos y pasivos. Representa el valor neto real del negocio.

## El Principio de la Partida Doble

Formulado por Luca Pacioli en 1494, este principio establece que toda transacción contable afecta **al menos dos cuentas**:
- Una o más cuentas se **debitan (Debe)**
- Una o más cuentas se **acreditan (Haber)**

La suma del Debe siempre debe ser igual a la suma del Haber. Esto garantiza el equilibrio permanente de la ecuación.

### Ejemplo práctico

Una empresa venezolana compra una computadora por Bs. 500 pagando en efectivo:

| Cuenta | Debe | Haber |
|---|---|---|
| Equipos de Computación | 500 | |
| Efectivo en Caja | | 500 |

El activo "equipos" aumenta y el activo "efectivo" disminuye. La ecuación sigue en equilibrio.

## Las Cuentas Contables en Venezuela

El Plan de Cuentas venezolano sigue las VEN-PCGA y la normativa SENIAT. Las cuentas se agrupan en cinco categorías:

| Código | Categoría | Ejemplos |
|---|---|---|
| 1xx | Activos | Caja, Banco, Inventario |
| 2xx | Pasivos | Cuentas por pagar, Préstamos |
| 3xx | Patrimonio | Capital social, Utilidades retenidas |
| 4xx | Ingresos | Ventas, Intereses ganados |
| 5xx | Gastos | Sueldos, Alquiler, Servicios |

> **Nota venezolana**: Los estados financieros deben expresarse en Bolívares (Bs.) y respetar las VEN-PCGA (Principios de Contabilidad de Aceptación General en Venezuela).$md$,
  2, '20m', false
FROM courses c WHERE c.title = 'Fundamentos de Contabilidad Venezolana';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'El Ciclo Contable Paso a Paso',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=luIweQmHq94',
  $md$## Las 7 Etapas del Ciclo Contable

El ciclo contable es el proceso completo que va desde que ocurre una transacción hasta que se producen los estados financieros.

1. **Identificar la transacción** — ¿Hubo un hecho económico que afecta al negocio?
2. **Analizar el impacto** — ¿Qué cuentas se ven afectadas? ¿Débito o crédito?
3. **Registrar en el Diario** — Asiento contable con fecha, cuentas y montos.
4. **Mayorizar** — Pasar los asientos al Libro Mayor (una hoja por cuenta).
5. **Balance de Comprobación** — Verificar que el total del Debe = total del Haber.
6. **Ajustes contables** — Corregir diferencias de tiempo (depreciaciones, provisiones).
7. **Estados Financieros** — Balance General, Estado de Resultados, Flujo de Caja.

## Ejercicio de Práctica

Una ferretería venezolana realiza las siguientes operaciones en enero:

- 02/01: Compra inventario por Bs. 1.200 a crédito.
- 05/01: Vende mercancía por Bs. 800 al contado (costo Bs. 500).
- 10/01: Paga el 50% de la deuda del inventario.

**Intenta registrar estos asientos antes de ver el video.** El ciclo contable cobra sentido cuando lo practicas con casos reales.$md$,
  3, '25m', false
FROM courses c WHERE c.title = 'Fundamentos de Contabilidad Venezolana';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'Evaluación: Fundamentos de Contabilidad',
  'quiz'::"LessonType",
  NULL, NULL, 4, '10m', false,
  '[
    {
      "question": "¿Cuál es la ecuación contable fundamental?",
      "options": [
        {"text": "Activo = Pasivo + Patrimonio", "isCorrect": true},
        {"text": "Patrimonio = Activo + Pasivo", "isCorrect": false},
        {"text": "Activo + Pasivo = Ingresos", "isCorrect": false},
        {"text": "Pasivo = Activo - Ingresos", "isCorrect": false}
      ]
    },
    {
      "question": "Según el principio de la partida doble, cuando se compra equipo al contado:",
      "options": [
        {"text": "Aumenta un activo y disminuye otro activo", "isCorrect": true},
        {"text": "Aumenta el pasivo y disminuye el activo", "isCorrect": false},
        {"text": "Aumenta el patrimonio y el pasivo", "isCorrect": false},
        {"text": "Solo se afecta una cuenta", "isCorrect": false}
      ]
    },
    {
      "question": "¿Cuál es la primera etapa del ciclo contable?",
      "options": [
        {"text": "Identificar la transacción económica", "isCorrect": true},
        {"text": "Elaborar el Balance General", "isCorrect": false},
        {"text": "Registrar en el Libro Mayor", "isCorrect": false},
        {"text": "Calcular el Balance de Comprobación", "isCorrect": false}
      ]
    },
    {
      "question": "En Venezuela, los estados financieros se rigen por:",
      "options": [
        {"text": "Las VEN-PCGA y la normativa SENIAT", "isCorrect": true},
        {"text": "Únicamente las NIIF internacionales", "isCorrect": false},
        {"text": "El Código Civil venezolano exclusivamente", "isCorrect": false},
        {"text": "Las normas de contabilidad de EE.UU. (GAAP)", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Fundamentos de Contabilidad Venezolana';


-- ============================================================
-- CURSO 2: Lógica de Programación (Nivel 1)
-- L1: video+article | L2: article | L3: video | L4: video+quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  '¿Qué es un Algoritmo? Introducción al Pensamiento Lógico',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=TdITcVD64zI',
  $md$## ¿Qué es un Algoritmo?

Un algoritmo es un **conjunto finito de pasos ordenados** que resuelve un problema o realiza una tarea. Todo programa de computadora es, en esencia, un algoritmo.

### Características de un buen algoritmo
- **Finito**: Debe terminar en algún momento.
- **Definido**: Cada paso debe ser claro y sin ambigüedad.
- **Entrada**: Puede recibir datos de entrada (o ninguno).
- **Salida**: Siempre produce al menos un resultado.

## Pseudocódigo y Diagramas de Flujo

Antes de escribir código real, los programadores usan dos herramientas para planear algoritmos:

**Pseudocódigo** — Instrucciones escritas en lenguaje natural estructurado:
```
INICIO
  LEER nombre
  ESCRIBIR "Hola, " + nombre
FIN
```

**Diagrama de flujo** — Representación visual usando formas estándar:
- Óvalo → Inicio / Fin
- Rectángulo → Proceso
- Rombo → Decisión (Sí/No)
- Paralelogramo → Entrada/Salida

### Glosario clave
| Término | Significado |
|---|---|
| Variable | Espacio en memoria para guardar un valor |
| Constante | Valor que no cambia durante la ejecución |
| Instrucción | Orden que le das al computador |
| Iteración | Repetir un bloque de instrucciones |$md$,
  1, '22m', true
FROM courses c WHERE c.title = 'Lógica de Programación';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Variables, Tipos de Datos y Operadores',
  'article'::"LessonType",
  NULL,
  $md$## Variables y Constantes

Una **variable** es un nombre que apunta a un espacio en la memoria del computador donde se guarda un valor que puede cambiar.

```
edad = 20        // variable: puede cambiar
PI = 3.14159     // constante: no cambia
```

## Tipos de Datos Fundamentales

| Tipo | Qué guarda | Ejemplo |
|---|---|---|
| Entero (int) | Números sin decimales | 25, -8, 0 |
| Decimal (float) | Números con decimales | 3.14, -0.5 |
| Texto (string) | Cadenas de caracteres | "Hola", "Venezuela" |
| Booleano (bool) | Solo verdadero o falso | true, false |

## Operadores

### Aritméticos
```
+  suma          5 + 3 = 8
-  resta         5 - 3 = 2
*  multiplicar   5 * 3 = 15
/  dividir       10 / 2 = 5
%  módulo        10 % 3 = 1  (residuo)
```

### De Comparación (devuelven true o false)
```
==  igual a          5 == 5  → true
!=  distinto de      5 != 3  → true
>   mayor que        8 > 3   → true
<   menor que        2 < 7   → true
>=  mayor o igual    5 >= 5  → true
```

### Lógicos
```
AND  ambas condiciones deben ser true
OR   al menos una condición debe ser true
NOT  invierte el resultado
```

## Ejercicio

¿Qué resultado imprime este pseudocódigo?
```
a = 10
b = 3
resultado = a % b
ESCRIBIR resultado
```

> Respuesta: **1** (el residuo de dividir 10 entre 3)$md$,
  2, '25m', false
FROM courses c WHERE c.title = 'Lógica de Programación';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Estructuras de Control: Condicionales y Ciclos',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=tIS-1PmHAkE',
  NULL, 3, '30m', false
FROM courses c WHERE c.title = 'Lógica de Programación';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'Funciones y Algoritmos Prácticos',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=qSup_483xO8',
  NULL, 4, '28m', false,
  '[
    {
      "question": "¿Cuál es la principal característica que diferencia a un algoritmo de una simple lista de instrucciones?",
      "options": [
        {"text": "Debe ser finito, definido y producir al menos un resultado", "isCorrect": true},
        {"text": "Debe estar escrito en un lenguaje de programación", "isCorrect": false},
        {"text": "Solo puede usarse en computadoras modernas", "isCorrect": false},
        {"text": "Debe tener exactamente 10 pasos", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué tipo de dato usarías para guardar el nombre de un estudiante?",
      "options": [
        {"text": "String (texto)", "isCorrect": true},
        {"text": "Integer (entero)", "isCorrect": false},
        {"text": "Boolean (booleano)", "isCorrect": false},
        {"text": "Float (decimal)", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué devuelve la operación 17 % 5?",
      "options": [
        {"text": "2", "isCorrect": true},
        {"text": "3", "isCorrect": false},
        {"text": "3.4", "isCorrect": false},
        {"text": "12", "isCorrect": false}
      ]
    },
    {
      "question": "En un diagrama de flujo, ¿qué figura representa una decisión (SI/NO)?",
      "options": [
        {"text": "Un rombo", "isCorrect": true},
        {"text": "Un rectángulo", "isCorrect": false},
        {"text": "Un óvalo", "isCorrect": false},
        {"text": "Un paralelogramo", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Lógica de Programación';


-- ============================================================
-- CURSO 3: Análisis de Estados Financieros (Nivel 2)
-- L1: article | L2: video+article | L3: article | L4: article+quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Los Cuatro Estados Financieros Básicos',
  'article'::"LessonType",
  NULL,
  $md$## ¿Qué son los Estados Financieros?

Los estados financieros son documentos que muestran la **situación económica y financiera** de una empresa en un período determinado. Son la herramienta principal para tomar decisiones de inversión, crédito y gestión.

## Los Cuatro Estados Principales

### 1. Balance General (Estado de Situación Financiera)
Fotografía de la empresa en un momento específico. Muestra:
- **Activos**: lo que posee
- **Pasivos**: lo que debe
- **Patrimonio**: diferencia entre ambos

### 2. Estado de Resultados (Estado de Pérdidas y Ganancias)
Muestra el desempeño durante un período (mes, trimestre, año):
```
Ingresos por ventas
- Costo de ventas
= Utilidad Bruta
- Gastos operativos
= Utilidad Operativa (EBIT)
- Gastos financieros
- Impuestos (ISLR)
= Utilidad Neta
```

### 3. Estado de Flujo de Efectivo
Registra las entradas y salidas reales de dinero, clasificadas en:
- **Actividades Operativas**: del negocio principal
- **Actividades de Inversión**: compra/venta de activos
- **Actividades de Financiamiento**: préstamos, capital

### 4. Estado de Cambios en el Patrimonio
Explica por qué cambió el patrimonio entre dos períodos: aporte de capital, utilidades del período, dividendos pagados.

## ¿Cuál leer primero?

Los analistas financieros suelen revisar en este orden:
1. Estado de Resultados → ¿Es rentable el negocio?
2. Balance General → ¿Es solvente?
3. Flujo de Efectivo → ¿Genera caja real?$md$,
  1, '20m', true
FROM courses c WHERE c.title = 'Análisis de Estados Financieros';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Leyendo el Balance General y el Estado de Resultados',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=IERIXKbUVbo',
  $md$## Claves para Leer el Balance General

Al revisar un Balance General, enfócate en estas preguntas:

**¿La empresa puede pagar sus deudas a corto plazo?**
Compara el Activo Corriente (efectivo + cuentas por cobrar + inventario) con el Pasivo Corriente (deudas a menos de 1 año).

**¿Está muy endeudada?**
Si el Pasivo es mayor que el Patrimonio, la empresa depende más de acreedores que de sus propios dueños.

## Señales de Alerta en el Estado de Resultados

| Señal | ¿Qué puede significar? |
|---|---|
| Ingresos crecen pero utilidad cae | Los costos están fuera de control |
| Utilidad operativa negativa | El negocio principal no es rentable |
| Utilidad neta positiva pero flujo de caja negativo | Problema de cobranza |
| Gastos financieros muy altos | Exceso de deuda bancaria |

## Ejercicio

Empresa "Distribuidora Carabobo C.A." al 31/12/2024:
- Activo Total: Bs. 850.000
- Pasivo Total: Bs. 620.000
- Ingresos: Bs. 1.200.000
- Costo de Ventas: Bs. 750.000
- Gastos Operativos: Bs. 280.000

**Calcula**: ¿Cuánto es el Patrimonio? ¿Cuál es la Utilidad Neta (antes de impuestos)?$md$,
  2, '35m', false
FROM courses c WHERE c.title = 'Análisis de Estados Financieros';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Ratios Financieros: Liquidez y Rentabilidad',
  'article'::"LessonType",
  NULL,
  $md$## ¿Qué son los Ratios Financieros?

Los ratios (o indicadores) financieros son relaciones matemáticas entre cifras de los estados financieros. Permiten comparar el desempeño de una empresa contra sí misma en el tiempo, o contra empresas del mismo sector.

## Ratios de Liquidez

Miden la capacidad de pagar obligaciones a corto plazo.

**Razón Corriente**
```
Activo Corriente / Pasivo Corriente
```
> Un resultado > 1 indica que puede cubrir sus deudas de corto plazo.
> Ideal: entre 1.5 y 2.0

**Prueba Ácida (Quick Ratio)**
```
(Activo Corriente - Inventario) / Pasivo Corriente
```
> Más exigente: excluye el inventario porque no siempre se convierte en efectivo rápidamente.

## Ratios de Rentabilidad

Miden qué tan eficientemente genera ganancias la empresa.

**Margen Neto**
```
(Utilidad Neta / Ingresos) × 100
```
> Si el margen neto es 12%, la empresa gana Bs. 12 por cada Bs. 100 vendidos.

**ROE (Retorno sobre el Patrimonio)**
```
(Utilidad Neta / Patrimonio) × 100
```
> Mide la rentabilidad desde el punto de vista del accionista.

**ROA (Retorno sobre los Activos)**
```
(Utilidad Neta / Activo Total) × 100
```
> Mide qué tan eficientemente se usan todos los recursos de la empresa.

## Ratio de Endeudamiento

```
Pasivo Total / Activo Total
```
> Si es 0.73, significa que el 73% de los activos están financiados con deuda. Alto riesgo.$md$,
  3, '25m', false
FROM courses c WHERE c.title = 'Análisis de Estados Financieros';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'Interpretación de Resultados: Caso Práctico',
  'article'::"LessonType",
  NULL,
  $md$## Caso: Ferretería "El Tornillo de Oro" C.A.

Analicemos los datos de esta empresa venezolana al cierre de 2024:

| Indicador | 2023 | 2024 |
|---|---|---|
| Activo Corriente | Bs. 320.000 | Bs. 410.000 |
| Pasivo Corriente | Bs. 200.000 | Bs. 310.000 |
| Inventario | Bs. 180.000 | Bs. 240.000 |
| Utilidad Neta | Bs. 85.000 | Bs. 72.000 |
| Ingresos | Bs. 600.000 | Bs. 750.000 |
| Patrimonio | Bs. 280.000 | Bs. 320.000 |

## Análisis

**Razón Corriente 2024**: 410.000 / 310.000 = **1.32** (bajó respecto a 2023: 1.60)

**Prueba Ácida 2024**: (410.000 - 240.000) / 310.000 = **0.55** ← Señal de alerta

**Margen Neto 2024**: 72.000 / 750.000 × 100 = **9.6%** (bajó desde 14.2% en 2023)

**ROE 2024**: 72.000 / 320.000 × 100 = **22.5%**

## Conclusión

A pesar de que las ventas crecieron 25%, la rentabilidad cayó. La prueba ácida de 0.55 indica que sin liquidar inventario, la empresa no puede cubrir sus deudas de corto plazo. Se recomienda revisar la política de inventario y los costos operativos.$md$,
  4, '20m', false,
  '[
    {
      "question": "Si el Activo Corriente es Bs. 500.000 y el Pasivo Corriente es Bs. 250.000, ¿cuál es la Razón Corriente?",
      "options": [
        {"text": "2.0", "isCorrect": true},
        {"text": "0.5", "isCorrect": false},
        {"text": "250.000", "isCorrect": false},
        {"text": "1.5", "isCorrect": false}
      ]
    },
    {
      "question": "La Prueba Ácida excluye el inventario porque:",
      "options": [
        {"text": "No siempre puede convertirse en efectivo rápidamente", "isCorrect": true},
        {"text": "El inventario no tiene valor contable", "isCorrect": false},
        {"text": "El inventario forma parte del pasivo", "isCorrect": false},
        {"text": "Solo se usa en empresas de servicios", "isCorrect": false}
      ]
    },
    {
      "question": "Una empresa tiene Utilidad Neta de Bs. 90.000 e Ingresos de Bs. 600.000. ¿Cuál es su Margen Neto?",
      "options": [
        {"text": "15%", "isCorrect": true},
        {"text": "6.67%", "isCorrect": false},
        {"text": "90%", "isCorrect": false},
        {"text": "510.000", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué indica un ratio de endeudamiento de 0.85?",
      "options": [
        {"text": "El 85% de los activos están financiados con deuda, lo que es un nivel alto de riesgo", "isCorrect": true},
        {"text": "La empresa tiene muy poca deuda", "isCorrect": false},
        {"text": "La empresa es altamente rentable", "isCorrect": false},
        {"text": "El patrimonio es mayor que el pasivo", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Análisis de Estados Financieros';


-- ============================================================
-- CURSO 4: Desarrollo Web: HTML, CSS y JavaScript (Nivel 2)
-- L1: video | L2: video+article | L3: video | L4: video+quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Cómo Funciona la Web: Navegadores, Servidores y HTML',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=mK8H9lY2xcM',
  NULL, 1, '20m', true
FROM courses c WHERE c.title = 'Desarrollo Web: HTML, CSS y JavaScript';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'HTML: Estructura Semántica y Etiquetas Esenciales',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=8gJz2WSs99c',
  $md$## La Estructura Base de todo HTML

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mi primera página</title>
  </head>
  <body>
    <!-- El contenido visible va aquí -->
  </body>
</html>
```

## Etiquetas Semánticas (HTML5)

HTML5 introdujo etiquetas que dan **significado** al contenido, no solo estructura visual:

| Etiqueta | Para qué sirve |
|---|---|
| `<header>` | Encabezado de la página o sección |
| `<nav>` | Menú de navegación |
| `<main>` | Contenido principal (solo uno por página) |
| `<section>` | Sección temática de contenido |
| `<article>` | Contenido independiente (post, card) |
| `<footer>` | Pie de página |
| `<aside>` | Contenido lateral o complementario |

## Etiquetas de Texto y Medios

```html
<h1> hasta <h6>   <!-- Títulos (h1 es el más importante) -->
<p>               <!-- Párrafo -->
<a href="url">    <!-- Enlace -->
<img src="foto.jpg" alt="descripción" />  <!-- Imagen -->
<ul> <ol> <li>    <!-- Listas -->
<strong>          <!-- Texto en negrita (importancia semántica) -->
<em>              <!-- Texto en cursiva (énfasis) -->
```

> **Buena práctica**: Usa `alt` en todas las imágenes. Mejora accesibilidad y SEO.$md$,
  2, '35m', false
FROM courses c WHERE c.title = 'Desarrollo Web: HTML, CSS y JavaScript';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'CSS: Selectores, Modelo de Caja y Flexbox',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=ELSm-G201Ls',
  NULL, 3, '40m', false
FROM courses c WHERE c.title = 'Desarrollo Web: HTML, CSS y JavaScript';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'JavaScript: Variables, Funciones y Manipulación del DOM',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=BA328RQa08M',
  NULL, 4, '45m', false,
  '[
    {
      "question": "¿Cuál es la función del elemento <head> en HTML?",
      "options": [
        {"text": "Contiene metadatos, título y enlaces a estilos, no se muestra visualmente", "isCorrect": true},
        {"text": "Es el encabezado visible de la página web", "isCorrect": false},
        {"text": "Solo sirve para colocar el menú de navegación", "isCorrect": false},
        {"text": "Equivale al header semántico de HTML5", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué diferencia hay entre <strong> y <b> en HTML5?",
      "options": [
        {"text": "<strong> tiene significado semántico (importancia), <b> es solo visual", "isCorrect": true},
        {"text": "Son exactamente lo mismo, solo cambia el nombre", "isCorrect": false},
        {"text": "<b> es más moderno que <strong>", "isCorrect": false},
        {"text": "<strong> solo funciona en formularios", "isCorrect": false}
      ]
    },
    {
      "question": "En CSS, ¿qué es el modelo de caja (Box Model)?",
      "options": [
        {"text": "El espacio que ocupa un elemento: contenido + padding + border + margin", "isCorrect": true},
        {"text": "Un sistema para crear tablas en HTML", "isCorrect": false},
        {"text": "La forma de seleccionar elementos con JavaScript", "isCorrect": false},
        {"text": "El contenedor principal de Flexbox", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué hace document.querySelector() en JavaScript?",
      "options": [
        {"text": "Selecciona el primer elemento del DOM que coincide con el selector CSS", "isCorrect": true},
        {"text": "Crea un nuevo elemento HTML", "isCorrect": false},
        {"text": "Elimina un elemento del DOM", "isCorrect": false},
        {"text": "Envía datos a un servidor", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Desarrollo Web: HTML, CSS y JavaScript';


-- ============================================================
-- CURSO 5: Declaraciones de ISLR e IVA en Venezuela (Nivel 3)
-- L1: article | L2: video+article | L3: video | L4: article+quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Marco Legal: ¿Qué son el ISLR y el IVA en Venezuela?',
  'article'::"LessonType",
  NULL,
  $md$## El Sistema Tributario Venezolano

En Venezuela, los dos impuestos nacionales más importantes son administrados por el **SENIAT** (Servicio Nacional Integrado de Administración Aduanera y Tributaria).

## ISLR — Impuesto Sobre la Renta

**¿Qué grava?** Las ganancias o enriquecimientos netos obtenidos durante el año fiscal.

**¿Quiénes deben declararlo?**
- Personas naturales con ingresos superiores a 1.000 unidades tributarias anuales
- Personas jurídicas (empresas) sin excepción
- Comunidades y sociedades de personas

**Período fiscal**: Del 1 de enero al 31 de diciembre de cada año.
**Plazo para declarar**: Los primeros 3 meses del año siguiente (enero a marzo).

**Tarifa para personas naturales** (progresiva):
| Enriquecimiento Neto (UT) | Tarifa | Sustraendo |
|---|---|---|
| Hasta 1.000 | 6% | 0 |
| 1.001 a 1.500 | 9% | 30 UT |
| 1.501 a 2.000 | 12% | 75 UT |
| Más de 2.000 | 16% | 155 UT |

## IVA — Impuesto al Valor Agregado

**¿Qué grava?** La venta de bienes muebles, la prestación de servicios y la importación de bienes.

**Alícuota general**: 16% sobre el precio de venta.
**Alícuota reducida**: 8% para alimentos y medicamentos esenciales.
**Alícuota cero**: 0% para exportaciones.

**Períodos de declaración**: Mensual (primeros 15 días hábiles del mes siguiente).

**Agentes de Retención**: Las empresas designadas por el SENIAT retienen el 75% del IVA al momento de pagar a sus proveedores.$md$,
  1, '20m', true
FROM courses c WHERE c.title = 'Declaraciones de ISLR e IVA en Venezuela';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Cómo Calcular el ISLR: Tarifa Progresiva y Desgravámenes',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=VPHaCDI8O7U',
  $md$## Desgravámenes: Deducciones Permitidas

Los desgravámenes reducen el enriquecimiento neto sobre el que se calcula el ISLR. Existen dos tipos:

### Desgravamen Único (más común)
Se aplica automáticamente sin necesidad de comprobar gastos:
- **774 UT** para personas naturales residentes

### Desgravamen Detallado
Requiere comprobantes de:
- Gastos médicos del contribuyente y su familia
- Primas de seguros de hospitalización, cirugía y maternidad
- Intereses de créditos hipotecarios
- Cuotas de colegios y universidades privadas

## Ejemplo de Cálculo Paso a Paso

**Datos**: Juan tiene un salario anual de Bs. 4.800. El valor de la UT es Bs. 9.

**Paso 1**: Convertir a Unidades Tributarias
```
Bs. 4.800 / Bs. 9 = 533 UT de ingresos brutos
```

**Paso 2**: Aplicar desgravamen único (774 UT)
```
533 UT - 774 UT = negativo → Juan NO paga ISLR
```

> En este caso el salario no supera el desgravamen. Si los ingresos fueran mayores, se aplicaría la tarifa progresiva sobre el excedente.

## ¿Dónde se Declara?

Portal SENIAT: **declaraciones.seniat.gob.ve**
- Crear usuario si no tienes uno
- Seleccionar tipo de declaración: ISLR Persona Natural
- Ingresar datos del período fiscal$md$,
  2, '30m', false
FROM courses c WHERE c.title = 'Declaraciones de ISLR e IVA en Venezuela';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Declaración Paso a Paso en el Portal SENIAT',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=axUETPJVSxE',
  NULL, 3, '25m', false
FROM courses c WHERE c.title = 'Declaraciones de ISLR e IVA en Venezuela';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'Retenciones de IVA y Casos Especiales',
  'article'::"LessonType",
  NULL,
  $md$## ¿Qué es una Retención de IVA?

Cuando una empresa es **Agente de Retención** designado por el SENIAT, al comprarle a un proveedor no le paga el 100% del IVA. Le retiene el **75%** y lo entera directamente al SENIAT.

**Ejemplo**:
```
Proveedor emite factura por:
  Base imponible:  Bs. 1.000
  IVA 16%:         Bs.   160
  Total factura:   Bs. 1.160

El Agente de Retención:
  Paga al proveedor:  Bs. 1.000 + Bs. 40 (25% del IVA)  = Bs. 1.040
  Entera al SENIAT:   Bs. 120 (75% del IVA)
```

## Casos Especiales

### Operaciones Exentas de IVA
- Alimentos de primera necesidad (leche, carne, cereales)
- Medicamentos
- Libros y periódicos
- Servicios educativos

### Exportaciones
Las exportaciones tienen alícuota del 0% y el exportador puede recuperar el IVA pagado en sus compras (crédito fiscal).

### Contribuyentes Formales
Empresas que solo realizan operaciones exentas o exoneradas no cobran IVA pero deben presentar declaración informativa mensual.$md$,
  4, '20m', false,
  '[
    {
      "question": "¿Cuál es la alícuota general del IVA en Venezuela?",
      "options": [
        {"text": "16%", "isCorrect": true},
        {"text": "12%", "isCorrect": false},
        {"text": "8%", "isCorrect": false},
        {"text": "21%", "isCorrect": false}
      ]
    },
    {
      "question": "¿Con qué frecuencia deben declarar el IVA los contribuyentes ordinarios en Venezuela?",
      "options": [
        {"text": "Mensualmente, dentro de los primeros 15 días hábiles del mes siguiente", "isCorrect": true},
        {"text": "Trimestralmente", "isCorrect": false},
        {"text": "Anualmente junto con el ISLR", "isCorrect": false},
        {"text": "Semanalmente", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué porcentaje del IVA retiene un Agente de Retención al pagar a su proveedor?",
      "options": [
        {"text": "75% del IVA de la factura", "isCorrect": true},
        {"text": "100% del IVA de la factura", "isCorrect": false},
        {"text": "50% del IVA de la factura", "isCorrect": false},
        {"text": "16% del total de la factura", "isCorrect": false}
      ]
    },
    {
      "question": "¿Cuál de los siguientes bienes está EXENTO de IVA en Venezuela?",
      "options": [
        {"text": "Medicamentos y alimentos de primera necesidad", "isCorrect": true},
        {"text": "Equipos electrónicos importados", "isCorrect": false},
        {"text": "Servicios de consultoría empresarial", "isCorrect": false},
        {"text": "Materiales de construcción", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Declaraciones de ISLR e IVA en Venezuela';


-- ============================================================
-- CURSO 6: Control de Versiones con Git y GitHub (Nivel 3)
-- L1: video+article | L2: video | L3: video+article | L4: quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  '¿Qué es el Control de Versiones y por qué importa?',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=3GymExBkKjE',
  $md$## El Problema sin Control de Versiones

¿Alguna vez has tenido archivos como estos?
```
proyecto_final.docx
proyecto_final_v2.docx
proyecto_final_ESTE_SI.docx
proyecto_final_definitivo.docx
```

Esto se vuelve caótico en equipos de desarrollo. **Git** resuelve este problema.

## ¿Qué es Git?

Git es un **sistema de control de versiones distribuido**. Registra cada cambio que haces en tu código, quién lo hizo y cuándo.

### Ventajas clave
- Puedes **volver a cualquier versión anterior** del código
- Varios desarrolladores pueden trabajar en paralelo sin pisarse
- Cada uno tiene una **copia completa** del historial (distribuido)
- Es gratis y de código abierto

## Git vs GitHub

| | Git | GitHub |
|---|---|---|
| ¿Qué es? | Software instalado en tu PC | Plataforma web en la nube |
| Función | Gestiona versiones localmente | Aloja repositorios remotamente |
| Necesitas internet? | No | Sí |
| Es de pago? | Gratis y open source | Gratis para repos públicos |

> Git es la herramienta. GitHub es donde guardas y compartes tu código con el mundo.$md$,
  1, '28m', true
FROM courses c WHERE c.title = 'Control de Versiones con Git y GitHub';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Comandos Esenciales: init, add, commit, status y log',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=9ZJ-K-zk_Go',
  NULL, 2, '35m', false
FROM courses c WHERE c.title = 'Control de Versiones con Git y GitHub';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Ramas (Branches), Merge y Resolución de Conflictos',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=mBYSUUnMt9M',
  $md$## ¿Por qué usar Ramas?

Las ramas permiten trabajar en una **funcionalidad nueva sin afectar el código estable** (main). Es como trabajar en una copia paralela que luego puedes unir.

## Flujo de Trabajo con Ramas

```bash
# Ver ramas existentes
git branch

# Crear una rama nueva y cambiar a ella
git checkout -b feature/nueva-funcionalidad

# Trabajar en tu código...
git add .
git commit -m "feat: agregar formulario de contacto"

# Volver a main y fusionar
git checkout main
git merge feature/nueva-funcionalidad
```

## Conflictos de Merge

Un conflicto ocurre cuando dos personas modificaron la **misma línea** del mismo archivo. Git lo marca así:

```
<<<<<<< HEAD
  código de tu rama (main)
=======
  código de la otra rama
>>>>>>> feature/nueva-funcionalidad
```

Para resolver:
1. Abre el archivo y elige qué código conservar
2. Elimina las marcas `<<<<<<<`, `=======`, `>>>>>>>`
3. Guarda el archivo
4. Haz un commit: `git commit -m "resolve: conflicto en header"`

## Estrategia: Git Flow

En proyectos reales se usan múltiples ramas con propósitos definidos:
- `main` → código en producción (estable)
- `develop` → integración de features
- `feature/xxx` → desarrollo de funcionalidades
- `hotfix/xxx` → correcciones urgentes en producción$md$,
  3, '32m', false
FROM courses c WHERE c.title = 'Control de Versiones con Git y GitHub';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'Evaluación: Control de Versiones con Git',
  'quiz'::"LessonType",
  NULL, NULL, 4, '10m', false,
  '[
    {
      "question": "¿Cuál es la diferencia fundamental entre Git y GitHub?",
      "options": [
        {"text": "Git es el software de control de versiones local; GitHub es la plataforma en la nube para alojar repositorios", "isCorrect": true},
        {"text": "GitHub es más avanzado que Git y lo reemplaza completamente", "isCorrect": false},
        {"text": "Git solo funciona en Windows y GitHub solo en Linux", "isCorrect": false},
        {"text": "Son exactamente lo mismo, solo tienen diferente nombre", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué hace el comando git commit?",
      "options": [
        {"text": "Guarda permanentemente los cambios preparados en el historial del repositorio", "isCorrect": true},
        {"text": "Sube los cambios a GitHub", "isCorrect": false},
        {"text": "Descarga los últimos cambios del repositorio remoto", "isCorrect": false},
        {"text": "Crea una nueva rama de trabajo", "isCorrect": false}
      ]
    },
    {
      "question": "¿Para qué sirve crear una rama (branch) en Git?",
      "options": [
        {"text": "Trabajar en una nueva funcionalidad sin afectar el código estable de la rama principal", "isCorrect": true},
        {"text": "Hacer una copia de seguridad del repositorio en la nube", "isCorrect": false},
        {"text": "Eliminar el historial de commits anteriores", "isCorrect": false},
        {"text": "Compartir el código con otros desarrolladores", "isCorrect": false}
      ]
    },
    {
      "question": "¿Cuándo ocurre un conflicto de merge?",
      "options": [
        {"text": "Cuando dos ramas modificaron la misma línea del mismo archivo", "isCorrect": true},
        {"text": "Cuando no hay conexión a internet durante el push", "isCorrect": false},
        {"text": "Cuando el repositorio tiene más de 100 commits", "isCorrect": false},
        {"text": "Cuando se intenta hacer commit sin haber hecho add", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Control de Versiones con Git y GitHub';


-- ============================================================
-- CURSO 7: Auditoría Financiera (Nivel 4)
-- L1: article | L2: article+video | L3: article | L4: article+quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Principios y Objetivos de la Auditoría Financiera',
  'article'::"LessonType",
  NULL,
  $md$## ¿Qué es la Auditoría Financiera?

La auditoría financiera es el **examen independiente de los estados financieros** de una entidad, con el objetivo de emitir una opinión sobre si estos presentan razonablemente la situación financiera, de acuerdo con los principios contables aplicables.

## Principios Fundamentales del Auditor

### Independencia
El auditor no debe tener ningún interés personal, financiero o de otro tipo con la empresa auditada. Sin independencia, la opinión carece de credibilidad.

### Objetividad
Los juicios del auditor deben basarse en evidencia, no en suposiciones o presiones externas.

### Escepticismo Profesional
El auditor siempre debe cuestionar la información recibida y buscar evidencia que la soporte, sin asumir que todo lo que le dice el cliente es correcto.

### Confidencialidad
La información obtenida durante la auditoría es confidencial y no puede divulgarse a terceros sin autorización.

## Tipos de Auditoría

| Tipo | ¿Quién la realiza? | ¿Qué examina? |
|---|---|---|
| Externa | Firma auditora independiente | Estados financieros completos |
| Interna | Departamento propio de la empresa | Procesos, controles internos, eficiencia |
| Gubernamental | Contraloría General de la República | Entidades del sector público |
| Forense | Especialistas en fraudes | Irregularidades y delitos financieros |

## Marco Normativo en Venezuela

Los auditores en Venezuela deben seguir:
- **VEN-NIA**: Versión venezolana de las Normas Internacionales de Auditoría (NIAs)
- **Código de Ética del CPA**: Colegio de Contadores Públicos y Auditores
- **Ley del Ejercicio de la Contaduría Pública**$md$,
  1, '22m', true
FROM courses c WHERE c.title = 'Auditoría Financiera';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'El Proceso de Auditoría: Planificación, Ejecución y Reporte',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=_2ObLsKKiyg',
  $md$## Las Tres Fases de una Auditoría Financiera

### Fase 1: Planificación
Es la fase más importante. Define qué se auditará, cómo y con qué recursos.

**Actividades clave:**
- Conocer el negocio del cliente (sector, operaciones, riesgos)
- Evaluar los controles internos
- Calcular la **materialidad** (umbral a partir del cual un error es significativo)
- Elaborar el **programa de auditoría**: lista detallada de procedimientos a ejecutar

### Fase 2: Ejecución (Trabajo de Campo)
Se aplican los procedimientos planificados para obtener evidencia.

**Procedimientos comunes:**
- Inspección de documentos (facturas, contratos, cheques)
- Confirmaciones externas (saldos bancarios, cuentas por cobrar)
- Recálculo de cifras
- Observación de procesos (toma física de inventario)
- Indagaciones al personal

### Fase 3: Reporte (Informe del Auditor)
El resultado final es el **Informe del Auditor Independiente**, que incluye una de estas opiniones:

| Tipo de Opinión | Significado |
|---|---|
| Sin salvedades (limpia) | Los estados financieros son razonables |
| Con salvedades | Hay errores materiales pero limitados |
| Adversa | Los estados financieros son incorrectos |
| Abstención | No se pudo obtener evidencia suficiente |$md$,
  2, '40m', false
FROM courses c WHERE c.title = 'Auditoría Financiera';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Papeles de Trabajo y Evidencia de Auditoría',
  'article'::"LessonType",
  NULL,
  $md$## ¿Qué son los Papeles de Trabajo?

Los papeles de trabajo (PT) son el **registro documentado** de todos los procedimientos aplicados, la evidencia obtenida y las conclusiones alcanzadas durante la auditoría. Son la memoria del trabajo del auditor.

Son **propiedad del auditor**, no del cliente, y deben conservarse mínimo 5 años.

## Tipos de Papeles de Trabajo

### Archivo Permanente
Contiene información que no cambia de un período a otro:
- Escritura de constitución de la empresa
- Estatutos y contratos importantes
- Descripción del sistema contable
- Historial de auditorías anteriores

### Archivo Corriente
Contiene el trabajo del período que se audita:
- Programa de auditoría ejecutado
- Cedulas de trabajo (análisis de cuentas)
- Cartas de confirmación
- Memorandos de conclusiones

## Tipos de Evidencia de Auditoría

| Tipo | Ejemplo | Confiabilidad |
|---|---|---|
| Documental externa | Confirmación bancaria | Muy alta |
| Documental interna | Facturas, contratos | Media-alta |
| Física | Conteo de inventario | Alta |
| Testimonial | Declaraciones del personal | Baja (requiere corroboración) |
| Analítica | Comparación con períodos anteriores | Variable |

## La Materialidad

Un error es **material** si su magnitud hace que un usuario cambiaría su decisión basándose en los estados financieros. Se expresa como porcentaje de:
- Activos totales (0.5% - 1%)
- Ingresos totales (0.5% - 1%)
- Utilidad antes de impuestos (5% - 10%)$md$,
  3, '25m', false
FROM courses c WHERE c.title = 'Auditoría Financiera';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'Las Normas Internacionales de Auditoría (NIAs)',
  'article'::"LessonType",
  NULL,
  $md$## ¿Qué son las NIAs?

Las **Normas Internacionales de Auditoría** (NIAs o ISAs en inglés) son los estándares globales que rigen cómo se debe ejecutar una auditoría de estados financieros. Son emitidas por el **IAASB** (International Auditing and Assurance Standards Board).

En Venezuela se adoptaron como **VEN-NIA**, adaptadas al contexto legal local.

## NIAs Más Importantes

| NIA | Tema |
|---|---|
| NIA 200 | Objetivos globales del auditor |
| NIA 240 | Responsabilidad del auditor respecto al fraude |
| NIA 300 | Planificación de la auditoría |
| NIA 315 | Identificación y evaluación de riesgos |
| NIA 500 | Evidencia de auditoría |
| NIA 700 | Formación de la opinión e informe |

## NIA 315: Evaluación de Riesgos

Esta norma es central en la auditoría moderna. Requiere que el auditor entienda:
- El negocio y su entorno (sector, competencia, regulaciones)
- El control interno de la empresa
- Los riesgos de error material, tanto por fraude como por error

La evaluación de riesgos determina qué tanto trabajo de campo es necesario. A mayor riesgo, más procedimientos de auditoría.$md$,
  4, '20m', false,
  '[
    {
      "question": "¿Cuál es el objetivo principal de la auditoría financiera?",
      "options": [
        {"text": "Emitir una opinión independiente sobre si los estados financieros son razonables", "isCorrect": true},
        {"text": "Detectar y denunciar todos los fraudes cometidos en la empresa", "isCorrect": false},
        {"text": "Calcular el monto de impuestos que debe pagar la empresa", "isCorrect": false},
        {"text": "Preparar los estados financieros de la empresa", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué tipo de opinión emite el auditor cuando los estados financieros son completamente incorrectos?",
      "options": [
        {"text": "Opinión adversa", "isCorrect": true},
        {"text": "Opinión con salvedades", "isCorrect": false},
        {"text": "Abstención de opinión", "isCorrect": false},
        {"text": "Opinión sin salvedades", "isCorrect": false}
      ]
    },
    {
      "question": "¿A quién pertenecen los papeles de trabajo de una auditoría?",
      "options": [
        {"text": "Al auditor, no al cliente auditado", "isCorrect": true},
        {"text": "A la empresa auditada", "isCorrect": false},
        {"text": "Al SENIAT como ente regulador", "isCorrect": false},
        {"text": "Se comparten entre el auditor y el cliente", "isCorrect": false}
      ]
    },
    {
      "question": "¿Cuál tipo de evidencia de auditoría tiene mayor confiabilidad?",
      "options": [
        {"text": "Confirmación bancaria directa (evidencia documental externa)", "isCorrect": true},
        {"text": "Declaraciones verbales del gerente financiero", "isCorrect": false},
        {"text": "Facturas internas emitidas por la propia empresa", "isCorrect": false},
        {"text": "Reportes preparados por el departamento de contabilidad", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Auditoría Financiera';


-- ============================================================
-- CURSO 8: Arquitectura de Software (Nivel 4)
-- L1: video | L2: article | L3: video+article | L4: quiz
-- ============================================================

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Monolito vs Microservicios: ¿Cuándo usar cada uno?',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=UsEx2L-E6-Y',
  NULL, 1, '35m', true
FROM courses c WHERE c.title = 'Arquitectura de Software';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Patrones de Diseño: Singleton, Factory y Observer',
  'article'::"LessonType",
  NULL,
  $md$## ¿Qué son los Patrones de Diseño?

Los patrones de diseño son **soluciones probadas y documentadas** a problemas recurrentes en el desarrollo de software. No son código que copias directamente, sino plantillas conceptuales que adaptas a tu problema.

Fueron popularizados por el libro "Design Patterns" (Gang of Four, 1994) y se clasifican en tres categorías: **Creacionales**, **Estructurales** y **De Comportamiento**.

## Patrón Singleton (Creacional)

Garantiza que una clase tenga **una única instancia** en toda la aplicación y provee un punto de acceso global a ella.

**Cuándo usarlo**: Conexión a base de datos, configuración global, logger.

```typescript
class Database {
  private static instance: Database;

  private constructor() {}  // constructor privado

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

// Siempre retorna la misma instancia
const db1 = Database.getInstance();
const db2 = Database.getInstance();
// db1 === db2 → true
```

## Patrón Factory (Creacional)

Define una **interfaz para crear objetos**, pero delega en las subclases la decisión de qué clase instanciar.

**Cuándo usarlo**: Cuando el tipo exacto de objeto a crear depende de condiciones en tiempo de ejecución.

```typescript
interface Notification {
  send(message: string): void;
}

class EmailNotification implements Notification {
  send(msg: string) { console.log(`Email: ${msg}`); }
}

class SMSNotification implements Notification {
  send(msg: string) { console.log(`SMS: ${msg}`); }
}

function createNotification(type: string): Notification {
  if (type === 'email') return new EmailNotification();
  if (type === 'sms') return new SMSNotification();
  throw new Error('Tipo no soportado');
}
```

## Patrón Observer (Comportamiento)

Define una relación de **suscripción**: cuando un objeto cambia de estado, notifica automáticamente a todos sus dependientes.

**Cuándo usarlo**: Sistemas de eventos, notificaciones en tiempo real, interfaces reactivas (React usa este principio).

```typescript
// Subject (quien emite eventos)
class EventBus {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event: string, data: unknown) {
    this.listeners[event]?.forEach(cb => cb(data));
  }
}

const bus = new EventBus();
bus.on('userCreated', (user) => sendWelcomeEmail(user));
bus.emit('userCreated', { name: 'Carlos' });
```$md$,
  2, '30m', false
FROM courses c WHERE c.title = 'Arquitectura de Software';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview)
SELECT gen_random_uuid(), c.id,
  'Caso Práctico: Diseño de un Sistema Escalable',
  'video'::"LessonType",
  'https://www.youtube.com/watch?v=VyMRGf0Dji4',
  $md$## ¿Qué es la Escalabilidad?

Un sistema **escalable** puede manejar más carga (más usuarios, más datos, más peticiones) sin degradar su rendimiento ni requerir una reescritura completa.

Existen dos tipos de escalabilidad:

| Tipo | Cómo se logra | Ejemplo |
|---|---|---|
| Vertical (Scale-up) | Agregar más CPU/RAM al mismo servidor | Pasar de 8GB a 32GB RAM |
| Horizontal (Scale-out) | Agregar más servidores iguales | 1 servidor → 10 servidores |

La escalabilidad horizontal es preferida en sistemas modernos porque no tiene límite teórico.

## Componentes Clave de un Sistema Escalable

### Load Balancer (Balanceador de Carga)
Distribuye las peticiones entrantes entre múltiples servidores. Si uno falla, el balanceador redirige el tráfico a los demás.

### Caché
Almacena temporalmente resultados de operaciones costosas para no repetirlas. Redis es la solución más popular.

```
Sin caché: Usuario → API → Base de datos → Respuesta (200ms)
Con caché: Usuario → API → Redis → Respuesta (5ms) ← 40x más rápido
```

### Base de Datos: Read Replicas
En sistemas con mucha lectura, se usa una base de datos principal (escritura) y varias réplicas (lectura).

## Checklist de Diseño Escalable

- [ ] ¿Cada servicio tiene una responsabilidad clara?
- [ ] ¿Usamos caché para consultas frecuentes?
- [ ] ¿El sistema puede funcionar si un componente falla?
- [ ] ¿Las operaciones pesadas se procesan de forma asíncrona?
- [ ] ¿Tenemos monitoreo y alertas en producción?$md$,
  3, '38m', false
FROM courses c WHERE c.title = 'Arquitectura de Software';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id,
  'Evaluación: Principios de Arquitectura de Software',
  'quiz'::"LessonType",
  NULL, NULL, 4, '12m', false,
  '[
    {
      "question": "¿Cuál es la principal ventaja de la arquitectura de microservicios sobre el monolito?",
      "options": [
        {"text": "Permite escalar, desplegar y actualizar cada servicio de forma independiente", "isCorrect": true},
        {"text": "Es más fácil de desarrollar para equipos pequeños desde cero", "isCorrect": false},
        {"text": "Elimina completamente la necesidad de una base de datos", "isCorrect": false},
        {"text": "No requiere ningún tipo de comunicación entre componentes", "isCorrect": false}
      ]
    },
    {
      "question": "El patrón Singleton garantiza que:",
      "options": [
        {"text": "Solo exista una instancia de una clase en toda la aplicación", "isCorrect": true},
        {"text": "Una clase pueda crear múltiples tipos de objetos diferentes", "isCorrect": false},
        {"text": "Los objetos notifiquen automáticamente a sus dependientes", "isCorrect": false},
        {"text": "La clase no pueda ser instanciada nunca", "isCorrect": false}
      ]
    },
    {
      "question": "¿Qué hace un Load Balancer en un sistema distribuido?",
      "options": [
        {"text": "Distribuye las peticiones entrantes entre múltiples servidores para evitar sobrecarga", "isCorrect": true},
        {"text": "Comprime los datos para reducir el uso de memoria", "isCorrect": false},
        {"text": "Cifra las comunicaciones entre servicios", "isCorrect": false},
        {"text": "Gestiona las versiones del código en producción", "isCorrect": false}
      ]
    },
    {
      "question": "¿Cuál es la diferencia entre escalabilidad vertical y horizontal?",
      "options": [
        {"text": "Vertical agrega más recursos al mismo servidor; horizontal agrega más servidores", "isCorrect": true},
        {"text": "Horizontal mejora el hardware; vertical agrega más instancias de software", "isCorrect": false},
        {"text": "Son exactamente lo mismo, solo cambia el nombre según el proveedor cloud", "isCorrect": false},
        {"text": "Vertical se usa en microservicios y horizontal en monolitos", "isCorrect": false}
      ]
    }
  ]'::jsonb
FROM courses c WHERE c.title = 'Arquitectura de Software';
