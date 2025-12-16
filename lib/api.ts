import type { ApiResponse, BackendMenuItem, MenuItem } from './types.ts'
import { CATEGORY_MAP } from './types.ts'

// API Configuration - Updated to use port 3000 for Google Sheets backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/menu`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.ok
  } catch (error) {
    console.error('API connection test failed:', error)
    return false
  }
}

// Helper function to convert backend menu item to frontend format
function transformMenuItem(backendItem: BackendMenuItem): MenuItem {
  return {
    id: backendItem.id,
    name: backendItem.name,
    price: backendItem.price,
    category: CATEGORY_MAP[backendItem.category_id] || 'Other',
    description: backendItem.description,
    image: backendItem.image_url || `/images/menu/${getImageFileName(backendItem.name)}`,
    isAvailable: backendItem.is_available,
    preparationTime: backendItem.preparation_time_minutes
  }
}

// Helper function to convert menu item name to file name
function getImageFileName(itemName: string): string {
  return itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    + '.jpg'
}

// API Functions
export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    console.log('Fetching menu items from Google Sheets backend:', `${API_BASE_URL}/menu`);
    
    const response = await fetch(`${API_BASE_URL}/menu`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Menu API response not ok:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    // Backend returns: { success: true, sheet_used: "...", count: N, menu: [...] }
    const apiResponse: any = await response.json();
    console.log('Menu API response:', {
      success: apiResponse.success,
      sheet_used: apiResponse.sheet_used,
      count: apiResponse.count,
      items: apiResponse.menu?.length || 0
    });
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch menu items');
    }

    // Transform the menu items from the 'menu' field
    if (!apiResponse.menu || !Array.isArray(apiResponse.menu)) {
      throw new Error('Invalid menu data received from backend');
    }

    return apiResponse.menu.map(transformMenuItem);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

export async function fetchAvailableMenuItems(): Promise<MenuItem[]> {
  try {
    // Fetch all items and filter for available ones on the client side
    const allItems = await fetchMenuItems();
    return allItems.filter(item => item.isAvailable !== false);
  } catch (error) {
    console.error('Error fetching available menu items:', error)
    throw error
  }
}

export async function fetchMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
  try {
    // Fetch all items and filter by category on the client side
    const allItems = await fetchMenuItems();
    const categoryName = CATEGORY_MAP[categoryId];
    if (!categoryName) {
      throw new Error(`Invalid category ID: ${categoryId}`);
    }
    return allItems.filter(item => item.category === categoryName);
  } catch (error) {
    console.error('Error fetching menu items by category:', error)
    throw error
  }
} 