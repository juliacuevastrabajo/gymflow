import type { TipoMultimediaEjercicio } from "../../services/gymflowService";

export type RutinaEjercicioApp = {
  id: number;
  rutinaId?: number;
  orden?: number;
  series?: number | null;
  repeticiones?: string | null;
  descansoSegundos?: number | null;
  peso?: number | null;
  notas?: string | null;
  ejercicio?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    tipoMultimedia?: TipoMultimediaEjercicio | null;
    multimediaUrl?: string | null;
  } | null;
};

export type RutinaApp = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  nivel?: string | null;
  duracionEstimadaMinutos?: number | null;
  nombreCreador?: string | null;
  creadorId?: number | null;
  activa?: boolean;
  totalAsignacionesActivas?: number;
  ejercicios?: RutinaEjercicioApp[];
};

export type EjercicioApp = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipoMultimedia?: TipoMultimediaEjercicio | null;
  multimediaUrl?: string | null;
};

export type RutinaAsignadaApp = {
  id: number;
  rutinaId: number;
  clienteId: number;
  nombreCliente?: string | null;
  entrenadorId?: number | null;
  nombreEntrenador?: string | null;
  fechaAsignacion?: string | null;
  activa?: boolean;
  rutina?: RutinaApp | null;
};
