/**
 * Ejemplos de uso del MCP INE Server
 * Ejecutar con: node dist/examples.js
 */

const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'http://localhost:3000/mcp/v1';

/**
 * Función helper para llamar al servidor MCP usando fetch estándar
 */
async function callMCPTool(toolName: string, args: any = {}) {
  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        },
        id: Date.now()
      })
    });

    return (await response.json()) as any;
  } catch (error: any) {
    console.error(`Error llamando a ${toolName}:`, error.message);
    return null;
  }
}

/**
 * Ejemplo 1: Obtener últimos datos del IPC
 */
async function ejemplo1_datosIPC() {
  console.log('\n📊 Ejemplo 1: Últimos datos del IPC\n');

  const result = await callMCPTool('ine_datos_serie', {
    idSerie: 'IPC251856',
    nult: 12,
    tip: 'A',
    idioma: 'ES'
  });

  if (result?.result?.content?.[0]?.text) {
    console.log(JSON.parse(result.result.content[0].text));
  }
}

/**
 * Ejemplo 2: Listar operaciones disponibles
 */
async function ejemplo2_operaciones() {
  console.log('\n📋 Ejemplo 2: Operaciones Disponibles\n');

  const result = await callMCPTool('ine_operaciones_disponibles', {
    idioma: 'ES',
    geo: 0,
    det: 1
  });

  if (result?.result?.content?.[0]?.text) {
    const data = JSON.parse(result.result.content[0].text);
    console.log(`Total de operaciones: ${data.data?.length || 0}`);
    console.log('Primeras 5 operaciones:');
    data.data?.slice(0, 5).forEach((op: any) => {
      console.log(`- ${op.Nombre} (${op.Id})`);
    });
  }
}

/**
 * Ejemplo 3: Obtener variables de la operación IPC
 */
async function ejemplo3_variablesIPC() {
  console.log('\n🏷️ Ejemplo 3: Variables de la Operación IPC\n');

  const result = await callMCPTool('ine_variables_operacion', {
    idOperacion: 'IPC',
    idioma: 'ES'
  });

  if (result?.result?.content?.[0]?.text) {
    const data = JSON.parse(result.result.content[0].text);
    console.log('Variables del IPC:');
    data.data?.slice(0, 10).forEach((variable: any) => {
      console.log(`- ${variable.Nombre} (ID: ${variable.Id})`);
    });
  }
}

/**
 * Ejemplo 4: Obtener datos de una tabla
 */
async function ejemplo4_datosTabla() {
  console.log('\n📈 Ejemplo 4: Datos de Tabla 50902\n');

  const result = await callMCPTool('ine_datos_tabla', {
    idTabla: '50902',
    nult: 3,
    tip: 'A',
    idioma: 'ES'
  });

  if (result?.result?.content?.[0]?.text) {
    const data = JSON.parse(result.result.content[0].text);
    console.log('Últimos 3 períodos de la tabla 50902:');
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Ejemplo 5: Obtener información de una operación
 */
async function ejemplo5_infoOperacion() {
  console.log('\n📖 Ejemplo 5: Información de la Operación IPC\n');

  const result = await callMCPTool('ine_operacion', {
    idOperacion: 'IPC',
    det: 2,
    idioma: 'ES'
  });

  if (result?.result?.content?.[0]?.text) {
    const data = JSON.parse(result.result.content[0].text);
    console.log('Información del IPC:');
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Ejemplo 6: Buscar series con filtros
 */
async function ejemplo6_seriesConFiltros() {
  console.log('\n🔍 Ejemplo 6: Series del IPC con Filtros\n');

  const result = await callMCPTool('ine_datos_metadata_operacion', {
    idOperacion: 'IPC',
    p: 1, // Periodicidad mensual
    nult: 1,
    g1: '115:29', // Madrid
    g2: '3:84', // Variación mensual
    tip: 'A',
    idioma: 'ES'
  });

  if (result?.result?.content?.[0]?.text) {
    const data = JSON.parse(result.result.content[0].text);
    console.log('Datos del IPC para Madrid:');
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Ejemplo 7: Listar herramientas disponibles
 */
async function ejemplo7_listarHerramientas() {
  console.log('\n🛠️ Ejemplo 7: Herramientas MCP Disponibles\n');

  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 1
      })
    });

    const data: any = await response.json();
    const listado = data.result.tools;
    console.log(`Total de herramientas: ${listado.length}\n`);

    listado.forEach((tool: any) => {
      console.log(`- ${tool.name}`);
      console.log(`  ${tool.description}`);
      console.log('');
    });
  } catch (error: any) {
    console.error('Error listando herramientas:', error.message);
  }
}

/**
 * Ejemplo 8: Obtener periodicidades
 */
async function ejemplo8_periodicidades() {
  console.log('\n⏰ Ejemplo 8: Periodicidades Disponibles\n');

  const result = await callMCPTool('ine_periodicidades', {
    idioma: 'ES'
  });

  if (result?.result?.content?.[0]?.text) {
    const data = JSON.parse(result.result.content[0].text);
    console.log('Periodicidades:');
    data.data?.forEach((per: any) => {
      console.log(`- ${per.Nombre} (ID: ${per.Id})`);
    });
  }
}

/**
 * Ejecutar todos los ejemplos
 */
async function ejecutarTodos() {
  console.log('='.repeat(60));
  console.log('  EJEMPLOS DE USO DEL MCP INE SERVER');
  console.log('='.repeat(60));
  console.log(`\n⚠️  Asegúrate de que el servidor esté corriendo en el puerto 3000`);
  console.log('   Comando: npm start (o npm run dev:worker para probar el Worker)\n');

  // Verificar que el servidor esté activo
  try {
    const healthUrl = MCP_ENDPOINT.replace(/\/mcp.*$/, '/health');
    const res = await fetch(healthUrl);
    if (!res.ok) throw new Error(`status ${res.status}`);
    console.log('✅ Servidor MCP INE activo\n');
  } catch (error) {
    console.error('❌ Error: El servidor no está activo. Inicia el servidor con: npm start');
    process.exit(1);
  }

  await ejemplo7_listarHerramientas();
  await ejemplo1_datosIPC();
  await ejemplo2_operaciones();
  await ejemplo3_variablesIPC();
  await ejemplo4_datosTabla();
  await ejemplo5_infoOperacion();
  await ejemplo8_periodicidades();
  await ejemplo6_seriesConFiltros();

  console.log('\n' + '='.repeat(60));
  console.log('  FIN DE LOS EJEMPLOS');
  console.log('='.repeat(60));
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ejecutarTodos().catch(console.error);
}

export {
  callMCPTool,
  ejemplo1_datosIPC,
  ejemplo2_operaciones,
  ejemplo3_variablesIPC,
  ejemplo4_datosTabla,
  ejemplo5_infoOperacion,
  ejemplo6_seriesConFiltros,
  ejemplo7_listarHerramientas,
  ejemplo8_periodicidades
};