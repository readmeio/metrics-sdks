<?php

namespace ReadMe\Tests\Fixtures;

use Illuminate\Http\Request;

class TestHandlerReturnsEmptyId implements \ReadMe\Handler
{
    public static function constructGroup(Request $request): array
    {
        return ['id' => ''];
    }
}
