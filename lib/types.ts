export interface UserProfile {
  uid: string
  email: string
  fullName: string
  role: "user" | "admin"
  emailVerified: boolean
  cashbackBalance: number
  totalSpending: number
  totalOrders: number
  pendingOrders: number
  likedProducts: string[]
  createdAt: any
}

export interface Product {
  id: string
  name: string
  category?: string
  description: string
  fullDetails: string
  images: string[]
  normalPrice: number
  discountPrice: number
  hasDiscount: boolean
  externalLinks: string[]
  limitedToStates: string[]
  likes: number
  stockQuantity?: number
  lowStockThreshold?: number
  sku?: string
  isActive?: boolean
  isFeatured?: boolean
  media?: { type: "image" | "video"; url: string; thumbnailUrl?: string }[]
  createdAt: any
}

export interface CartItem {
  productId: string
  productName: string
  productImage: string
  price: number
  quantity: number
  selectedImages: string[]
}

export interface Order {
  id: string
  userId: string
  userEmail: string
  userName: string
  items: CartItem[]
  totalAmount: number
  amountPaid: number
  cashbackUsed: number
  paymentMethod: "cashback" | "direct" | "mixed"
  status: "pending_payment" | "payment_submitted" | "payment_verified" | "approved" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  shipmentDetails: ShipmentDetails
  paymentProof?: PaymentProof
  rejectionReason?: string
  createdAt: any
}

export interface ShipmentDetails {
  email: string
  alternativeEmail?: string
  phone: string
  alternativePhone: string
  state: string
  address: string
  landmarks: string
}

export interface PaymentProof {
  senderName: string
  imageUrl?: string
  submittedAt: any
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: any
  whatsappLink?: string
}

export interface Transaction {
  id: string
  userId: string
  type: "purchase" | "cashback_credit" | "cashback_debit"
  amount: number
  description: string
  orderId?: string
  createdAt: any
}

export const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

export const WHATSAPP_LINK = "https://wa.me/2349039226769"
export const BANK_DETAILS = {
  accountNumber: "9162141283",
  bankName: "Opay",
  accountName: "Chisom nnonyelu favour",
}
