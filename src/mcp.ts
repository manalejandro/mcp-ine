import { ineClient } from './services/ine-client.js';
import { tools, SERVER_INFO, SERVER_INSTRUCTIONS } from './tools.js';
import type { Idioma } from './types/ine.types.js';

/**
 * Versiones del protocolo MCP soportadas.
 * Se negocia la versión en el handshake de 'initialize'.
 */
export const SUPPORTED_PROTOCOL_VERSIONS = [
  '2024-11-05',
  '2025-03-26',
  '2025-06-18',
  '2025-11-25',
] as const;

export const LATEST_PROTOCOL_VERSION: string = SUPPORTED_PROTOCOL_VERSIONS[SUPPORTED_PROTOCOL_VERSIONS.length - 1];

/**
 * Negocia la versión de protocolo MCP.
 * Devuelve la versión solicitada si está soportada; en caso contrario la más reciente soportada.
 */
export function negotiateProtocolVersion(requested?: string): string {
  if (requested && (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)) {
    return requested;
  }
  return LATEST_PROTOCOL_VERSION;
}

export interface McpInitializeParams {
  protocolVersion?: string;
  capabilities?: Record<string, unknown>;
  clientInfo?: { name?: string; version?: string };
}

/**
 * Construye el resultado del método 'initialize'.
 */
export function buildInitializeResult(params?: McpInitializeParams) {
  return {
    protocolVersion: negotiateProtocolVersion(params?.protocolVersion),
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
    },
    instructions: SERVER_INSTRUCTIONS,
  };
}

/**
 * Maneja las llamadas a las herramientas MCP.
 * Nunca lanza: siempre devuelve un objeto { result } o { error } listo para el cliente MCP.
 */
export async function runToolCall(name: string, rawArgs: Record<string, unknown>): Promise<{
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  structuredContent?: unknown;
}> {
  const args = rawArgs || {};
  const idioma = (args.idioma || 'ES') as Idioma;

  try {
    let result: unknown;

    switch (name) {
      case 'ine_datos_tabla':
        result = await ineClient.getDatosTabla(String(args.idTabla ?? ''), args, idioma);
        break;
      case 'ine_datos_serie':
        result = await ineClient.getDatosSerie(String(args.idSerie ?? ''), args, idioma);
        break;
      case 'ine_datos_metadata_operacion':
        result = await ineClient.getDatosMetadataOperacion(String(args.idOperacion ?? ''), args, idioma);
        break;
      case 'ine_operaciones_disponibles':
        result = await ineClient.getOperacionesDisponibles(args, idioma);
        break;
      case 'ine_operacion':
        result = await ineClient.getOperacion(String(args.idOperacion ?? ''), args, idioma);
        break;
      case 'ine_variables':
        result = await ineClient.getVariables(args, idioma);
        break;
      case 'ine_variables_operacion':
        result = await ineClient.getVariablesOperacion(String(args.idOperacion ?? ''), args, idioma);
        break;
      case 'ine_valores_variable':
        result = await ineClient.getValoresVariable(String(args.idVariable ?? ''), args, idioma);
        break;
      case 'ine_valores_variable_operacion':
        result = await ineClient.getValoresVariableOperacion(
          String(args.idVariable ?? ''),
          String(args.idOperacion ?? ''),
          args,
          idioma
        );
        break;
      case 'ine_tablas_operacion':
        result = await ineClient.getTablasOperacion(String(args.idOperacion ?? ''), args, idioma);
        break;
      case 'ine_grupos_tabla':
        result = await ineClient.getGruposTabla(String(args.idTabla ?? ''), idioma);
        break;
      case 'ine_valores_grupos_tabla':
        result = await ineClient.getValoresGruposTabla(
          String(args.idTabla ?? ''),
          String(args.idGrupo ?? ''),
          args,
          idioma
        );
        break;
      case 'ine_serie':
        result = await ineClient.getSerie(String(args.idSerie ?? ''), args, idioma);
        break;
      case 'ine_series_operacion':
        result = await ineClient.getSeriesOperacion(String(args.idOperacion ?? ''), args, idioma);
        break;
      case 'ine_valores_serie':
        result = await ineClient.getValoresSerie(String(args.idSerie ?? ''), args, idioma);
        break;
      case 'ine_series_tabla':
        result = await ineClient.getSeriesTabla(String(args.idTabla ?? ''), args, idioma);
        break;
      case 'ine_serie_metadata_operacion':
        result = await ineClient.getSerieMetadataOperacion(String(args.idOperacion ?? ''), args, idioma);
        break;
      case 'ine_periodicidades':
        result = await ineClient.getPeriodicidades(idioma);
        break;
      case 'ine_publicaciones':
        result = await ineClient.getPublicaciones(args, idioma);
        break;
      case 'ine_publicaciones_operacion':
        result = await ineClient.getPublicacionesOperacion(String(args.idOperacion ?? ''), args, idioma);
        break;
      case 'ine_publicacion_fecha_publicacion':
        result = await ineClient.getPublicacionFechaPublicacion(String(args.idPublicacion ?? ''), args, idioma);
        break;
      case 'ine_clasificaciones':
        result = await ineClient.getClasificaciones(idioma);
        break;
      case 'ine_clasificaciones_operacion':
        result = await ineClient.getClasificacionesOperacion(String(args.idOperacion ?? ''), idioma);
        break;
      case 'ine_valores_hijos':
        result = await ineClient.getValoresHijos(
          String(args.idVariable ?? ''),
          String(args.idValor ?? ''),
          args,
          idioma
        );
        break;
      default:
        return {
          content: [{ type: 'text', text: JSON.stringify({
            error: true,
            message: `Herramienta desconocida: ${name}`
          }, null, 2) }],
          isError: true
        };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        error: true,
        message: error?.message || 'Error interno al ejecutar la herramienta',
        tool: name
      }, null, 2) }],
      isError: true
    };
  }
}