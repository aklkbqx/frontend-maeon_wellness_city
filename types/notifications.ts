// Enum สำหรับประเภทการแจ้งเตือน
export enum notifications_type {
  SYSTEM = "SYSTEM",                   // แจ้งเตือนจากระบบ
  CHAT = "CHAT",                       // แจ้งเตือนข้อความใหม่
  ORDER = "ORDER",                     // แจ้งเตือนคำสั่งซื้อ
  PAYMENT = "PAYMENT",                 // แจ้งเตือนการชำระเงิน
  PROMOTION = "PROMOTION",             // แจ้งเตือนโปรโมชั่น
  ANNOUNCEMENT = "ANNOUNCEMENT",       // ประกาศจากแอพ
  STATUS_UPDATE = "STATUS_UPDATE",     // อัพเดทสถานะ
  REMINDER = "REMINDER"                // การแจ้งเตือนทั่วไป
}

// Interface สำหรับผู้รับการแจ้งเตือน
export interface NotificationReceiver {
  userId?: number | number[];          // ID ผู้ใช้หรือรายการ ID
  all: boolean;                        // ส่งถึงทุกคนหรือไม่
  role?: string | string[];           // บทบาทผู้ใช้หรือรายการบทบาท
}

// Interface สำหรับข้อมูลเพิ่มเติมของการแจ้งเตือน
export interface NotificationDataPayload {
  link?: string;                       // ลิงก์ที่จะนำทางไปเมื่อกดที่การแจ้งเตือน
  orderId?: number;                    // ID ของคำสั่งซื้อ (ถ้ามี)
  chatId?: number;                     // ID ของแชท (ถ้ามี)
  paymentId?: number;                  // ID ของการชำระเงิน (ถ้ามี)
  params?: Record<string, any>;        // พารามิเตอร์เพิ่มเติม
  [key: string]: any;                  // ข้อมูลเพิ่มเติมอื่นๆ
}

// Interface หลักสำหรับข้อมูลการแจ้งเตือน
export interface NotificationData {
  type: notifications_type;            // ประเภทการแจ้งเตือน
  title: string;                       // หัวข้อการแจ้งเตือน
  body: string;                        // เนื้อหาการแจ้งเตือน
  receive: NotificationReceiver;       // ข้อมูลผู้รับ
  data?: NotificationDataPayload;      // ข้อมูลเพิ่มเติม
}

// Interface สำหรับการตอบกลับจาก API
export interface NotificationResponse {
  success: boolean;
  message?: string;
  notifications: notifications[];
}

// Interface สำหรับการตอบกลับหลังจากทำการกับการแจ้งเตือน
export interface NotificationActionResponse {
  success: boolean;
  message?: string;
}

// Interface สำหรับข้อมูลการแจ้งเตือนในฐานข้อมูล
export interface notifications {
  id: number;
  type: notifications_type;
  title: string;
  body: string;
  data: string | null;
  status: "READ" | "UNREAD";
  created_at: string;
  updated_at: string | null;
}

export enum notifications_status {
  UNREAD = "UNREAD",
  READ = "READ",
  ARCHIVED = "ARCHIVED"
}