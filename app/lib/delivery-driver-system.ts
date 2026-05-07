export type DriverStatus = 'off' | 'standby' | 'assigned' | 'delivering';
export type DeliveryOrderStatus = 'waiting_driver' | 'assigned' | 'delivering' | 'completed';

export interface DriverRow {
  id: string;
  telegram_id: string | null;
  telegram_username: string | null;
  nama_driver: string;
  kode_driver: string | null;
  nomor_wa: string | null;
  is_verified: boolean | null;
  status: DriverStatus | null;
}

export interface DeliveryOrderRow {
  id: string;
  order_code: string | null;
  customer_name: string | null;
  customer_wa: string | null;
  items: string | null;
  total_price: number | null;
  delivery_fee: number | null;
  distance_km: number | null;
  maps_link: string | null;
  note_driver: string | null;
  status: DeliveryOrderStatus | null;
  assigned_driver: string | null;
}

export interface DeliveryOrderCreatePayload {
  orderCode: string;
  customerName: string;
  customerWhatsapp: string;
  items: string;
  totalPrice: number;
  deliveryFee: number;
  distanceKm: number;
  mapsLink: string;
  noteDriver: string;
}

export interface DriverRegistrationSession {
  step: 'await_name' | 'await_code' | 'await_whatsapp' | 'await_initial_status';
  namaDriver?: string;
  kodeDriver?: string;
  nomorWa?: string;
  telegramUsername?: string;
}

const globalStore = globalThis as typeof globalThis & {
  __driverRegistrationSessions?: Map<string, DriverRegistrationSession>;
};

export function getDriverRegistrationSessions() {
  if (!globalStore.__driverRegistrationSessions) {
    globalStore.__driverRegistrationSessions = new Map<string, DriverRegistrationSession>();
  }

  return globalStore.__driverRegistrationSessions;
}

export function getDriverStatusKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: 'OFF', callback_data: 'driver_status:off' },
        { text: 'STANDBY', callback_data: 'driver_status:standby' },
      ],
    ],
  };
}

export function getTakeOrderKeyboard(orderId: string) {
  return {
    inline_keyboard: [[{ text: 'AMBIL PESANAN', callback_data: `delivery_take:${orderId}` }]],
  };
}

export function getAssignedOrderKeyboard(orderId: string) {
  return {
    inline_keyboard: [[{ text: 'MULAI ANTAR', callback_data: `delivery_start:${orderId}` }]],
  };
}

export function getDeliveringOrderKeyboard(orderId: string) {
  return {
    inline_keyboard: [[{ text: 'SELESAI DIANTAR', callback_data: `delivery_complete:${orderId}` }]],
  };
}

export function calculateEtaMinutes(distanceKm: number) {
  return Math.max(5, Math.ceil(distanceKm * 5));
}

export function formatDeliveryOrderBroadcast(order: DeliveryOrderRow) {
  const etaMinutes = calculateEtaMinutes(Number(order.distance_km || 0));

  return [
    '🚨 ORDER BARU',
    order.order_code || '-',
    '',
    `Nama: ${order.customer_name || '-'}`,
    `Pesanan:\n${order.items || '-'}`,
    `Jarak: ${Number(order.distance_km || 0).toFixed(2)} km`,
    `ETA: ${etaMinutes} menit`,
    `Lokasi: ${order.maps_link || '-'}`,
  ].join('\n');
}
