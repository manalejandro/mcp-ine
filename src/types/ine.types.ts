/**
 * Tipos para la API del INE
 */

export type Idioma = 'ES' | 'EN';

export interface INEBaseParams {
  det?: 0 | 1 | 2;
  tip?: 'A' | 'M' | 'AM';
}

export interface DatosTablaParams extends INEBaseParams {
  nult?: number;
  tv?: string;
  date?: string;
}

export interface DatosSerieParams extends INEBaseParams {
  nult?: number;
  date?: string;
}

export interface DatosMetadataOperacionParams extends INEBaseParams {
  p?: number;
  nult?: number;
  g1?: string;
  g2?: string;
  g3?: string;
  g4?: string;
  g5?: string;
}

export interface OperacionesDisponiblesParams extends INEBaseParams {
  geo?: 0 | 1;
  page?: number;
}

export interface OperacionParams extends INEBaseParams {}

export interface VariablesParams {
  page?: number;
}

export interface VariablesOperacionParams {
  page?: number;
}

export interface ValoresVariableParams extends INEBaseParams {
  clasif?: number;
}

export interface ValoresVariableOperacionParams extends INEBaseParams {}

export interface TablasOperacionParams extends INEBaseParams {
  geo?: 0 | 1;
  tip?: 'A';
}

export interface ValoresGruposTablaParams extends INEBaseParams {}

export interface SerieParams extends INEBaseParams {
  tip?: 'A' | 'M' | 'AM';
}

export interface SeriesOperacionParams extends INEBaseParams {
  tip?: 'A' | 'M' | 'AM';
  page?: number;
}

export interface ValoresSerieParams extends INEBaseParams {}

export interface SeriesTablaParams extends INEBaseParams {
  tip?: 'A' | 'M' | 'AM';
  tv?: string;
}

export interface SerieMetadataOperacionParams extends INEBaseParams {
  p?: number;
  tip?: 'A' | 'M' | 'AM';
  g1?: string;
  g2?: string;
  g3?: string;
  g4?: string;
  g5?: string;
}

export interface PublicacionesParams extends INEBaseParams {
  tip?: 'A';
}

export interface PublicacionesOperacionParams extends INEBaseParams {
  tip?: 'A';
}

export interface PublicacionFechaPublicacionParams extends INEBaseParams {
  tip?: 'A';
}

export interface ValoresHijosParams extends INEBaseParams {}

// Respuestas de la API
export interface INEResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

export interface Operacion {
  Id: number;
  Codigo: string;
  Nombre: string;
  COD_IOE?: string;
}

export interface Variable {
  Id: number;
  Nombre: string;
  Codigo?: string;
}

export interface Valor {
  Id: number;
  Nombre: string;
  Codigo?: string;
  Fk_Variable?: number;
}

export interface Serie {
  COD: string;
  Nombre: string;
  FK_Operacion?: number;
  FK_Periodicidad?: number;
  FK_Publicacion?: number;
  FK_Unidad?: number;
  FK_Escala?: number;
}

export interface Tabla {
  Id: number;
  Nombre: string;
  Codigo?: string;
  FK_Operacion?: number;
  FK_Periodicidad?: number;
}

export interface Dato {
  Fecha: string;
  Valor: number | string;
  Anyo?: number;
  NombrePeriodo?: string;
}

export interface Periodicidad {
  Id: number;
  Nombre: string;
  Codigo?: string;
}

export interface Publicacion {
  Id: number;
  Nombre: string;
  FK_Periodicidad?: number;
}

export interface Clasificacion {
  Id: number;
  Nombre: string;
  Fecha?: string;
}

export interface Grupo {
  Id: number;
  Nombre: string;
}
