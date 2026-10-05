export const normalizarEstadoPedido = (estado: string | null | undefined): string => {
  switch (estado?.trim().toLowerCase()) {
    case 'en cocina':
      return 'preparando';
    case 'en camino':
      return 'en_camino';
    default:
      return estado?.trim().toLowerCase() || 'pendiente';
  }
};

export const esEstadoFinalizado = (estado: string | null | undefined): boolean =>
  ['entregado', 'cancelado'].includes(normalizarEstadoPedido(estado));

export const esEstadoActivo = (estado: string | null | undefined): boolean =>
  ['pendiente', 'pago_pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'].includes(
    normalizarEstadoPedido(estado)
  );
