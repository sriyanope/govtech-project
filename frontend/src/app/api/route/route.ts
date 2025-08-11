import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract parameters, ensuring correct assignment
  const start_lat = searchParams.get('start_lat');
  const start_lon = searchParams.get('start_lon');
  const end_lat = searchParams.get('end_lat'); // Ensure this correctly maps to the latitude from the frontend
  const end_lon = searchParams.get('end_lon');   // Ensure this correctly maps to the longitude from the frontend
  const prefer_shelter = searchParams.get('prefer_shelter');

  // Validate essential parameters
  if (!start_lat || !start_lon || !end_lat || !end_lon) {
    return NextResponse.json(
      { error: 'Missing required coordinate parameters (start_lat, start_lon, end_lat, end_lon).' },
      { status: 400 }
    );
  }

  // Construct the backend URL using the correctly extracted parameters
  // Assuming your Python backend is running on localhost:8000
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/v1/navigation/route?start_lat=${start_lat}&start_lon=${start_lon}&end_lat=${end_lat}&end_lon=${end_lon}&prefer_shelter=${prefer_shelter}`;

  try {
    const response = await fetch(backendUrl);

    // If the backend responds with an error status, propagate it
    if (!response.ok) {
      const errorData = await response.json(); // Attempt to read error message from backend
      console.error('Backend error response:', errorData);
      throw new Error(`Backend responded with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching route from backend:', error);
    // Return a 500 status with the error message for debugging
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
