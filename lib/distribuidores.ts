// Listado de clientes / distribuidores autorizados de Amauta.
// Generado a partir del archivo de control interno de Comercializacion y Objetivos (CyO).
// Para actualizar: reemplazar este array. Es data estatica (no vive en la DB).

export type Distribuidor = {
  id: number
  nombre: string
  /** Texto libre: puede ser una fecha (dd/mm/aaaa) o una nota de estado del contrato. */
  fechaVenc: string
  /** "Si" | "No" | null */
  renovacion: string | null
  /** "Si" | "No" | null */
  autorizacion: string | null
  /** true = uso de marca autorizado (contrato firmado). */
  autorizado: boolean
  /** Observaciones internas. */
  nota: string | null
}

export const DISTRIBUIDORES: Distribuidor[] = [
  { id: 1, nombre: "1 DE ABRIL - LA MADRUGADA", fechaVenc: "30/03/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 2, nombre: "AGRO CENTROS REGION NUCLEO", fechaVenc: "24/06/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 3, nombre: "AGRO CHACRAS SAS", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 4, nombre: "AGRO GESTION DEL LITORAL SA", fechaVenc: "10/04/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 5, nombre: "AGRO LEBEN S.R.L", fechaVenc: "(NO HAY C A)", renovacion: null, autorizacion: "No", autorizado: false, nota: "falta CA" },
  { id: 6, nombre: "AGRO RINDES", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 7, nombre: "AGROAUSTRAL SRL", fechaVenc: "15/07/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 8, nombre: "AGROEMPRESA COLON S.A.", fechaVenc: "30/05/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 9, nombre: "AGROFAM", fechaVenc: "En proceso de firma", renovacion: null, autorizacion: null, autorizado: false, nota: null },
  { id: 10, nombre: "AGROFERT ARGENTINA S.A.", fechaVenc: "19/09/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 11, nombre: "Agroinsumos ByL", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 12, nombre: "Agrolajitas", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 13, nombre: "Agromatorrales", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 14, nombre: "AGRONASAJA SRL", fechaVenc: "15/07/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 15, nombre: "AGRONEGOCIOS S. E. SAS", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 16, nombre: "AGRONOMIA GENERAL CABRERA", fechaVenc: "(NO HAY CO NI CA FIRMADAS-NO FIRM)", renovacion: null, autorizacion: "No", autorizado: false, nota: "en tramite - reclamamos" },
  { id: 17, nombre: "AGRONOMIA LAS ROSAS S.A.", fechaVenc: "14/05/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 18, nombre: "AGROPACK INSUMOS S.R.L.", fechaVenc: "31/08/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 19, nombre: "AGROTECNOLOGIA Y SERVICIOS S.A.", fechaVenc: "(NO HAY C A)", renovacion: null, autorizacion: "No", autorizado: false, nota: "???" },
  { id: 20, nombre: "ALARCIA MARTIN ALBERTO", fechaVenc: "28/07/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 21, nombre: "Alborada", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 22, nombre: "Alea y Cia", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 23, nombre: "ATS", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 24, nombre: "Bertone", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 25, nombre: "BINDU SRL", fechaVenc: "19/06/2025", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 26, nombre: "BRUFOR AGRO S.R.L", fechaVenc: "30/05/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 27, nombre: "BTB SEEDS", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 28, nombre: "CAIO BIBILONI Y CIA SRL", fechaVenc: "11/03/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 29, nombre: "CAMEL AGRO SRL", fechaVenc: "11/06/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 30, nombre: "Campo fertil", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 31, nombre: "Campo Negocios", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 32, nombre: "CANO", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 33, nombre: "Caverzasi", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 34, nombre: "Cereales Dec", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 35, nombre: "CHIARAVIGLIO", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 36, nombre: "Cn Agro", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 37, nombre: "COMPAÑÍA DE INSUMOS Y GRANOS  S.A", fechaVenc: "(NO HAY CO NI CA FIRMADAS)", renovacion: null, autorizacion: null, autorizado: false, nota: "Este no sé de donde salió Mai - me mostras?" },
  { id: 38, nombre: "Cooperativa Agrícola Lucienville Ltda.", fechaVenc: "22/09/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 39, nombre: "CRISOPA", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 40, nombre: "Dario Bouvet (Agrocampo)", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 41, nombre: "Daser", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 42, nombre: "DELYAR S.A", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 43, nombre: "DISTRIBUIDORA ROYJO SRL", fechaVenc: "02/10/2025", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 44, nombre: "DSA Servicios S.R.L", fechaVenc: "30/05/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 45, nombre: "DV AGRO S.A.", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 46, nombre: "EDP AGROINDUSTRIAL S.A.", fechaVenc: "27/06/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 47, nombre: "E-GRAIN S.A.", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 48, nombre: "EL ALAMO S.R.L.", fechaVenc: "08/09/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 49, nombre: "EL LADERO", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 50, nombre: "ERNESTO Y HORACIO SCHANG S.R.L.", fechaVenc: "27/04/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 51, nombre: "ESTACION 226 AGRO SRL", fechaVenc: "02/07/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 52, nombre: "Euskal Agro", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 53, nombre: "Gea Agronegocios SRL", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 54, nombre: "GEAR", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 55, nombre: "GENETICA Y AGROINSUMOS", fechaVenc: "17/12/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 56, nombre: "GERMINARE SRL", fechaVenc: "13/10/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 57, nombre: "Gesta Agropecuaria SRL", fechaVenc: "08/09/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 58, nombre: "GRA-FER", fechaVenc: "30/08/2025", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 59, nombre: "GRAFER S.R.L.", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 60, nombre: "IF INGENIERA EN FERTILIZANTES S.A.", fechaVenc: "11/12/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 61, nombre: "INTEGRAL AGROPECUARIA S.R.L.", fechaVenc: "19/09/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 62, nombre: "LA NUEVA AGROPULSO", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 63, nombre: "La Rural", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 64, nombre: "LABORATORIOS CKC ARGENTINA S.A.", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 65, nombre: "LARTIRIGOYEN Y CÍA. SA", fechaVenc: "14/07/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 66, nombre: "LAS LAGUNAS", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 67, nombre: "LAS MARTINAS SRL", fechaVenc: "26/08/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 68, nombre: "LDC", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 69, nombre: "LEPORATI Y COMPAÑÍA S.A.", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 70, nombre: "LOMAS AGRO INSUMOS", fechaVenc: "(NO HAY CO NI CA FIRMADAS)", renovacion: null, autorizacion: null, autorizado: false, nota: "en tramite - reclamamos" },
  { id: 71, nombre: "Losinno Rafael Ignacio", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 72, nombre: "LUJAN AGRICOLA S.R.L.", fechaVenc: "26/08/2025", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 73, nombre: "MAS AGRO CENTRO S.A.S", fechaVenc: "30/05/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 74, nombre: "MAS SEMILLAS", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 75, nombre: "NACSA", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 76, nombre: "PA QUE RINDA INSUMOS AGROPECUARIOS S.A.S", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 77, nombre: "PAMPA CROPS", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 78, nombre: "Peripherial Agroinsumos", fechaVenc: "En proceso de firma", renovacion: null, autorizacion: null, autorizado: false, nota: null },
  { id: 79, nombre: "RASA AGRO", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 80, nombre: "RAYSER AGRO SRL", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 81, nombre: "ROBERTO AMSLER S.A.C", fechaVenc: "18/03/2027", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 82, nombre: "SINER S.A.", fechaVenc: "01/09/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 83, nombre: "SINERGIZAGRO", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 84, nombre: "SOLUCIONES ALDEBARAN AGRO SRL", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 85, nombre: "Tecnocampo", fechaVenc: "19/06/2020", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 86, nombre: "Tecnoplant", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 87, nombre: "TERRA VERDE", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 88, nombre: "TERRAMAIZE S.A.", fechaVenc: "08/09/2026", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
  { id: 89, nombre: "Vicentin", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 90, nombre: "VILLA ENRIQUE", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 91, nombre: "ZANELLATO", fechaVenc: "No hay contrato", renovacion: "No", autorizacion: "No", autorizado: false, nota: null },
  { id: 92, nombre: "ZONA RURAL SRL", fechaVenc: "tenemos modelo anterior firmado - reclamamos nuevo modelo", renovacion: "Sí", autorizacion: "Sí", autorizado: true, nota: null },
]

export const DISTRIBUIDORES_STATS = {
  total: DISTRIBUIDORES.length,
  autorizados: DISTRIBUIDORES.filter((d) => d.autorizado).length,
  noAutorizados: DISTRIBUIDORES.filter((d) => !d.autorizado).length,
}
