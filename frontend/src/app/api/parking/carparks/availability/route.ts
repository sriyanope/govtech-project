import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Carpark availability API route called');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const NEXT_PUBLIC_BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    
    console.log(`Fetching from backend: ${NEXT_PUBLIC_BACKEND_API_URL}/v1/parking/carparks/availability?${queryString}`);
    
    // check if backend is reachable
    try {
      const healthCheck = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/docs`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) 
      });
      console.log('Backend health check status:', healthCheck.status);
    } catch (healthError) {
      console.error('Backend appears to be down:', healthError);
      return NextResponse.json(
        { 
          error: 'Backend service unavailable', 
          details: 'Please ensure the FastAPI backend is running on port 8000',
          carparks: [] // Return empty array so UI doesn't break
        },
        { status: 503 }
      );
    }
    
    const response = await fetch(
      `${NEXT_PUBLIC_BACKEND_API_URL}/v1/parking/carparks/availability?${queryString}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    );

    const responseText = await response.text();
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      console.error('Backend error response:', responseText.substring(0, 500));
      
      if (responseText.includes('<!DOCTYPE html>')) {
        return NextResponse.json(
          { 
            error: 'Backend endpoint not found', 
            details: 'The parking API endpoint does not exist on the backend',
            carparks: []
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: responseText, carparks: [] },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Response text:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', details: responseText.substring(0, 500), carparks: [] },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in carpark availability route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch carpark availability', 
        details: error instanceof Error ? error.message : 'Unknown error',
        carparks: []
      },
      { status: 500 }
    );
  }
}
