// Quick test to verify Supabase URL construction
const SUPABASE_URL = 'https://xerdtocgjurijragoydr.supabase.co';
const BUCKET = 'challenge-image';
const FILE_PATH = '1761291793907-d1mzs5hqit.jpg';

const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FILE_PATH}`;

console.log('Constructed URL:', publicUrl);
console.log('\nTest this URL in your browser:');
console.log(publicUrl);
console.log('\nIf you get 404, the bucket might not be public.');
console.log('Go to Supabase Dashboard > Storage > challenge-image > Settings');
console.log('Make sure "Public bucket" is enabled.');
