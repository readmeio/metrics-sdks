<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Your ReadMe secret
$secret = env('README_API_KEY');

Route::get('/', function () {
    return response()->json([
        'message' => 'hello world'
    ]);
});

Route::post('/', function () {
    return response()->noContent(200);
});

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
        'petstore_auth' => 'default-key',
        'basic_auth' => [
            'user' => 'user',
            'pass' => 'pass',
        ],
    ]);
});
