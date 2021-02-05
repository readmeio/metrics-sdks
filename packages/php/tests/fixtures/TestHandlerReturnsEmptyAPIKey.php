<?php

namespace ReadMe\Tests\Fixtures;

use Illuminate\Http\Request;

class TestHandlerReturnsEmptyAPIKey implements \ReadMe\Handler
{
    public static function constructGroup(Request $request): array
    {
        return ['api_key' => ''];
    }
}
