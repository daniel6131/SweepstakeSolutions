const fetch = require('node-fetch');

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE_URL = 'https://v3.football.api-sports.io';

// Helper to create response
const createResponse = (statusCode, body, cacheControl = 'public, max-age=86400') => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Cache-Control': cacheControl,
  },
  body: JSON.stringify(body),
});

// Helper to call API-Football
const callApiFootball = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
};

// Health check
module.exports.health = async (event) => {
  return createResponse(
    200,
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stage: process.env.STAGE,
    },
    'no-cache'
  );
};

// Get all fixtures
module.exports.fixtures = async (event) => {
  try {
    console.log('Fetching World Cup 2022 fixtures...');
    const fixtures = await callApiFootball('/fixtures?league=1&season=2022');

    return createResponse(200, fixtures);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return createResponse(500, { error: 'Failed to fetch fixtures' });
  }
};

// Get single fixture by ID
module.exports.fixture = async (event) => {
  try {
    const fixtureId = event.pathParameters?.id;

    if (!fixtureId) {
      return createResponse(400, { error: 'Fixture ID required' });
    }

    console.log(`Fetching fixture ${fixtureId}...`);
    const fixtures = await callApiFootball(`/fixtures?id=${fixtureId}`);

    if (!fixtures || fixtures.length === 0) {
      return createResponse(404, { error: 'Fixture not found' });
    }

    // Shorter cache for live updates
    return createResponse(200, fixtures[0], 'public, max-age=300');
  } catch (error) {
    console.error('Error fetching fixture:', error);
    return createResponse(500, { error: 'Failed to fetch fixture' });
  }
};

// Get standings
module.exports.standings = async (event) => {
  try {
    console.log('Fetching World Cup 2022 standings...');
    const standings = await callApiFootball('/standings?league=1&season=2022');

    return createResponse(200, standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return createResponse(500, { error: 'Failed to fetch standings' });
  }
};
