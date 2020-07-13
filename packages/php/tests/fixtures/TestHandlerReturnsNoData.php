<?php
namespace ReadMe\Tests\Fixtures;

use Illuminate\Http\Request;

class TestHandlerReturnsNoData implements \ReadMe\Handler
{
    public static function constructGroup(Request $request): array
    {
        return [];
    }
}
