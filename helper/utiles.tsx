import { LocationObject } from "expo-location";
import { LatLng } from "react-native-maps";
import tw from "twrnc"
import * as Clipboard from 'expo-clipboard';

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export const deg2rad = (deg: number): number => deg * (Math.PI / 180);

export const formatDistance = (distance: number | null): string => {
  if (distance === null) return '';
  return distance < 1 ? `${(distance * 1000).toFixed(0)} ม.` : `${distance.toFixed(2)} กม.`;
};
export const formatTimeDistance = (seconds: number | null): string => {
  if (seconds === null || seconds < 0) return 'ไม่ระบุ';

  if (seconds < 60) {
    return `${Math.round(seconds)} วินาที`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes} นาที ${remainingSeconds > 0 ? `${remainingSeconds} วินาที` : ''}`.trim();
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} ชั่วโมง ${minutes > 0 ? `${minutes} นาที` : ''}`.trim();
  }
};

export const addCommas = (num: string | number): string => {
  const numStr = typeof num === 'number' ? num.toString() : num;
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function base64ToUint8ClampedArray(base64: string): ImageData {
  const cleanedBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  let binaryString: string;
  try {
    binaryString = atob(cleanedBase64);
  } catch (error) {
    throw new Error('Invalid base64 string');
  }
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  const { format, width, height } = getImageInfo(uint8Array);
  let imageData: Uint8ClampedArray;
  if (format === 'png') {
    imageData = removeAlphaChannel(uint8Array, width, height);
  } else {
    imageData = new Uint8ClampedArray(uint8Array);
  }

  return { data: imageData, width, height };
}

function getImageInfo(data: Uint8Array): { format: string; width: number; height: number } {
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
    const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
    return { format: 'png', width, height };
  }

  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    let offset = 2;
    while (offset < data.length) {
      if (data[offset] === 0xFF && data[offset + 1] === 0xC0) {
        const height = (data[offset + 5] << 8) | data[offset + 6];
        const width = (data[offset + 7] << 8) | data[offset + 8];
        return { format: 'jpeg', width, height };
      }
      offset += (data[offset + 2] << 8) | data[offset + 3];
    }
  }

  throw new Error('Unsupported image format');
}

function removeAlphaChannel(data: Uint8Array, width: number, height: number): Uint8ClampedArray {
  const rgbData = new Uint8ClampedArray(width * height * 3);
  let j = 0;
  for (let i = 0; i < data.length; i += 4) {
    rgbData[j] = data[i];     // R
    rgbData[j + 1] = data[i + 1]; // G
    rgbData[j + 2] = data[i + 2]; // B
    j += 3;
  }
  return rgbData;
}

export function decodePolyline(encoded: string): LatLng[] {
  const poly: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    const point: LatLng = {
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    };
    poly.push(point);
  }
  return poly;
}

export const generateRandomColors = (count: number) => {
  const colorOptions = [
    'red', 'green', 'yellow', 'purple', 'pink', 'indigo', 'teal', 'orange', 'cyan',
    'amber', 'emerald', 'violet', 'fuchsia', 'rose', 'sky', 'lime'
  ];
  const shades = ['400', '500'];

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return String(tw.color('blue-400'));
    }
    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    const shade = shades[Math.floor(Math.random() * shades.length)];
    return String(tw.color(`${color}-${shade}`));
  });
};

export const calculateForwardPosition = (location: LocationObject) => {
  const R = 6371;
  const d = 0.1;
  const lat1 = location.coords.latitude * Math.PI / 180;
  const lon1 = location.coords.longitude * Math.PI / 180;
  const bearing = (location.coords.heading || 0) * Math.PI / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d / R) +
    Math.cos(lat1) * Math.sin(d / R) * Math.cos(bearing)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(d / R) * Math.cos(lat1),
    Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    latitude: lat2 * 180 / Math.PI,
    longitude: lon2 * 180 / Math.PI
  };
};


// utils/notificationUtils.ts
import { Ionicons } from '@expo/vector-icons';
import { notifications, notifications_type } from '@/types/notifications';
import useShowToast from "@/hooks/useShowToast";

export const getNotificationIcon = (type: notifications_type): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case notifications_type.SYSTEM:
      return 'settings-outline';
    case notifications_type.CHAT:
      return 'chatbubbles-outline';
    case notifications_type.ORDER:
      return 'cart-outline';
    case notifications_type.PAYMENT:
      return 'card-outline';
    case notifications_type.PROMOTION:
      return 'pricetag-outline';
    case notifications_type.ANNOUNCEMENT:
      return 'megaphone-outline';
    case notifications_type.STATUS_UPDATE:
      return 'sync-outline';
    case notifications_type.REMINDER:
      return 'alarm-outline';
    case 'ALL':
      return 'notifications-outline';
    default:
      return 'notifications-outline';
  }
};

export const getNotificationTypeLabel = (type: notifications_type): string => {
  switch (type) {
    case notifications_type.SYSTEM:
      return 'ระบบ';
    case notifications_type.CHAT:
      return 'ข้อความ';
    case notifications_type.ORDER:
      return 'การจอง';
    case notifications_type.PAYMENT:
      return 'การชำระเงิน';
    case notifications_type.PROMOTION:
      return 'โปรโมชัน';
    case notifications_type.ANNOUNCEMENT:
      return 'ประกาศ';
    case notifications_type.STATUS_UPDATE:
      return 'อัพเดทสถานะ';
    case notifications_type.REMINDER:
      return 'แจ้งเตือน';
    case 'ALL':
      return 'ทั้งหมด';
    default:
      return 'อื่นๆ';
  }
};

export const getNotificationColor = (type: notifications_type): string => {
  switch (type) {
    case notifications_type.SYSTEM:
      return 'bg-blue-500';
    case notifications_type.CHAT:
      return 'bg-indigo-500';
    case notifications_type.ORDER:
      return 'bg-orange-500';
    case notifications_type.PAYMENT:
      return 'bg-green-500';
    case notifications_type.PROMOTION:
      return 'bg-purple-500';
    case notifications_type.ANNOUNCEMENT:
      return 'bg-yellow-500';
    case notifications_type.STATUS_UPDATE:
      return 'bg-teal-500';
    case notifications_type.REMINDER:
      return 'bg-red-500';
    case 'ALL':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export const formatNotificationTimestamp = (timestamp: string): string => {
  const now = new Date();
  const notificationDate = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / 1000 / 60);

  if (diffInMinutes < 1) {
    return 'เมื่อสักครู่';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} นาทีที่แล้ว`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ชั่วโมงที่แล้ว`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} วันที่แล้ว`;
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return notificationDate.toLocaleDateString('th-TH', options);
};

// สำหรับการแสดงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
export const getUnreadCount = (notifications: notifications[], type: notifications_type | 'ALL'): number => {
  const filtered = type === 'ALL'
    ? notifications
    : notifications.filter(n => n.type === type);

  return filtered.filter(n => n.status === 'UNREAD').length;
};

// สำหรับการจัดกลุ่มการแจ้งเตือน
export const groupNotificationsByType = (notifications: notifications[]): Record<notifications_type, notifications[]> => {
  return notifications.reduce((groups, notification) => {
    const type = notification.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(notification);
    return groups;
  }, {} as Record<notifications_type, notifications[]>);
};

// สำหรับการจัดเรียงการแจ้งเตือน
export const sortNotifications = (notifications: notifications[]): notifications[] => {
  return [...notifications].sort((a, b) => {
    // เรียงตาม unread ก่อน
    if (a.status === 'UNREAD' && b.status !== 'UNREAD') return -1;
    if (a.status !== 'UNREAD' && b.status === 'UNREAD') return 1;

    // จากนั้นเรียงตามเวลา
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export const copyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
  useShowToast("success", 'คัดลอกข้อมูลแล้ว', "");
};