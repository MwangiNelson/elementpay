import { Order } from '@/types';

// In-memory storage for orders (shared across API routes)
export const orders = new Map<string, Order>();

