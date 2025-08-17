// Test de la fonction get-secrets
const testGetSecrets = async () => {
  try {
    // Récupérer l'URL Supabase depuis les variables d'environnement
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yrmvcqlyjuhnylmsihrr.supabase.co';
    
    // En environnement de test, vous devrez récupérer un vrai token JWT
    // Pour les tests, utilisez un token d'une session authentifiée
    const token = localStorage.getItem('supabase.auth.token') || 'YOUR_JWT_TOKEN_HERE';
    
    console.log('Testing Edge Function: get-secrets');
    console.log('Supabase URL:', supabaseUrl);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/get-secrets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: 'GEMINI_API_KEY' })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('Edge function response:', result);

    if (response.ok && result.value) {
      console.log('✅ Gemini API key retrieved successfully');
      console.log('Key length:', result.value.length);
      console.log('Key starts with AIza:', result.value.startsWith('AIza'));
      console.log('Timestamp:', result.timestamp);
    } else {
      console.error('❌ Failed to get API key:', result.error);
      
      if (response.status === 401) {
        console.error('🔒 Authentication required - please provide a valid JWT token');
      } else if (response.status === 429) {
        console.error('⏰ Rate limit exceeded - wait a minute before trying again');
      } else if (response.status === 403) {
        console.error('🚫 Key not allowed - only GEMINI_API_KEY is permitted');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Make sure you have a valid JWT token and the edge function is deployed');
  }
};

// Test de rate limiting
const testRateLimit = async () => {
  console.log('\n🔄 Testing rate limiting (5 requests per minute)...');
  
  for (let i = 1; i <= 7; i++) {
    console.log(`Request ${i}:`);
    await testGetSecrets();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
};

// Test avec une clé invalide
const testInvalidKey = async () => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yrmvcqlyjuhnylmsihrr.supabase.co';
    const token = localStorage.getItem('supabase.auth.token') || 'YOUR_JWT_TOKEN_HERE';
    
    console.log('\n🚫 Testing with invalid key...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/get-secrets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: 'INVALID_KEY' })
    });

    const result = await response.json();
    console.log('Response for invalid key:', result);
    
    if (response.status === 403) {
      console.log('✅ Invalid key properly rejected');
    } else {
      console.log('❌ Invalid key should be rejected with 403 status');
    }
  } catch (error) {
    console.error('❌ Invalid key test failed:', error);
  }
};

// Test sans authentification
const testNoAuth = async () => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yrmvcqlyjuhnylmsihrr.supabase.co';
    
    console.log('\n🔓 Testing without authentication...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/get-secrets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: 'GEMINI_API_KEY' })
    });

    const result = await response.json();
    console.log('Response without auth:', result);
    
    if (response.status === 401) {
      console.log('✅ Unauthorized request properly rejected');
    } else {
      console.log('❌ Unauthorized request should be rejected with 401 status');
    }
  } catch (error) {
    console.error('❌ No auth test failed:', error);
  }
};

// Exporter les fonctions de test
export { 
  testGetSecrets, 
  testRateLimit, 
  testInvalidKey, 
  testNoAuth 
};

// Fonction principale pour exécuter tous les tests
export const runAllTests = async () => {
  console.log('🧪 Starting Edge Function Tests for Chrono Couture\n');
  
  await testGetSecrets();
  await testInvalidKey();
  await testNoAuth();
  // Décommentez pour tester le rate limiting (ça prend du temps)
  // await testRateLimit();
  
  console.log('\n✅ All tests completed');
};

// Si le script est exécuté directement (pour les tests en ligne de commande)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllTests().catch(console.error);
}