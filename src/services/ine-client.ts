import axios, { AxiosInstance } from 'axios';
import type {
  Idioma,
  DatosTablaParams,
  DatosSerieParams,
  DatosMetadataOperacionParams,
  OperacionesDisponiblesParams,
  OperacionParams,
  VariablesParams,
  VariablesOperacionParams,
  ValoresVariableParams,
  ValoresVariableOperacionParams,
  TablasOperacionParams,
  ValoresGruposTablaParams,
  SerieParams,
  SeriesOperacionParams,
  ValoresSerieParams,
  SeriesTablaParams,
  SerieMetadataOperacionParams,
  PublicacionesParams,
  PublicacionesOperacionParams,
  PublicacionFechaPublicacionParams,
  ValoresHijosParams,
  INEResponse
} from '../types/ine.types.js';

/**
 * Cliente para la API del INE
 */
export class INEClient {
  private readonly baseURL = 'https://servicios.ine.es/wstempus/js';
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MCP-INE-Server/1.0'
      }
    });
  }

  /**
   * Construye la URL con parámetros, excluyendo parámetros que ya están en la ruta
   */
  private buildURL(
    idioma: Idioma, 
    funcion: string, 
    input?: string, 
    params?: Record<string, any>,
    excludeParams?: string[]
  ): string {
    let url = `/${idioma}/${funcion}`;
    if (input) {
      url += `/${input}`;
    }
    
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      const paramsToExclude = new Set([
        'idioma', // Siempre excluir idioma (está en la ruta)
        ...(excludeParams || [])
      ]);
      
      Object.entries(params).forEach(([key, value]) => {
        // Solo agregar si no está en la lista de exclusión y tiene valor
        if (value !== undefined && value !== null && !paramsToExclude.has(key)) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  /**
   * Realiza una petición GET a la API
   */
  private async get<T>(url: string): Promise<INEResponse<T>> {
    try {
      const fullUrl = `${this.baseURL}${url}`;
      console.log(`INE API Request: ${fullUrl}`);
      const response = await this.client.get<T>(url);
      return {
        data: response.data,
        success: true
      };
    } catch (error: any) {
      const fullUrl = `${this.baseURL}${url}`;
      let errorMessage = error.message || 'Error desconocido';
      
      // Proporcionar mensajes de error más útiles
      if (error.response?.status === 404) {
        errorMessage = `Recurso no encontrado (404). La URL solicitada no existe: ${fullUrl}. ` +
          `Verifica que el ID proporcionado sea correcto. ` +
          `Usa 'ine_operaciones_disponibles' para listar operaciones disponibles, ` +
          `o 'ine_tablas_operacion' para listar las tablas de una operación específica.`;
      } else if (error.response?.status === 400) {
        errorMessage = `Solicitud incorrecta (400). Los parámetros enviados no son válidos: ${fullUrl}`;
      } else if (error.response?.status >= 500) {
        errorMessage = `Error del servidor INE (${error.response.status}). El servicio podría estar temporalmente no disponible.`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = `Tiempo de espera agotado. El servidor INE no respondió en 30 segundos.`;
      }
      
      console.error(`INE API Error: ${errorMessage}`);
      
      return {
        data: null as any,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * DATOS_TABLA - Obtener datos para una tabla específica
   */
  async getDatosTabla(idTabla: string, params?: DatosTablaParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'DATOS_TABLA', idTabla, params, ['idTabla']);
    return this.get(url);
  }

  /**
   * DATOS_SERIE - Obtener datos para una serie específica
   */
  async getDatosSerie(idSerie: string, params?: DatosSerieParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'DATOS_SERIE', idSerie, params, ['idSerie']);
    return this.get(url);
  }

  /**
   * DATOS_METADATAOPERACION - Obtener datos de series usando filtros
   */
  async getDatosMetadataOperacion(idOperacion: string, params?: DatosMetadataOperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'DATOS_METADATAOPERACION', idOperacion, params, ['idOperacion']);
    return this.get(url);
  }

  /**
   * OPERACIONES_DISPONIBLES - Obtener todas las operaciones disponibles
   */
  async getOperacionesDisponibles(params?: OperacionesDisponiblesParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'OPERACIONES_DISPONIBLES', undefined, params);
    return this.get(url);
  }

  /**
   * OPERACION - Obtener una operación específica
   */
  async getOperacion(idOperacion: string, params?: OperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'OPERACION', idOperacion, params, ['idOperacion']);
    return this.get(url);
  }

  /**
   * VARIABLES - Obtener todas las variables disponibles
   */
  async getVariables(params?: VariablesParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'VARIABLES', undefined, params);
    return this.get(url);
  }

  /**
   * VARIABLES_OPERACION - Obtener variables de una operación
   */
  async getVariablesOperacion(idOperacion: string, params?: VariablesOperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'VARIABLES_OPERACION', idOperacion, params, ['idOperacion']);
    return this.get(url);
  }

  /**
   * VALORES_VARIABLE - Obtener valores de una variable
   */
  async getValoresVariable(idVariable: string, params?: ValoresVariableParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'VALORES_VARIABLE', idVariable, params, ['idVariable']);
    return this.get(url);
  }

  /**
   * VALORES_VARIABLEOPERACION - Obtener valores de una variable en una operación
   */
  async getValoresVariableOperacion(idVariable: string, idOperacion: string, params?: ValoresVariableOperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'VALORES_VARIABLEOPERACION', `${idVariable}/${idOperacion}`, params, ['idVariable', 'idOperacion']);
    return this.get(url);
  }

  /**
   * TABLAS_OPERACION - Obtener tablas de una operación
   */
  async getTablasOperacion(idOperacion: string, params?: TablasOperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'TABLAS_OPERACION', idOperacion, params, ['idOperacion']);
    return this.get(url);
  }

  /**
   * GRUPOS_TABLA - Obtener grupos de una tabla
   */
  async getGruposTabla(idTabla: string, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'GRUPOS_TABLA', idTabla, undefined, ['idTabla']);
    return this.get(url);
  }

  /**
   * VALORES_GRUPOSTABLA - Obtener valores de un grupo de tabla
   */
  async getValoresGruposTabla(idTabla: string, idGrupo: string, params?: ValoresGruposTablaParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'VALORES_GRUPOSTABLA', `${idTabla}/${idGrupo}`, params, ['idTabla', 'idGrupo']);
    return this.get(url);
  }

  /**
   * SERIE - Obtener información de una serie
   */
  async getSerie(idSerie: string, params?: SerieParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'SERIE', idSerie, params, ['idSerie']);
    return this.get(url);
  }

  /**
   * SERIES_OPERACION - Obtener series de una operación
   */
  async getSeriesOperacion(idOperacion: string, params?: SeriesOperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'SERIES_OPERACION', idOperacion, params, ['idOperacion']);
    return this.get(url);
  }

  /**
   * VALORES_SERIE - Obtener valores y variables que definen una serie
   */
  async getValoresSerie(idSerie: string, params?: ValoresSerieParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'VALORES_SERIE', idSerie, params, ['idSerie']);
    return this.get(url);
  }

  /**
   * SERIES_TABLA - Obtener series de una tabla
   */
  async getSeriesTabla(idTabla: string, params?: SeriesTablaParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'SERIES_TABLA', idTabla, params, ['idTabla']);
    return this.get(url);
  }

  /**
   * SERIE_METADATAOPERACION - Obtener series con filtros de metadata
   */
  async getSerieMetadataOperacion(idOperacion: string, params?: SerieMetadataOperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'SERIE_METADATAOPERACION', idOperacion, params, ['idOperacion']);
    return this.get(url);
  }

  /**
   * PERIODICIDADES - Obtener periodicidades disponibles
   */
  async getPeriodicidades(idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'PERIODICIDADES');
    return this.get(url);
  }

  /**
   * PUBLICACIONES - Obtener publicaciones disponibles
   */
  async getPublicaciones(params?: PublicacionesParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'PUBLICACIONES', undefined, params);
    return this.get(url);
  }

  /**
   * PUBLICACIONES_OPERACION - Obtener publicaciones de una operación
   */
  async getPublicacionesOperacion(idOperacion: string, params?: PublicacionesOperacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'PUBLICACIONES_OPERACION', idOperacion, params, ['idOperacion']);
    return this.get(url);
  }

  /**
   * PUBLICACIONFECHA_PUBLICACION - Obtener fechas de publicación
   */
  async getPublicacionFechaPublicacion(idPublicacion: string, params?: PublicacionFechaPublicacionParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'PUBLICACIONFECHA_PUBLICACION', idPublicacion, params, ['idPublicacion']);
    return this.get(url);
  }

  /**
   * CLASIFICACIONES - Obtener clasificaciones disponibles
   */
  async getClasificaciones(idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'CLASIFICACIONES');
    return this.get(url);
  }

  /**
   * CLASIFICACIONES_OPERACION - Obtener clasificaciones de una operación
   */
  async getClasificacionesOperacion(idOperacion: string, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'CLASIFICACIONES_OPERACION', idOperacion, undefined, ['idOperacion']);
    return this.get(url);
  }

  /**
   * VALORES_HIJOS - Obtener valores hijos en estructura jerárquica
   */
  async getValoresHijos(idVariable: string, idValor: string, params?: ValoresHijosParams, idioma: Idioma = 'ES') {
    const url = this.buildURL(idioma, 'VALORES_HIJOS', `${idVariable}/${idValor}`, params, ['idVariable', 'idValor']);
    return this.get(url);
  }
}

// Exportar instancia singleton
export const ineClient = new INEClient();
