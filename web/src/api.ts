import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface ProductData {
  name: string;
  brand: string;
  image_url?: string;
  ingredients_raw?: string;
  ingredients_list?: any[];
  flagged_additives?: any[];
  nutrition_data?: {
    nutrients?: Record<string, any>;
    [key: string]: any;
  };
  // ...other fields as needed
}

export interface FetchProductResult {
  success: boolean;
  data?: ProductData;
  fromCache?: boolean;
  source?: string;
  suggestions?: string[];
  message?: string;
  barcode?: string;
}

export async function fetchProductData(barcode: string): Promise<FetchProductResult> {
  try {
    const response = await axios.get(`${BASE_URL}/api/products/${barcode}`);
    // Prefer backend fields, fallback logic can be added in the component if needed
    return response.data as FetchProductResult;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      message: error.message || 'Unknown error',
      barcode,
    };
  }
}

export async function contributeProduct(barcode: string, data: { name: string; brand?: string; image?: File }): Promise<any> {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.brand) formData.append('brand', data.brand);
  if (data.image) formData.append('image', data.image);

  try {
    const response = await axios.post(`${BASE_URL}/api/contribute/product/${barcode}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      message: error.message || 'Unknown error',
    };
  }
}

// Note: If ingredients_list or flagged_additives are missing from the backend response,
// fallback extraction logic should be implemented in the component using ingredients_raw. 