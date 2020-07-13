<?php
namespace ReadMe\Tests\Fixtures;

use Illuminate\Http\Request;

class TestHandler implements \ReadMe\Handler
{
    public static function constructGroup(Request $request): array
    {
        return [
            'id' => '123457890',
            'label' => 'username',
            'email' => 'email@example.com'
        ];
    }
}
