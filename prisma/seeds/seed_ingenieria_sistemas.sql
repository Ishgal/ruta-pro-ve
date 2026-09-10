-- ============================================================
-- SEED: Carrera Ingeniería de Sistemas — Ruta Pro-VE
-- Incluye: 14 cursos · 56+ lecciones · Badges · Cuentas de pago
-- ============================================================

-- 0. LIMPIAR DATOS ANTERIORES (idempotente)
DELETE FROM lessons WHERE course_id IN (
  SELECT id FROM courses WHERE 'ingenieria_sistemas' = ANY(careers)
);
DELETE FROM courses WHERE 'ingenieria_sistemas' = ANY(careers);
DELETE FROM badges WHERE name IN (
  'Primer Código', 'Constructor', 'En Racha', 'Full Stack', 'Ingeniero Pro'
);
DELETE FROM payment_accounts WHERE method IN ('pago_movil', 'binance_usdt', 'zelle');
-- ============================================================
-- 1. CURSOS — Nivel 1: Fundamentos
-- ============================================================
INSERT INTO courses (id, title, description, level_id, is_published, duration, careers, skills_tags) VALUES
(gen_random_uuid(), 'Lógica de Programación y Algoritmos', 'Desarrolla el pensamiento computacional desde cero.', 1, true, '3h 30m', ARRAY['sistemas'], ARRAY['algoritmos', 'pseudocódigo', 'lógica']),
(gen_random_uuid(), 'Python desde Cero', 'Domina el lenguaje de programación más demandado.', 1, true, '4h', ARRAY['sistemas'], ARRAY['python', 'programación']),
(gen_random_uuid(), 'Matemáticas para Programadores', 'Fundamentos matemáticos: álgebra booleana, sistemas numéricos, estadística.', 1, true, '2h 30m', ARRAY['sistemas'], ARRAY['matemáticas', 'booleana']);

-- ============================================================
-- 2. CURSOS — Nivel 2: Intermedio Básico
-- ============================================================
INSERT INTO courses (id, title, description, level_id, is_published, duration, careers, skills_tags) VALUES
(gen_random_uuid(), 'Estructuras de Datos y Algoritmos', 'Pilas, colas, árboles, grafos y algoritmos de búsqueda y ordenamiento.', 2, true, '4h', ARRAY['sistemas'], ARRAY['estructuras de datos', 'algoritmos', 'Big O']),
(gen_random_uuid(), 'Desarrollo Web: HTML, CSS y JavaScript', 'Construye interfaces web modernas desde cero.', 2, true, '5h', ARRAY['sistemas'], ARRAY['html', 'css', 'javascript', 'frontend']),
(gen_random_uuid(), 'Bases de Datos con SQL y PostgreSQL', 'Diseña esquemas relacionales, escribe consultas complejas con JOINs y subconsultas.', 2, true, '3h 30m', ARRAY['sistemas'], ARRAY['sql', 'postgresql', 'base de datos']);

-- ============================================================
-- 3. CURSOS — Nivel 3: Intermedio Avanzado
-- ============================================================
INSERT INTO courses (id, title, description, level_id, is_published, duration, careers, skills_tags) VALUES
(gen_random_uuid(), 'Programación Orientada a Objetos', 'Domina el paradigma POO con Python: clases, herencia, polimorfismo, SOLID.', 3, true, '3h', ARRAY['sistemas'], ARRAY['poo', 'clases', 'solid']),
(gen_random_uuid(), 'Desarrollo Backend con Node.js', 'Crea APIs REST robustas con Node.js y Express. Autenticación con JWT.', 3, true, '4h 30m', ARRAY['sistemas'], ARRAY['nodejs', 'express', 'api rest', 'backend']),
(gen_random_uuid(), 'Git y Trabajo Colaborativo', 'Domina el flujo de trabajo real en equipos de desarrollo: ramas, pull requests.', 3, true, '2h', ARRAY['sistemas'], ARRAY['git', 'github', 'ci/cd']);

-- ============================================================
-- 4. CURSOS — Nivel 4: Avanzado
-- ============================================================
INSERT INTO courses (id, title, description, level_id, is_published, duration, careers, skills_tags) VALUES
(gen_random_uuid(), 'Arquitectura de Software', 'Del monolito a los microservicios. Clean Architecture, sistemas distribuidos.', 4, true, '4h', ARRAY['sistemas'], ARRAY['arquitectura', 'microservicios', 'clean architecture']),
(gen_random_uuid(), 'Cloud y DevOps con Docker', 'Conteneriza aplicaciones con Docker, automatiza despliegues con GitHub Actions.', 4, true, '4h', ARRAY['sistemas'], ARRAY['docker', 'devops', 'ci/cd']),
(gen_random_uuid(), 'Seguridad Informática Aplicada', 'OWASP Top 10, cifrado, hashing seguro de contraseñas.', 4, true, '3h', ARRAY['sistemas'], ARRAY['seguridad', 'owasp', 'hashing']);

-- ============================================================
-- 5. CURSOS — Nivel 5: Experto
-- ============================================================
INSERT INTO courses (id, title, description, level_id, is_published, duration, careers, skills_tags) VALUES
(gen_random_uuid(), 'Inteligencia Artificial Aplicada con Python', 'ML supervisado y no supervisado, integración de APIs de IA (OpenAI, Groq).', 5, true, '5h', ARRAY['sistemas'], ARRAY['machine learning', 'ia', 'python']),
(gen_random_uuid(), 'Empleabilidad Tech en el Mercado Remoto', 'Portfolio que contrata, LinkedIn, entrevistas técnicas y trabajo freelance.', 5, true, '2h 30m', ARRAY['sistemas'], ARRAY['empleabilidad', 'portfolio', 'freelance']);
-- ============================================================
-- LECCIONES — CURSO 1: Lógica de Programación y Algoritmos
-- ============================================================
INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, '¿Qué es un Algoritmo? Pensamiento Computacional desde Cero', 'video'::"LessonType", 'https://www.youtube.com/watch?v=R3n0Fk9-s2k', 
'## ¿Qué es un Algoritmo?
Un algoritmo es una secuencia de pasos ordenados que resuelve un problema.
Características fundamentales: Finito, Definido, Efectivo.', 
1, '22m', true,
'[
  {"question": "¿Cuál es la característica que dice que un algoritmo SIEMPRE debe terminar?", "options": [{"text": "Finito", "isCorrect": true}, {"text": "Definido", "isCorrect": false}, {"text": "Efectivo", "isCorrect": false}]},
  {"question": "¿Qué representa un algoritmo?", "options": [{"text": "Una secuencia de pasos para resolver un problema", "isCorrect": true}, {"text": "Un lenguaje de programación", "isCorrect": false}, {"text": "Una base de datos", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Lógica de Programación y Algoritmos';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Variables, Tipos de Datos y Operadores', 'article'::"LessonType", NULL, 
'## Variables: los contenedores de la información
Tipos: Entero (int), Decimal (float), Texto (string), Booleano (bool).
Operadores lógicos: AND, OR, NOT.', 
2, '18m', false,
'[
  {"question": "¿Qué tipo de dato almacena el valor `true` o `false`?", "options": [{"text": "Booleano", "isCorrect": true}, {"text": "String", "isCorrect": false}, {"text": "Entero", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Lógica de Programación y Algoritmos';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Evaluación Final: Lógica de Programación', 'quiz'::"LessonType", NULL, NULL, 
3, '12m', false,
'[
  {"question": "Si quieres ejecutar un bloque exactamente 10 veces, ¿qué estructura usas?", "options": [{"text": "Bucle FOR", "isCorrect": true}, {"text": "Bucle WHILE", "isCorrect": false}, {"text": "Condicional IF", "isCorrect": false}]},
  {"question": "¿Cuál es el propósito del principio DRY?", "options": [{"text": "No repetir código", "isCorrect": true}, {"text": "Usar menos variables", "isCorrect": false}, {"text": "Documentar código", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Lógica de Programación y Algoritmos';

-- ============================================================
-- LECCIONES — CURSO 2: Python desde Cero
-- ============================================================
INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Instalación, Entorno y tu Primer Programa en Python', 'video'::"LessonType", 'https://www.youtube.com/watch?v=Kp4Mvapo5kc', 
'## Configurando tu entorno Python
Python usa indentación en lugar de llaves para definir bloques de código.', 
1, '30m', true,
'[
  {"question": "¿Cómo defines un bloque de código en Python?", "options": [{"text": "Con indentación (espacios)", "isCorrect": true}, {"text": "Con llaves {}", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Python desde Cero';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Estructuras de Datos: Listas, Diccionarios y Sets', 'article'::"LessonType", NULL, 
'## Colecciones en Python
- Lista: ordenada y mutable.
- Diccionario: clave:valor.
- Set: sin duplicados.', 
2, '22m', false,
'[
  {"question": "¿Cuál estructura Python NO permite duplicados?", "options": [{"text": "Set", "isCorrect": true}, {"text": "Lista", "isCorrect": false}, {"text": "Tupla", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Python desde Cero';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Evaluación Final: Python desde Cero', 'quiz'::"LessonType", NULL, NULL, 
3, '12m', false,
'[
  {"question": "¿Qué palabra clave se usa para definir una función en Python?", "options": [{"text": "def", "isCorrect": true}, {"text": "function", "isCorrect": false}]},
  {"question": "¿Qué comando instala un paquete Python desde PyPI?", "options": [{"text": "pip install", "isCorrect": true}, {"text": "npm install", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Python desde Cero';
-- ============================================================
-- LECCIONES — CURSO 3: Matemáticas para Programadores
-- ============================================================
INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Sistemas Numéricos: Binario, Octal y Hexadecimal', 'article'::"LessonType", NULL, 
'## Sistemas Numéricos
Las computadoras solo entienden 0s y 1s (binario).
- Hexadecimal: usa 16 dígitos (0-9 y A-F).', 
1, '20m', true,
'[
  {"question": "¿Cuántos dígitos usa el sistema binario?", "options": [{"text": "2 (0 y 1)", "isCorrect": true}, {"text": "10 (0-9)", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Matemáticas para Programadores';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Álgebra Booleana y Puertas Lógicas', 'article'::"LessonType", NULL, 
'## Álgebra Booleana
- AND (Y): True solo si AMBOS son True.
- OR (O): True si AL MENOS UNO es True.
- NOT (No): Invierte el valor.', 
2, '18m', false,
'[
  {"question": "¿Cuándo es verdadero `A AND B`?", "options": [{"text": "Solo cuando AMBOS A y B son verdaderos", "isCorrect": true}, {"text": "Cuando al menos uno es verdadero", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Matemáticas para Programadores';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Evaluación Final: Matemáticas para Programadores', 'quiz'::"LessonType", NULL, NULL, 
3, '10m', false,
'[
  {"question": "`True AND False` evalúa a:", "options": [{"text": "False", "isCorrect": true}, {"text": "True", "isCorrect": false}]},
  {"question": "En HTML, los colores como `#FF5733` usan el sistema:", "options": [{"text": "Hexadecimal", "isCorrect": true}, {"text": "Binario", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Matemáticas para Programadores';

-- ============================================================
-- LECCIONES — CURSO 4: Estructuras de Datos y Algoritmos
-- ============================================================
INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Complejidad Algorítmica: Notación Big O', 'article'::"LessonType", NULL, 
'## Eficiencia de un Algoritmo
La Notación Big O describe cómo crece el tiempo de ejecución según la entrada (n).
- O(1): Constante.
- O(n): Lineal.
- O(n²): Cuadrática.', 
1, '25m', true,
'[
  {"question": "¿Qué complejidad tiene un bucle que recorre n elementos?", "options": [{"text": "O(n)", "isCorrect": true}, {"text": "O(1)", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Estructuras de Datos y Algoritmos';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Pilas (Stack) y Colas (Queue)', 'article'::"LessonType", NULL, 
'## Pilas y Colas
- **Pila (Stack)**: LIFO (Last In, First Out).
- **Cola (Queue)**: FIFO (First In, First Out).', 
2, '22m', false,
'[
  {"question": "¿Cuál es el principio de una Pila (Stack)?", "options": [{"text": "LIFO — el último en entrar es el primero en salir", "isCorrect": true}, {"text": "FIFO — el primero en entrar es el primero en salir", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Estructuras de Datos y Algoritmos';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Evaluación Final: Estructuras de Datos', 'quiz'::"LessonType", NULL, NULL, 
3, '12m', false,
'[
  {"question": "¿Qué complejidad tiene un algoritmo con dos bucles FOR anidados?", "options": [{"text": "O(n²)", "isCorrect": true}, {"text": "O(n)", "isCorrect": false}]},
  {"question": "¿Qué estructura usarías para implementar la función de Deshacer (Ctrl+Z)?", "options": [{"text": "Pila (Stack)", "isCorrect": true}, {"text": "Cola (Queue)", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Estructuras de Datos y Algoritmos';
-- ============================================================
-- LECCIONES — CURSO 5: Desarrollo Web: HTML, CSS y JavaScript
-- ============================================================
INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'HTML Semántico: La Estructura de la Web', 'video'::"LessonType", 'https://www.youtube.com/watch?v=rr2H086z16s', 
'## HTML: El esqueleto de toda página web
HTML describe la estructura del contenido. Elementos semánticos: `<header>`, `<main>`, `<footer>`.', 
1, '28m', true,
'[
  {"question": "¿Qué elemento HTML define el contenido principal de una página?", "options": [{"text": "<main>", "isCorrect": true}, {"text": "<div>", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Desarrollo Web: HTML, CSS y JavaScript';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'CSS Moderno: Flexbox, Grid y Responsive', 'article'::"LessonType", NULL, 
'## CSS: El estilo de la web
- Flexbox: distribución en 1 dimensión.
- Grid: distribución en 2 dimensiones.
- Media Queries: `@media (min-width: 768px)`.', 
2, '30m', false,
'[
  {"question": "¿Cuál propiedad CSS activa el modelo Flexbox?", "options": [{"text": "display: flex", "isCorrect": true}, {"text": "flex: true", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Desarrollo Web: HTML, CSS y JavaScript';

INSERT INTO lessons (id, course_id, title, lesson_type, video_url, content, display_order, duration, is_free_preview, quiz_data)
SELECT gen_random_uuid(), c.id, 'Evaluación Final: HTML, CSS y JavaScript', 'quiz'::"LessonType", NULL, NULL, 
3, '12m', false,
'[
  {"question": "¿Cómo agregas un listener a un evento ''click'' en JS?", "options": [{"text": "boton.addEventListener(''click'', funcion)", "isCorrect": true}, {"text": "boton.onClick = funcion", "isCorrect": false}]},
  {"question": "La Fetch API retorna una:", "options": [{"text": "Promise (promesa)", "isCorrect": true}, {"text": "String", "isCorrect": false}]}
]'::jsonb
FROM courses c WHERE c.title = 'Desarrollo Web: HTML, CSS y JavaScript';


-- ============================================================
-- BADGES (Generales — aplican a todas las carreras)
-- ============================================================
INSERT INTO badges (id, name, description, condition_type, condition_value, icon_url) VALUES
(gen_random_uuid(), 'Primer Código', 'Completaste tu primer curso.', 'COURSE_COMPLETION', 1, '/icons/badges/primer-codigo.png'),
(gen_random_uuid(), 'Constructor', 'Has completado 3 cursos.', 'COURSE_COMPLETION', 3, '/icons/badges/constructor.png'),
(gen_random_uuid(), 'En Racha', '7 días consecutivos de aprendizaje.', 'STREAK', 7, '/icons/badges/en-racha.png'),
(gen_random_uuid(), 'Full Stack', 'Completaste 5 cursos.', 'COURSE_COMPLETION', 5, '/icons/badges/full-stack.png'),
(gen_random_uuid(), 'Ingeniero Pro', 'Completaste 10 cursos.', 'COURSE_COMPLETION', 10, '/icons/badges/ingeniero-pro.png');

-- ============================================================
-- CUENTAS DE PAGO (Venezuela)
-- ============================================================
INSERT INTO payment_accounts (id, method, label, is_active, details, display_order, created_at) VALUES
(gen_random_uuid(), 'pago_movil', 'Pago Móvil — Banco de Venezuela (BDV)', true, '{"banco": "Banco de Venezuela", "codigo_banco": "0102", "telefono": "0412-0000000", "cedula": "V-00000000", "titular": "Ruta Pro-VE C.A.", "rif": "J-00000000-0", "nota": "Enviar comprobante al WhatsApp"}'::jsonb, 1, NOW()),
(gen_random_uuid(), 'pago_movil', 'Pago Móvil — Banesco', true, '{"banco": "Banesco Banco Universal", "codigo_banco": "0134", "telefono": "0414-0000000", "cedula": "V-00000000", "titular": "Ruta Pro-VE C.A.", "rif": "J-00000000-0", "nota": "Enviar comprobante con nombre completo"}'::jsonb, 2, NOW()),
(gen_random_uuid(), 'binance_usdt', 'Binance Pay — USDT (Red TRC20)', true, '{"red": "TRC20", "wallet_address": "TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "binance_pay_id": "000000000", "email": "pagos@rutapro.ve", "nota": "Asegúrate de usar la red TRC20. Mínimo: $1 USDT."}'::jsonb, 3, NOW());
