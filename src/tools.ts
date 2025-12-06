import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Información del servidor MCP INE
 */
export const SERVER_INFO = {
  name: 'mcp-ine',
  version: '1.0.0',
  description: `Servidor MCP para acceder a los datos del Instituto Nacional de Estadística (INE) de España.

El INE es el organismo oficial de estadística de España y ofrece datos sobre:
- Economía: IPC (inflación), PIB, comercio exterior, empresas
- Empleo: EPA (paro y empleo), salarios, condiciones de trabajo
- Población: censos, demografía, migraciones
- Sociedad: condiciones de vida, educación, salud
- Territorio: datos por CCAA, provincias, municipios

CÓMO USAR ESTE SERVIDOR:
1. Empieza con 'ine_operaciones_disponibles' para ver todas las estadísticas
2. Usa 'ine_tablas_operacion' con el código (ej: "IPC") para ver tablas disponibles
3. Usa 'ine_datos_tabla' con el ID de tabla para obtener los datos

OPERACIONES MÁS CONSULTADAS:
- IPC: Índice de Precios al Consumo (inflación mensual)
- EPA: Encuesta de Población Activa (empleo trimestral)
- PIB: Producto Interior Bruto
- CIFRAS_POB: Población oficial
- ECV: Encuesta de Condiciones de Vida
`
};

/**
 * Instrucciones para el modelo sobre cómo usar el servidor
 */
export const SERVER_INSTRUCTIONS = `Este servidor proporciona acceso a los datos del Instituto Nacional de Estadística (INE) de España.

FLUJO DE TRABAJO RECOMENDADO:
1. Usa 'ine_operaciones_disponibles' para ver todas las operaciones estadísticas disponibles
2. Usa 'ine_tablas_operacion' con el código de operación (ej: "IPC", "EPA") para ver las tablas
3. Usa 'ine_datos_tabla' con el ID de tabla para obtener los datos concretos

OPERACIONES MÁS USADAS:
- IPC: Índice de Precios al Consumo (inflación) - Mensual
- EPA: Encuesta de Población Activa (empleo/paro) - Trimestral  
- PIB: Producto Interior Bruto - Trimestral
- CIFRAS_POB: Cifras de Población - Semestral
- ECV: Encuesta de Condiciones de Vida - Anual
- DEFUNCIONES/NACIMIENTOS: Estadísticas vitales - Mensual

EJEMPLOS DE TABLAS COMUNES:
- Tabla 50902: IPC por grupos ECOICOP
- Tabla 4247: Población por provincias
- Tabla 4076: EPA - Tasas de paro

PARÁMETROS IMPORTANTES:
- nult: Número de últimos periodos (ej: nult=12 para último año)
- det: Nivel de detalle (0=básico, 2=completo)
- tip: Formato (A=amigable con nombres legibles)
- tv: Filtro por variable (formato: ID_VARIABLE:ID_VALOR)
- date: Rango de fechas (formato: AAAAMMDD:AAAAMMDD)`;

/**
 * Definición de herramientas MCP para la API del INE (Instituto Nacional de Estadística de España)
 * 
 * El INE ofrece datos estadísticos oficiales de España organizados en:
 * - OPERACIONES: Estadísticas principales (IPC, EPA, PIB, Población, etc.)
 * - TABLAS: Conjuntos de datos dentro de cada operación
 * - SERIES: Series temporales con datos históricos
 * - VARIABLES: Dimensiones de los datos (territorio, tiempo, actividad económica, etc.)
 * 
 * OPERACIONES MÁS COMUNES:
 * - IPC: Índice de Precios al Consumo (inflación)
 * - EPA: Encuesta de Población Activa (empleo/paro)
 * - PIB: Producto Interior Bruto (contabilidad nacional)
 * - CIFRAS_POB: Cifras de Población
 * - ECV: Encuesta de Condiciones de Vida
 * - DEFUNCIONES: Estadística de Defunciones
 * - NACIMIENTOS: Estadística de Nacimientos
 * - COMERCIO_EXT: Comercio Exterior
 * - TURISMO: Estadísticas de Turismo
 * 
 * FLUJO DE TRABAJO RECOMENDADO:
 * 1. Usar ine_operaciones_disponibles para ver todas las operaciones
 * 2. Usar ine_operacion para obtener detalles de una operación específica
 * 3. Usar ine_tablas_operacion para ver las tablas disponibles
 * 4. Usar ine_datos_tabla para obtener los datos concretos
 */
export const tools: Tool[] = [
  {
    name: 'ine_datos_tabla',
    description: `Obtiene los datos estadísticos de una tabla específica del INE.

EJEMPLOS DE TABLAS COMUNES:
- Tabla 50902: IPC por grupos ECOICOP (inflación por categorías)
- Tabla 4247: Población por provincias y sexo
- Tabla 4076: EPA - Tasas de paro por sexo y edad
- Tabla 30678: PIB a precios de mercado

PARÁMETROS:
- nult: Limita a los N últimos periodos (ej: nult=12 para último año mensual)
- det: Nivel de detalle (0=básico, 1=medio, 2=completo con metadatos)
- tip: Formato de respuesta (A=amigable con nombres, M=solo metadatos, AM=ambos)
- tv: Filtrar por variable (formato: ID_VARIABLE:ID_VALOR, ej: "3:6" para filtrar por Madrid)
- date: Rango de fechas (formato: AAAAMMDD:AAAAMMDD, ej: "20230101:20231231")

Para encontrar IDs de tablas, usa primero ine_tablas_operacion con el código de la operación (ej: "IPC").`,
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string', description: 'ID numérico de la tabla (ej: "50902" para IPC por grupos, "4247" para población). Usa ine_tablas_operacion para encontrar IDs.' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma de los resultados: ES=español, EN=inglés' },
        nult: { type: 'number', description: 'Número de últimos periodos a obtener (ej: 12 para último año si es mensual, 4 para último año si es trimestral)' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle: 0=básico, 1=medio, 2=completo con todos los metadatos' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Formato: A=amigable (incluye nombres legibles), M=solo metadatos, AM=ambos' },
        tv: { type: 'string', description: 'Filtro de variables (formato: ID_VARIABLE:ID_VALOR). Ej: "3:6" filtra por Madrid (variable 3=territorio, valor 6=Madrid)' },
        date: { type: 'string', description: 'Rango de fechas (formato: AAAAMMDD:AAAAMMDD). Ej: "20230101:20231231" para todo 2023' }
      },
      required: ['idTabla']
    }
  },
  {
    name: 'ine_datos_serie',
    description: `Obtiene los datos históricos de una serie temporal específica del INE.

Las series son conjuntos de datos a lo largo del tiempo para un indicador específico.
Cada serie tiene un código único que combina la operación y un identificador numérico.

EJEMPLOS DE SERIES:
- IPC251856: Índice general de precios al consumo (base 2021)
- EPA17: Tasa de paro total nacional
- DPOP163: Población total de España

PARÁMETROS:
- nult: Obtener solo los N últimos valores (ej: nult=24 para últimos 24 meses)
- date: Filtrar por rango de fechas

Para encontrar códigos de series, usa ine_series_operacion o ine_series_tabla.`,
    inputSchema: {
      type: 'object',
      properties: {
        idSerie: { type: 'string', description: 'Código de la serie temporal (ej: "IPC251856" para IPC general). Usa ine_series_operacion para encontrar códigos.' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma de los resultados' },
        nult: { type: 'number', description: 'Número de últimos periodos a obtener' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle: 0=básico, 1=medio, 2=completo' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Formato: A=amigable, M=metadatos, AM=ambos' },
        date: { type: 'string', description: 'Rango de fechas (formato: AAAAMMDD:AAAAMMDD)' }
      },
      required: ['idSerie']
    }
  },
  {
    name: 'ine_datos_metadata_operacion',
    description: `Obtiene datos de series filtrando por metadatos de una operación estadística.

Permite hacer consultas avanzadas combinando múltiples filtros (hasta 5 grupos de filtrado).
Útil cuando necesitas datos específicos de una operación sin conocer los IDs de series.

EJEMPLO: Para obtener el IPC de alimentación en Madrid:
- idOperacion: "IPC"
- g1: "762:244074" (grupo ECOICOP: Alimentos y bebidas no alcohólicas)
- g2: "70:9264" (provincia: Madrid)

PERIODICIDADES COMUNES (parámetro p):
- 1: Mensual
- 3: Trimestral
- 6: Semestral
- 12: Anual

Para conocer los IDs de variables y valores, usa ine_variables_operacion y ine_valores_variable_operacion.`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA", "PIB"). Usa ine_operaciones_disponibles para ver todas.' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma de los resultados' },
        p: { type: 'number', description: 'Periodicidad: 1=mensual, 3=trimestral, 6=semestral, 12=anual' },
        nult: { type: 'number', description: 'Número de últimos periodos a obtener' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Formato de respuesta' },
        g1: { type: 'string', description: 'Filtro grupo 1 (formato: ID_VARIABLE:ID_VALOR)' },
        g2: { type: 'string', description: 'Filtro grupo 2 (formato: ID_VARIABLE:ID_VALOR)' },
        g3: { type: 'string', description: 'Filtro grupo 3 (formato: ID_VARIABLE:ID_VALOR)' },
        g4: { type: 'string', description: 'Filtro grupo 4 (formato: ID_VARIABLE:ID_VALOR)' },
        g5: { type: 'string', description: 'Filtro grupo 5 (formato: ID_VARIABLE:ID_VALOR)' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_operaciones_disponibles',
    description: `HERRAMIENTA PRINCIPAL para descubrir todas las operaciones estadísticas del INE.

USA ESTA HERRAMIENTA PRIMERO para saber qué datos están disponibles.

OPERACIONES MÁS RELEVANTES:
- IPC: Índice de Precios al Consumo (inflación mensual)
- EPA: Encuesta de Población Activa (empleo/desempleo trimestral)
- PIB (o CNE): Contabilidad Nacional (PIB trimestral y anual)
- CIFRAS_POB: Cifras oficiales de población
- ECV: Encuesta de Condiciones de Vida
- DEFUNCIONES / NACIMIENTOS: Estadísticas vitales
- COMERCIO_EXT: Comercio exterior
- TURISMO: Estadísticas de turismo
- HIPOTECAS: Estadísticas de hipotecas
- SOCIEDADES: Estadísticas de sociedades mercantiles

La respuesta incluye el código de operación (campo "Codigo") que necesitarás para otras consultas.`,
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma de los resultados' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle: 0=básico (solo Id, Código, Nombre), 1=medio, 2=completo' },
        geo: { type: 'number', enum: [0, 1], description: 'Tipo de operaciones: 0=estadísticas nacionales, 1=estadísticas con desagregación geográfica' },
        page: { type: 'number', description: 'Número de página (cada página tiene 500 elementos). Por defecto página 1.' }
      }
    }
  },
  {
    name: 'ine_operacion',
    description: `Obtiene información detallada de una operación estadística específica.

Devuelve metadatos completos incluyendo:
- Nombre completo y descripción
- Periodicidad (mensual, trimestral, anual)
- Fecha de inicio de la serie
- Código IOE (clasificación internacional)
- Información sobre la publicación

EJEMPLOS DE CÓDIGOS:
- "IPC" → Índice de Precios al Consumo
- "EPA" → Encuesta de Población Activa
- "PIB" o "30678" → Producto Interior Bruto
- "CIFRAS_POB" → Cifras de Población
- "ECV" → Encuesta de Condiciones de Vida`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA") o su ID numérico. Usa ine_operaciones_disponibles para ver todas.' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle: 0=básico, 1=medio, 2=completo' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_variables',
    description: `Lista todas las variables estadísticas disponibles en el INE.

Las variables son las dimensiones que caracterizan los datos estadísticos.

VARIABLES MÁS COMUNES:
- ID 3 (Territorio): Provincias, CCAA, municipios
- ID 70 (Provincias): 52 provincias españolas
- ID 762 (Grupos ECOICOP): Categorías del IPC
- ID 547 (Sexo): Hombre, Mujer, Total
- ID 18 (Edad): Grupos de edad
- ID 349 (Actividad económica): Sectores CNAE

Estas variables se usan para filtrar datos con el parámetro 'tv' (formato: ID_VARIABLE:ID_VALOR).`,
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        page: { type: 'number', description: 'Página de resultados (500 por página)' }
      }
    }
  },
  {
    name: 'ine_variables_operacion',
    description: `Obtiene las variables (dimensiones) utilizadas en una operación específica.

Muy útil para saber qué filtros puedes aplicar a los datos de una operación.

EJEMPLO: Para el IPC, devuelve variables como:
- Grupos ECOICOP (categorías de productos)
- Índices y tasas (índice, variación mensual, anual)
- Tipo de dato (dato definitivo, provisional)

Para la EPA, devuelve:
- Sexo
- Grupo de edad
- Situación laboral
- Comunidad Autónoma

Usa el ID de la variable con ine_valores_variable_operacion para ver sus valores posibles.`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        page: { type: 'number', description: 'Página de resultados' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_valores_variable',
    description: `Obtiene todos los valores posibles de una variable estadística.

EJEMPLOS:
- Variable 70 (Provincias): Madrid (28), Barcelona (8), Valencia (46)...
- Variable 547 (Sexo): Hombres, Mujeres, Ambos sexos
- Variable 762 (Grupos ECOICOP): Alimentos, Vestido, Vivienda, Transporte...
- Variable 3 (Territorio): Comunidades autónomas y provincias

Los valores obtenidos (campo "Id") se usan para filtrar datos con el formato ID_VARIABLE:ID_VALOR.

Por ejemplo, para filtrar por Madrid:
- Variable 70 (provincias), Valor para Madrid = su ID específico
- Usar en filtro: "70:28" (si 28 es el ID de Madrid)`,
    inputSchema: {
      type: 'object',
      properties: {
        idVariable: { type: 'string', description: 'ID numérico de la variable (ej: "70" para provincias, "547" para sexo). Usa ine_variables para ver todas.' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        clasif: { type: 'number', description: 'ID de clasificación (opcional, para filtrar por clasificación específica)' }
      },
      required: ['idVariable']
    }
  },
  {
    name: 'ine_valores_variable_operacion',
    description: `Obtiene los valores de una variable específica DENTRO del contexto de una operación.

Más preciso que ine_valores_variable porque solo devuelve valores relevantes para la operación.

EJEMPLO PRÁCTICO:
Para saber qué grupos de productos tiene el IPC:
- idOperacion: "IPC"
- idVariable: "762" (Grupos ECOICOP)

Resultado: Alimentos (Id: X), Vestido (Id: Y), Vivienda (Id: Z), etc.

Luego usa esos IDs para filtrar datos específicos.`,
    inputSchema: {
      type: 'object',
      properties: {
        idVariable: { type: 'string', description: 'ID de la variable. Usa ine_variables_operacion para ver las variables de la operación.' },
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' }
      },
      required: ['idVariable', 'idOperacion']
    }
  },
  {
    name: 'ine_tablas_operacion',
    description: `Lista todas las tablas de datos disponibles para una operación estadística.

Esta herramienta es CLAVE para saber qué datos puedes obtener de una operación.

EJEMPLOS:
Para "IPC" devuelve tablas como:
- Índices por comunidades autónomas
- Índices por grupos ECOICOP
- Variaciones mensuales y anuales
- Índices por provincias

Para "EPA" devuelve tablas como:
- Activos por sexo y grupo de edad
- Parados por tiempo de búsqueda de empleo
- Ocupados por sector económico
- Tasas de actividad, empleo y paro

El campo "Id" de cada tabla se usa luego con ine_datos_tabla para obtener los datos.`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA", "PIB")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        geo: { type: 'number', enum: [0, 1], description: '0=tablas nacionales, 1=tablas con desagregación geográfica' },
        tip: { type: 'string', enum: ['A'], description: 'A=formato amigable con nombres legibles' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_grupos_tabla',
    description: `Obtiene los grupos de selección (dimensiones) que definen una tabla.

Cada tabla del INE está estructurada en grupos que determinan cómo se organizan los datos.
Esto te ayuda a entender la estructura de los datos antes de solicitarlos.

EJEMPLO: Una tabla del IPC puede tener grupos como:
- Grupo 1: Tipo de índice/variación
- Grupo 2: Grupos ECOICOP (categorías de productos)
- Grupo 3: Territorio

Usa el ID del grupo con ine_valores_grupos_tabla para ver sus valores posibles.`,
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string', description: 'ID de la tabla. Usa ine_tablas_operacion para encontrar IDs de tablas.' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' }
      },
      required: ['idTabla']
    }
  },
  {
    name: 'ine_valores_grupos_tabla',
    description: `Obtiene los valores disponibles para un grupo específico dentro de una tabla.

Complementa a ine_grupos_tabla: primero obtienes los grupos, luego los valores de cada grupo.

EJEMPLO:
Si la tabla del IPC tiene un grupo "Territorio" (ID: 1), esta herramienta devuelve:
- Nacional
- Andalucía
- Aragón
- ... (todas las CCAA y provincias disponibles)`,
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string', description: 'ID de la tabla' },
        idGrupo: { type: 'string', description: 'ID del grupo (obtenido de ine_grupos_tabla)' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' }
      },
      required: ['idTabla', 'idGrupo']
    }
  },
  {
    name: 'ine_serie',
    description: `Obtiene información completa (metadatos) de una serie temporal específica.

A diferencia de ine_datos_serie (que devuelve los datos), esta herramienta devuelve los METADATOS:
- Nombre completo de la serie
- Periodicidad (mensual, trimestral, anual)
- Unidad de medida
- Escala
- Operación a la que pertenece
- Fecha de inicio y fin

Útil para entender qué representa una serie antes de pedir sus datos.`,
    inputSchema: {
      type: 'object',
      properties: {
        idSerie: { type: 'string', description: 'Código de la serie (ej: "IPC251856")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Formato de respuesta' }
      },
      required: ['idSerie']
    }
  },
  {
    name: 'ine_series_operacion',
    description: `Lista todas las series temporales disponibles para una operación.

Puede devolver MUCHAS series (algunas operaciones tienen miles).
Usa el parámetro 'page' para paginar si es necesario.

EJEMPLO: Para "IPC" devuelve series como:
- IPC251856: Índice general nacional
- IPC251857: Índice de alimentos
- IPC251858: Índice de vestido
- ... y muchas más por territorio y categoría

Cada serie tiene un código (campo "COD") que puedes usar con ine_datos_serie.`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Formato: A=amigable con nombres' },
        page: { type: 'number', description: 'Página de resultados (importante para operaciones con muchas series)' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_valores_serie',
    description: `Obtiene las variables y sus valores que definen una serie específica.

Explica QUÉ REPRESENTA la serie mostrando sus dimensiones.

EJEMPLO: Para una serie del IPC de alimentación en Madrid:
- Variable "Grupo ECOICOP": Valor "Alimentos y bebidas no alcohólicas"
- Variable "Territorio": Valor "Madrid"
- Variable "Tipo de dato": Valor "Índice"

Útil para entender exactamente qué datos contiene una serie.`,
    inputSchema: {
      type: 'object',
      properties: {
        idSerie: { type: 'string', description: 'Código de la serie' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' }
      },
      required: ['idSerie']
    }
  },
  {
    name: 'ine_series_tabla',
    description: `Obtiene todas las series temporales contenidas en una tabla específica.

Relaciona tablas con series: una tabla puede contener múltiples series.

EJEMPLO: La tabla de IPC por comunidades autónomas contiene series para:
- Cada comunidad autónoma
- Cada tipo de índice
- Cada período

Puedes filtrar las series con el parámetro 'tv' (formato: ID_VARIABLE:ID_VALOR).`,
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string', description: 'ID de la tabla' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Formato de respuesta' },
        tv: { type: 'string', description: 'Filtro por variable (formato: ID_VARIABLE:ID_VALOR)' }
      },
      required: ['idTabla']
    }
  },
  {
    name: 'ine_serie_metadata_operacion',
    description: `Busca series temporales usando filtros de metadatos dentro de una operación.

Similar a ine_datos_metadata_operacion pero devuelve SERIES en lugar de datos.
Útil para encontrar códigos de series específicas antes de pedir sus datos.

EJEMPLO: Para encontrar la serie del IPC de transporte en Barcelona:
- idOperacion: "IPC"
- g1: "762:244082" (grupo ECOICOP: Transporte)
- g2: "70:8" (provincia: Barcelona)

La respuesta incluirá el código de la serie que coincide con esos filtros.`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        p: { type: 'number', description: 'Periodicidad: 1=mensual, 3=trimestral, 12=anual' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Formato de respuesta' },
        g1: { type: 'string', description: 'Filtro grupo 1 (formato: ID_VARIABLE:ID_VALOR)' },
        g2: { type: 'string', description: 'Filtro grupo 2' },
        g3: { type: 'string', description: 'Filtro grupo 3' },
        g4: { type: 'string', description: 'Filtro grupo 4' },
        g5: { type: 'string', description: 'Filtro grupo 5' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_periodicidades',
    description: `Lista todas las periodicidades disponibles en el INE.

PERIODICIDADES COMUNES:
- 1: Mensual (IPC, paro registrado)
- 3: Trimestral (EPA, PIB)
- 6: Semestral
- 12: Anual (censos, encuestas estructurales)

Cada estadística tiene una periodicidad que indica con qué frecuencia se publican nuevos datos.`,
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' }
      }
    }
  },
  {
    name: 'ine_publicaciones',
    description: `Lista todas las publicaciones estadísticas disponibles del INE.

Las publicaciones son documentos/informes que agrupan y presentan los datos de las operaciones.
Cada publicación tiene una fecha de difusión programada.

EJEMPLOS:
- Índice de Precios de Consumo (publicación mensual)
- Encuesta de Población Activa (publicación trimestral)
- Cifras de Población (publicación semestral)

Usa ine_publicacion_fecha_publicacion para ver las fechas de publicación.`,
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A'], description: 'A=formato amigable' }
      }
    }
  },
  {
    name: 'ine_publicaciones_operacion',
    description: `Obtiene las publicaciones asociadas a una operación estadística específica.

Una operación puede tener múltiples publicaciones con diferentes periodicidades o enfoques.

EJEMPLO: La operación "IPC" tiene publicaciones como:
- Índices nacionales mensuales
- Índices por comunidades autónomas
- Variaciones interanuales
- Notas de prensa`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A'], description: 'A=formato amigable' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_publicacion_fecha_publicacion',
    description: `Obtiene las fechas de difusión (calendario de publicación) para una publicación estadística.

Muestra cuándo se han publicado y se publicarán nuevos datos.
Útil para saber cuándo habrá datos actualizados disponibles.

Incluye:
- Fechas de publicaciones pasadas
- Fechas programadas de próximas publicaciones`,
    inputSchema: {
      type: 'object',
      properties: {
        idPublicacion: { type: 'string', description: 'ID de la publicación. Usa ine_publicaciones o ine_publicaciones_operacion para obtener IDs.' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A'], description: 'A=formato amigable' }
      },
      required: ['idPublicacion']
    }
  },
  {
    name: 'ine_clasificaciones',
    description: `Lista todas las clasificaciones estadísticas utilizadas por el INE.

Las clasificaciones son sistemas jerárquicos para organizar datos.

CLASIFICACIONES COMUNES:
- CNAE: Clasificación Nacional de Actividades Económicas
- ECOICOP: Clasificación del consumo (usada en el IPC)
- CNO: Clasificación Nacional de Ocupaciones
- NUTS: Nomenclatura de Unidades Territoriales
- CIE: Clasificación Internacional de Enfermedades

Cada clasificación tiene múltiples niveles de detalle.`,
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' }
      }
    }
  },
  {
    name: 'ine_clasificaciones_operacion',
    description: `Obtiene las clasificaciones utilizadas en una operación estadística específica.

Muestra qué sistemas de clasificación se usan para organizar los datos de esa operación.

EJEMPLOS:
- IPC usa ECOICOP (clasificación de productos de consumo)
- EPA usa CNO (clasificación de ocupaciones) y CNAE (actividades económicas)
- Comercio Exterior usa CNAE y clasificaciones arancelarias`,
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de la operación (ej: "IPC", "EPA")' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_valores_hijos',
    description: `Obtiene valores hijos en una estructura jerárquica de una variable.

Muchas variables del INE tienen estructuras de árbol (padre-hijo).

EJEMPLOS:
- Territorio: España → Comunidades Autónomas → Provincias → Municipios
- Actividad económica: Sector → División → Grupo → Clase
- Grupos ECOICOP: Grupo principal → Subgrupos

CASO DE USO:
Para obtener las provincias de Andalucía:
- idVariable: "70" (provincias/territorio)
- idValor: ID de Andalucía

Resultado: Almería, Cádiz, Córdoba, Granada, Huelva, Jaén, Málaga, Sevilla`,
    inputSchema: {
      type: 'object',
      properties: {
        idVariable: { type: 'string', description: 'ID de la variable jerárquica' },
        idValor: { type: 'string', description: 'ID del valor padre del que quieres obtener los hijos' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' }
      },
      required: ['idVariable', 'idValor']
    }
  }
];
