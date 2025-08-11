import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  
  try {
    // Fetch both weather data and apparent temperature in parallel
    const [weatherResponse, apparentTempResponse] = await Promise.all([
      fetch(`${backendUrl}/v1/weather/full`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${backendUrl}/v1/apparent-temperature`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    // Check if weather response is ok
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error(`Backend error: ${weatherResponse.status} ${weatherResponse.statusText} - ${errorText}`);
      return new NextResponse(errorText, { status: weatherResponse.status, statusText: weatherResponse.statusText });
    }

    const weatherData = await weatherResponse.json();
    
    // Try to get apparent temperature, but don't fail if it's not available
    let apparentTemp = null;
    if (apparentTempResponse.ok) {
      try {
      const apparentTempJson = await apparentTempResponse.json();
      // Check if response has the expected structure with code 0
      if (
        apparentTempJson?.code === 0 &&
        Array.isArray(apparentTempJson?.data?.readings) &&
        apparentTempJson.data.readings.length > 0 &&
        Array.isArray(apparentTempJson.data.readings[0]?.data) &&
        apparentTempJson.data.readings[0].data.length > 0 &&
        typeof apparentTempJson.data.readings[0].data[0].value !== 'undefined'
      ) {
        apparentTemp = apparentTempJson.data.readings[0].data[0].value;
      } else {
        console.warn('Apparent temperature response structure unexpected:', apparentTempJson);
      }
      } catch (error) {
      console.warn('Failed to parse apparent temperature data:', error);
      }
    } else {
      console.warn('Failed to fetch apparent temperature:', apparentTempResponse.status);
    }

    // Combine the data
    const combinedData = {
      ...weatherData,
      apparentTemperature: apparentTemp
    };

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}