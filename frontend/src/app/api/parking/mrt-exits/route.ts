import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const NEXT_PUBLIC_BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    
    const response = await fetch(
      `${NEXT_PUBLIC_BACKEND_API_URL}/v1/parking/mrt-exits?${queryString}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Backend error:', responseText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching MRT exits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MRT exits' },
      { status: 500 }
    );
  }
}