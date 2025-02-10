<?php

// Your ReadMe secret
$secret = 'my-readme-secret';

// Add this code into your `routes/web.php` file.
Route::post('/webhook', function (\Illuminate\Http\Request $request) use ($secret) {
    // Verify the request is legitimate and came from ReadMe.
    $signature = $request->headers->get('readme-signature', '');

    try {
        \ReadMe\Webhooks::verify($request->input(), $signature, $secret);
    } catch (\Exception $e) {
        // Handle invalid requests
        return response()->json([
            'error' => $e->getMessage()
        ], 401);
    }

    // Fetch the user from the database and return their data for use with OpenAPI variables.
    // $user = DB::table('users')->where('email', $request->input('email'))->limit(1)->get();
    return response()->json([
        // OAS Security variables
        'keys' => [
            [
                'name' => 'api_key',
                'apiKey' => 'default-api_key-key',
            ],
            [
                'name' => 'http_basic',
                'user' => 'user',
                'pass' => 'pass',
            ],
            [
                'name' => 'http_bearer',
                'bearer' => 'default-http_bearer-key',
            ],
            [
                'oauth2' => 'default-oauth2-key',
            ],
        ]
    ]);
});
